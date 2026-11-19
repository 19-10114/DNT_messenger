'use client';

import React from 'react';
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
import { useApprovalPendingByModel } from '@/hooks/approvals';
import {
  GeneralBikeInventoryItem,
  BranchBikeInventory,
} from '@/services/products/types/GeneralBikeInventory';

interface GeneralBikeInventorySectionProps {
  generalBikeInventory: any;
  getGeneralBikeInventoryData: () => any;
}

export function GeneralBikeInventorySection({
  generalBikeInventory,
  getGeneralBikeInventoryData,
}: GeneralBikeInventorySectionProps): JSX.Element {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const productsService = new ProductsService();

  // Función para obtener toda la data sin paginación y aplanar los modelos
  const getAllGeneralBikeData = async (): Promise<
    GeneralBikeInventoryItem[]
  > => {
    if (!token || !currentBranchId) return [];

    try {
      const response = await productsService.getGeneralBikeInventory(
        token,
        currentBranchId.toString(),
        { pageSize: '10000', page: '1' } // Obtener todos los datos
      );
      const branches = response.data?.results || [];
      const allModels: GeneralBikeInventoryItem[] = [];
      branches.forEach((branch: BranchBikeInventory) => {
        allModels.push(...branch.models);
      });
      return allModels;
    } catch (error) {
      console.error('Error fetching all general bike data:', error);
      return [];
    }
  };

  // La data se aplana acá: la API devuelve sucursales, la tabla muestra modelos
  const rawData = getGeneralBikeInventoryData();
  const branches: BranchBikeInventory[] = Array.isArray(rawData)
    ? rawData
    : rawData?.results || [];
  const models: GeneralBikeInventoryItem[] = branches.flatMap(
    (branch) => branch.models || []
  );
  // "Por recibir de Empire": lo aprobado para esta sucursal que no llegó.
  // Con el interruptor prendido, los modelos sin stock pero con motos en
  // camino aparecen también, con cantidad 0.
  const [showPending, setShowPending] = useShowEmpirePending();
  const { pendingByProduct, pendingModels } = useApprovalPendingByModel(
    currentBranchId,
    showPending
  );
  const rows: GeneralBikeInventoryItem[] = showPending
    ? [
        ...models,
        ...pendingModels
          .filter((row) => !models.some((model) => model.id === row.productId))
          .map((row) => ({
            id: row.productId,
            model: row.product.model || row.product.name,
            brand: row.product.brand,
            colors: [],
            totalQuantity: 0,
          })),
      ]
    : models;
  const currentPage = Array.isArray(rawData) ? 1 : rawData?.currentPage || 1;
  const totalPages = Array.isArray(rawData) ? 1 : rawData?.totalPages || 1;

  const columns: GenericTableColumn<GeneralBikeInventoryItem>[] = [
    { key: 'model', header: 'Modelo' },
    { key: 'brand', header: 'Marca' },
    {
      key: 'colors',
      header: 'Colores',
      align: 'center',
      render: (item) => <ColorCircles colors={item.colors} />,
    },
    {
      key: 'totalQuantity',
      header: 'Cantidad Total',
      align: 'center',
      render: (item) => {
        const pending = pendingByProduct.get(item.id) ?? 0;
        return showPending && pending > 0 ? (
          <span>
            {item.totalQuantity}{' '}
            <span className="font-semibold text-amber-700">(+{pending})</span>
          </span>
        ) : (
          item.totalQuantity
        );
      },
    },
    {
      key: 'pending',
      header: 'Por recibir',
      align: 'center',
      hidden: !showPending,
      className: 'tabular-nums text-amber-700',
      render: (item) => pendingByProduct.get(item.id) || '-',
    },
  ];

  const exportData = models.map((item) => ({
    Modelo: item.model,
    Marca: item.brand,
    Colores: item.colors
      .map((color) => `${color.color}: ${color.quantity}`)
      .join(', '),
    'Cantidad Total': item.totalQuantity,
  }));

  if (generalBikeInventory.isError) {
    return (
      <div className="text-red-500">
        Error al cargar el inventario general de motos
      </div>
    );
  }

  return (
    <GenericTable<GeneralBikeInventoryItem>
      columns={columns}
      data={rows}
      // Un mismo modelo puede venir de varias sucursales, así que el id no basta
      getRowKey={(item, index) => `${item.id}-${index}`}
      isLoading={generalBikeInventory.isLoading}
      emptyMessage="No hay datos de inventario general de motos para mostrar."
      toolbar={
        <div className="flex items-center gap-4">
          <ApprovalPendingToggle
            id="general-inventory-empire-pending"
            checked={showPending}
            onChange={setShowPending}
          />
          {generalBikeInventory.isFetching && (
            <span className="text-sm text-muted-foreground">
              Actualizando...
            </span>
          )}
        </div>
      }
      pagination={{
        currentPage,
        totalPages,
        onPageChange: (page) => generalBikeInventory.pagination.setPage(page),
      }}
      footer={
        models.length > 0 ? (
          <ExportButton
            data={exportData}
            title="Descargar Inventario General de Motos"
            getAllData={async () => {
              const allData = await getAllGeneralBikeData();
              return allData.map((item) => ({
                Modelo: item.model,
                Marca: item.brand,
                Colores: item.colors
                  .map((color) => `${color.color}: ${color.quantity}`)
                  .join(', '),
                'Cantidad Total': item.totalQuantity,
              }));
            }}
          />
        ) : null
      }
    />
  );
}
