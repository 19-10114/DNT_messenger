'use client';

import React, { useEffect } from 'react';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { ColorCircles } from '@/components/tables/colorCircles.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import {
  ApprovalPendingToggle,
  useShowEmpirePending,
} from '@/components/approvals/approvalPendingToggle.component';
import { useApprovalPendingUnits } from '@/hooks/approvals';
import {
  BranchBikeInventory,
  BikeModel,
} from '@/services/products/types/AdminBikeInventory';

interface AdminBikeInventorySectionProps {
  adminBikeInventory: any;
  getAdminBikeInventoryData: () => any;
}

/**
 * Vista admin (sucursal 0) del inventario general: una fila por sucursal y una
 * columna por modelo, con la cantidad por color en cada cruce.
 */
export function AdminBikeInventorySection({
  adminBikeInventory,
  getAdminBikeInventoryData,
}: AdminBikeInventorySectionProps): JSX.Element {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const productsService = new ProductsService();

  // Función para obtener toda la data sin paginación
  const getAllAdminBikeData = async (): Promise<BranchBikeInventory[]> => {
    if (!token || !currentBranchId) return [];

    try {
      const response = await productsService.getGeneralBikeInventory(
        token,
        currentBranchId.toString(),
        { pageSize: '10000', page: '1' } // Obtener todos los datos
      );
      return response.data?.results || [];
    } catch (error) {
      console.error('Error fetching all admin bike data:', error);
      return [];
    }
  };

  // La data se arma acá, no dentro de la tabla genérica
  const rawData = getAdminBikeInventoryData();
  const branches: BranchBikeInventory[] = Array.isArray(rawData)
    ? rawData
    : rawData?.results || [];
  const currentPage = Array.isArray(rawData) ? 1 : rawData?.currentPage || 1;
  const totalPages = Array.isArray(rawData) ? 1 : rawData?.totalPages || 1;

  const findModelInBranch = (
    branch: BranchBikeInventory,
    modelId: number
  ): BikeModel | undefined =>
    branch.models.find((model) => model.id === modelId);

  // Modelos únicos de todas las sucursales: son las columnas de la matriz.
  // Sin memo a propósito: `branches` se rearma en cada render, así que
  // memoizarlo no ahorraría nada sobre un puñado de sucursales.
  const modelMap = new Map<number, BikeModel>();
  branches.forEach((branch) => {
    branch.models.forEach((model) => modelMap.set(model.id, model));
  });
  const allModels = Array.from(modelMap.values()).sort((a, b) =>
    a.model.localeCompare(b.model)
  );

  // Total por modelo a través de todas las sucursales
  const columnTotals: Record<number, number> = {};
  branches.forEach((branch) => {
    branch.models.forEach((model) => {
      columnTotals[model.id] =
        (columnTotals[model.id] || 0) +
        model.colors.reduce((sum, color) => sum + color.quantity, 0);
    });
  });

  // "Por recibir de Empire" por sucursal y modelo (la matriz de "Motos por
  // recibir"), solo con el interruptor prendido.
  const [showPending, setShowPending] = useShowEmpirePending();
  const { pendingMatrix } = useApprovalPendingUnits(showPending);
  // Con el interruptor prendido el backend trae también las sucursales y los
  // modelos que hoy están en 0 pero tienen motos por recibir, para que su
  // "+N" tenga fila y columna donde pintarse.
  const setPending = adminBikeInventory.setPending;
  useEffect(() => {
    setPending?.(showPending);
  }, [showPending, setPending]);
  const pendingFor = (branchId: number, productId?: number): number => {
    if (!showPending || !pendingMatrix) return 0;
    const row = pendingMatrix.branches.find(
      (entry) => entry.branch.id === branchId
    );
    if (!row) return 0;
    if (productId === undefined) return row.total;
    const index = pendingMatrix.products.findIndex(
      (entry) => entry.product.id === productId
    );
    return index >= 0 ? row.cells[index] : 0;
  };

  const columns: GenericTableColumn<BranchBikeInventory>[] = [
    {
      key: 'branchName',
      header: 'Sucursal',
      width: '13rem',
      // Queda fija al scrollear horizontalmente entre modelos
      sticky: true,
      summary: 'Total General',
      className: 'font-medium text-gray-900',
      render: (branch) => {
        const pending = pendingFor(branch.branchId);
        return (
          <span>
            {branch.branchName} ({branch.branchTotal}
            {pending > 0 && (
              <span className="font-semibold text-amber-700"> +{pending}</span>
            )}
            )
          </span>
        );
      },
    },
    ...allModels.map<GenericTableColumn<BranchBikeInventory>>((model) => ({
      key: `model-${model.id}`,
      header: (
        <div className="flex flex-col items-center">
          <span>{model.model}</span>
          <span className="text-[10px] font-normal normal-case opacity-70">
            {model.brand}
          </span>
        </div>
      ),
      align: 'center',
      headerClassName: 'min-w-[8rem]',
      summary: columnTotals[model.id] || 0,
      // Rojo cuando la sucursal no tiene el modelo o algún color sin hex
      cellClassName: (branch) => {
        const foundModel = findModelInBranch(branch, model.id);
        // En 0 (sólo por recibir) se pinta como "no la tiene".
        if (!foundModel || foundModel.colors.length === 0) return 'bg-red-50';
        return foundModel.colors.some((color) => !color.colorHex)
          ? 'bg-red-100'
          : undefined;
      },
      render: (branch) => {
        const foundModel = findModelInBranch(branch, model.id);
        const pending = pendingFor(branch.branchId, model.id);
        return (
          <div className="flex flex-col items-center gap-0.5">
            {foundModel && foundModel.colors.length > 0 ? (
              <ColorCircles colors={foundModel.colors} />
            ) : (
              <span className="font-medium text-red-600">-</span>
            )}
            {pending > 0 && (
              <span
                className="text-xs font-semibold text-amber-700"
                title="Por recibir de Empire"
              >
                +{pending}
              </span>
            )}
          </div>
        );
      },
    })),
  ];

  const exportData = branches.map((branch) => {
    const row: Record<string, any> = {
      Sucursal: branch.branchName,
      'Total Sucursal': branch.branchTotal,
    };

    allModels.forEach((model) => {
      const foundModel = findModelInBranch(branch, model.id);
      row[model.model] = foundModel
        ? foundModel.colors
            .map((color) => `${color.color}: ${color.quantity}`)
            .join(', ')
        : 'No disponible';
    });

    return row;
  });

  if (adminBikeInventory.isError) {
    return (
      <div className="text-red-500">
        Error al cargar el inventario general de motos (Admin)
      </div>
    );
  }

  return (
    <GenericTable<BranchBikeInventory>
      columns={columns}
      data={branches}
      getRowKey={(branch) => branch.branchId}
      isLoading={adminBikeInventory.isLoading}
      emptyMessage="No hay datos de inventario general de motos para mostrar."
      toolbar={
        <div className="flex items-center gap-4">
          <ApprovalPendingToggle
            id="admin-inventory-empire-pending"
            checked={showPending}
            onChange={setShowPending}
          />
          {adminBikeInventory.isFetching && (
            <span className="text-sm text-muted-foreground">
              Actualizando...
            </span>
          )}
        </div>
      }
      pagination={{
        currentPage,
        totalPages,
        onPageChange: (page) => adminBikeInventory.pagination.setPage(page),
      }}
      footer={
        branches.length > 0 ? (
          <ExportButton
            data={exportData}
            title="Descargar Inventario General de Motos (Admin)"
            getAllData={async () => {
              const allData = await getAllAdminBikeData();
              const allModelsExport = Array.from(
                new Map(
                  allData.flatMap((branch) =>
                    branch.models.map(
                      (model) => [model.id, model] as [number, BikeModel]
                    )
                  )
                ).values()
              ).sort((a, b) => a.model.localeCompare(b.model));

              return allData.map((branch) => {
                const row: Record<string, any> = {
                  Sucursal: branch.branchName,
                  'Total Sucursal': branch.branchTotal,
                };

                allModelsExport.forEach((model) => {
                  const foundModel = branch.models.find(
                    (m) => m.id === model.id
                  );
                  row[model.model] = foundModel
                    ? foundModel.colors
                        .map((color) => `${color.color}: ${color.quantity}`)
                        .join(', ')
                    : 'No disponible';
                });

                return row;
              });
            }}
          />
        ) : null
      }
    />
  );
}
