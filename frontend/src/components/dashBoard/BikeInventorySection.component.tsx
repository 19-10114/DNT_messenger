'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { SearchInput } from '@/components/ui/searchInput.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import BikeDetailsModal from '@/components/modals/bikeDetailsModal.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { ApprovalPendingBadge } from '@/components/approvals/approvalPendingBadge.component';
import { BranchesResults } from '@/services/transactions/types/GetAllTransactions';
import { consumeUsedBikeReturn } from '@/utils/usedBikeReturn.utils';
import { formatDate, usdFormatCurrency } from '@/lib/utils';

interface BikeInventorySectionProps {
  bikeInventory: any;
  getBikeInventoryData: () => any;
  isGeneralInventory?: boolean;
}

export function BikeInventorySection({
  bikeInventory,
  getBikeInventoryData,
  isGeneralInventory = false,
}: BikeInventorySectionProps): JSX.Element {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const productsService = new ProductsService();
  const pathname = usePathname();

  const [selectedBike, setSelectedBike] = useState<BranchesResults | null>(
    null
  );
  const [isBikeModalOpen, setIsBikeModalOpen] = useState(false);

  const showBranch = currentBranchId === 0 || isGeneralInventory;

  /**
   * Al volver de la ficha de una moto usada se reabre el modal con la fila que
   * quedó anotada. Viene guardada entera porque la paginación es estado del
   * servidor: al volver se está en la página 1 y la fila podría no estar.
   */
  useEffect(() => {
    const pending = consumeUsedBikeReturn(pathname);
    if (!pending) return;

    setSelectedBike(pending);
    setIsBikeModalOpen(true);
  }, [pathname]);

  // Función para obtener toda la data sin paginación
  const getAllBikeData = async () => {
    if (!token) return [];

    const branchId = isGeneralInventory ? '0' : currentBranchId?.toString();
    if (!branchId) return [];

    try {
      const response = isGeneralInventory
        ? await productsService.getGeneralBikeInventory(
            token,
            branchId,
            { pageSize: '10000', page: '1' } // Obtener todos los datos
          )
        : await productsService.getBikeInventory(
            token,
            branchId,
            { pageSize: '10000', page: '1' } // Obtener todos los datos
          );

      if (isGeneralInventory) {
        // Para inventario general, aplanar los modelos de todas las sucursales
        const branches = response.data?.results || [];
        const allModels: any[] = [];
        branches.forEach((branch: any) => {
          if (branch.models && Array.isArray(branch.models)) {
            allModels.push(...branch.models);
          }
        });
        return allModels;
      }

      return response.data?.results || [];
    } catch (error) {
      console.error('Error fetching all bike data:', error);
      return [];
    }
  };

  // La data se arma acá, no dentro de la tabla genérica
  const inventory = getBikeInventoryData();
  const bikes: BranchesResults[] = Array.isArray(inventory)
    ? inventory
    : inventory?.results || [];
  const currentPage = Array.isArray(inventory)
    ? 1
    : inventory?.currentPage || 1;
  const totalPages = Array.isArray(inventory) ? 1 : inventory?.totalPages || 1;

  const handleOpenBike = (bike: BranchesResults) => {
    setSelectedBike(bike);
    setIsBikeModalOpen(true);
  };

  const columns: GenericTableColumn<BranchesResults>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '5rem',
      // Al hacer click en el ID se abre la ficha de la moto
      onCellClick: handleOpenBike,
    },
    { key: 'plate', header: 'Placa' },
    {
      key: 'name',
      header: 'Nombre',
      render: (bike) => bike.product?.name,
    },
    {
      key: 'brand',
      header: 'Marca',
      render: (bike) => bike.product?.brand,
    },
    { key: 'color', header: 'Color' },
    {
      key: 'activated',
      header: 'Activada',
      align: 'center',
      render: (bike) => (bike.activated ? '✓' : '-'),
    },
    {
      key: 'targetBranch',
      header: 'Sucursal',
      hidden: !showBranch,
      render: (bike) => bike.targetBranch?.name || 'N/A',
    },
  ];

  const exportData = bikes.map((item) => ({
    ID: item.id,
    Placa: item.plate,
    Nombre: item.product.name,
    Marca: item.product.brand,
    Color: item.color,
    Activada: item.activated ? '✓' : '-',
    ...(showBranch ? { Sucursal: item.targetBranch?.name || 'N/A' } : {}),
  }));

  return (
    <div>
      {/* Filtros: viven fuera de la tabla y nunca se desmontan, así el input
          no pierde el foco cuando la consulta se vuelve a lanzar. */}
      <div className="mb-4">
        <SearchInput
          placeholder="Buscar motos por nombre, marca, modelo, placa..."
          onSearch={(searchTerm) => {
            bikeInventory.setSearch(searchTerm);
          }}
          initialValue={bikeInventory.queryParameters?.search || ''}
          className="max-w-md"
        />
      </div>

      {/* El estado lo manda la consulta, no un useState aparte */}
      <div className="mb-4 flex items-center gap-2">
        <Checkbox
          id="bike-inventory-used"
          checked={bikeInventory.queryParameters?.used === 'true'}
          onCheckedChange={(checked) =>
            bikeInventory.setUsed?.(checked === true)
          }
        />
        <label
          htmlFor="bike-inventory-used"
          className="text-sm cursor-pointer select-none"
        >
          Motos Usadas
        </label>
        <span className="ml-auto">
          <ApprovalPendingBadge />
        </span>
      </div>

      {bikeInventory.isError ? (
        <div className="text-red-500">
          Error al cargar el inventario{' '}
          {isGeneralInventory ? 'general de' : 'de'} motos
        </div>
      ) : (
        <GenericTable<BranchesResults>
          columns={columns}
          data={bikes}
          isLoading={bikeInventory.isLoading}
          emptyMessage="No hay datos de motos para mostrar."
          toolbar={
            bikeInventory.isFetching ? (
              <span className="text-sm text-muted-foreground">
                Actualizando...
              </span>
            ) : null
          }
          pagination={{
            currentPage,
            totalPages,
            onPageChange: (page) => bikeInventory.pagination.setPage(page),
          }}
          footer={
            bikes.length > 0 ? (
              <ExportButton
                data={exportData}
                title="Descargar Inventario de Motos"
                getAllData={async () => {
                  const allData = await getAllBikeData();
                  return allData.map((item: BranchesResults) => ({
                    ID: item.id,
                    Monto: usdFormatCurrency(item.amount),
                    Placa: item.plate,
                    Nombre: item.product.name,
                    Marca: item.product.brand,
                    Modelo: item.product.model,
                    Color: item.color,
                    'Serial del Motor': item.serialNumber,
                    Año: item.year,
                    'Fecha de Recepción': formatDate(item.receptionDate),
                    ...(showBranch
                      ? { Sucursal: item.targetBranch?.name || 'N/A' }
                      : {}),
                  }));
                }}
              />
            ) : null
          }
        />
      )}

      <BikeDetailsModal
        bike={selectedBike}
        open={isBikeModalOpen}
        onOpenChange={setIsBikeModalOpen}
      />
    </div>
  );
}
