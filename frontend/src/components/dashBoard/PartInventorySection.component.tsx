'use client';

import React, { useState } from 'react';
import { ProductsService } from '@/services/products/products.service';
import { useToken, useRoles } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { PartInventoryBranchModal } from '@/components/modals/PartInventoryBranchModal.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { PartInventoryData } from '@/services/transactions/types/GetAllTransactions';

interface PartInventorySectionProps {
  partInventory: any;
  getPartInventoryData: () => any;
}

export function PartInventorySection({
  partInventory,
  getPartInventoryData,
}: PartInventorySectionProps): JSX.Element {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const productsService = new ProductsService();
  const roles = useRoles();
  const isAdmin = roles.includes('admin');

  const [modalData, setModalData] = useState<{
    sku: string;
    name: string;
    model: string;
    price: number;
    cost: number;
  } | null>(null);

  // Función para obtener toda la data sin paginación
  const getAllPartData = async () => {
    if (!token || !currentBranchId) return [];

    try {
      const response = await productsService.getPartInventory(
        token,
        currentBranchId.toString(),
        { pageSize: '10000', page: '1' } // Obtener todos los datos
      );
      return response.data?.results || [];
    } catch (error) {
      console.error('Error fetching all part data:', error);
      return [];
    }
  };

  // La data se arma acá, no dentro de la tabla genérica
  const inventory = getPartInventoryData();
  const parts: PartInventoryData[] = Array.isArray(inventory)
    ? inventory
    : inventory?.results || [];
  const currentPage = Array.isArray(inventory)
    ? 1
    : inventory?.currentPage || 1;
  const totalPages = Array.isArray(inventory) ? 1 : inventory?.totalPages || 1;

  const formatMoney = (value?: number) =>
    typeof value === 'number' ? `$${value.toFixed(2)}` : 'No disponible';

  const columns: GenericTableColumn<PartInventoryData>[] = [
    { key: 'id', header: 'ID', width: '5rem' },
    { key: 'name', header: 'Nombre del Producto' },
    { key: 'sku', header: 'SKU' },
    { key: 'model', header: 'Modelo' },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'center',
      render: (part) => part.quantity || '0',
    },
    {
      key: 'globalQuantity',
      header: 'Cantidad Global',
      align: 'center',
      render: (part) => part.globalQuantity || '0',
    },
    {
      key: 'price',
      header: 'Precio',
      align: 'right',
      render: (part) => formatMoney(part.price),
    },
  ];

  const exportData = parts.map((item) => ({
    ID: item.id,
    'Nombre del Producto': item.name,
    SKU: item.sku,
    Modelo: item.model,
    Cantidad: item.quantity || '0',
    'Cantidad Global': item.globalQuantity || '0',
    Precio: formatMoney(item.price),
    ...(isAdmin && { Costo: formatMoney(item.cost) }),
  }));

  return (
    <div>
      {/* Buscador: vive fuera de la tabla y nunca se desmonta, así el input no
          pierde el foco cuando la consulta se vuelve a lanzar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput
          placeholder="Buscar repuestos por nombre, marca, modelo, SKU..."
          onSearch={(searchTerm) => {
            partInventory.setSearch(searchTerm);
          }}
          initialValue={partInventory.queryParameters?.search || ''}
          className="max-w-md"
        />
      </div>

      {partInventory.isError ? (
        <div className="text-red-500">
          Error al cargar el inventario de repuestos
        </div>
      ) : (
        <GenericTable<PartInventoryData>
          columns={columns}
          data={parts}
          isLoading={partInventory.isLoading}
          emptyMessage="No hay datos de repuestos para mostrar."
          // Toda la fila abre el desglose por sucursal, no solo el ID
          onRowClick={(part) =>
            setModalData({
              sku: part.sku,
              name: part.name,
              model: part.model,
              price: part.price,
              cost: part.cost,
            })
          }
          toolbar={
            partInventory.isFetching ? (
              <span className="text-sm text-muted-foreground">
                Actualizando...
              </span>
            ) : null
          }
          pagination={{
            currentPage,
            totalPages,
            onPageChange: (page) => partInventory.pagination.setPage(page),
          }}
          footer={
            parts.length > 0 ? (
              <ExportButton
                data={exportData}
                title="Descargar Inventario de Repuestos"
                getAllData={async () => {
                  const allData = await getAllPartData();
                  return allData.map((item: PartInventoryData) => ({
                    ID: item.id,
                    'Nombre del Producto': item.name,
                    SKU: item.sku,
                    Modelo: item.model,
                    Marca: item.brand,
                    Cantidad: item.quantity || '0',
                    // El export mandaba `price` bajo la etiqueta "Costo"
                    ...(isAdmin && { Costo: formatMoney(item.cost) }),
                  }));
                }}
              />
            ) : null
          }
        />
      )}

      <PartInventoryBranchModal
        isOpen={!!modalData}
        onClose={() => setModalData(null)}
        sku={modalData?.sku ?? ''}
        productName={modalData?.name ?? ''}
        productModel={modalData?.model ?? ''}
        price={modalData?.price ?? 0}
        // Mismo criterio que la columna "Costo" de la tabla: solo admin.
        cost={isAdmin ? (modalData?.cost ?? 0) : undefined}
      />
    </div>
  );
}
