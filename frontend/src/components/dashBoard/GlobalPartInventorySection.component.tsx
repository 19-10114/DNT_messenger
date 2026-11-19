'use client';

import React from 'react';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useGlobalPartInventory } from '@/hooks/useGlobalPartInventory';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useToast } from '@/components/ui/use-toast';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { GlobalPartInventoryItem } from '@/services/products/types/GlobalPartInventory';

export function GlobalPartInventorySection(): JSX.Element {
  const token = useToken();
  const productsService = new ProductsService();
  const { toast } = useToast();

  const globalPartInventory = useGlobalPartInventory({
    page: '1',
    pageSize: '10',
    search: '',
  });

  // Obtener todas las sucursales
  const { data: branches, isLoading: isLoadingBranches } = useAllBranches();

  // Función para obtener toda la data sin paginación
  const getAllGlobalPartData = async (): Promise<GlobalPartInventoryItem[]> => {
    if (!token) return [];

    try {
      const response = await productsService.getGlobalPartInventory(token, {
        pageSize: '10000',
        page: '1',
        search: globalPartInventory.queryParameters?.search || '',
      });
      return response.data?.results || [];
    } catch (error) {
      console.error('Error fetching all global part data:', error);
      toast({
        title: 'Error',
        description: 'Error al obtener todos los datos del inventario',
        variant: 'destructive',
      });
      return [];
    }
  };

  // La data se arma acá, no dentro de la tabla genérica
  const products: GlobalPartInventoryItem[] =
    globalPartInventory.data?.results || [];
  const currentPage = globalPartInventory.data?.currentPage || 1;
  const totalPages = globalPartInventory.data?.totalPages || 1;
  const branchList = branches || [];

  /** Cantidad de un producto en una sucursal. */
  const getQuantity = (
    product: GlobalPartInventoryItem,
    branchId: number
  ): number =>
    product.branches.find((branch) => branch.branchId === branchId)?.quantity ||
    0;

  // Una columna por sucursal, armadas desde la data
  const columns: GenericTableColumn<GlobalPartInventoryItem>[] = [
    { key: 'productId', header: 'ID', width: '5rem', align: 'center' },
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Nombre del Producto', width: '18rem' },
    { key: 'model', header: 'Modelo' },
    ...branchList.map<GenericTableColumn<GlobalPartInventoryItem>>(
      (branch) => ({
        key: `branch-${branch.id}`,
        header: branch.name,
        align: 'center',
        headerClassName: 'min-w-[6rem]',
        render: (product) => {
          const quantity = getQuantity(product, branch.id);
          return quantity > 0 ? quantity : '-';
        },
      })
    ),
  ];

  const buildExportRow = (product: GlobalPartInventoryItem) => {
    const row: Record<string, string | number> = {
      ID: product.productId,
      SKU: product.sku,
      'Nombre del Producto': product.name,
      Modelo: product.model,
    };

    branchList.forEach((branch) => {
      row[branch.name] = getQuantity(product, branch.id);
    });

    return row;
  };

  if (globalPartInventory.isError) {
    return (
      <div className="text-red-500">
        Error al cargar el inventario global de repuestos
      </div>
    );
  }

  return (
    <div>
      {/* Buscador: fuera de la tabla, para que no se desmonte al refrescar */}
      <div className="mb-4">
        <SearchInput
          placeholder="Buscar repuestos por nombre, SKU, modelo..."
          onSearch={(searchTerm) => {
            globalPartInventory.setSearch(searchTerm);
          }}
          initialValue={globalPartInventory.queryParameters?.search || ''}
          className="max-w-md"
        />
      </div>

      {!isLoadingBranches && branchList.length === 0 ? (
        <div className="text-yellow-500">
          No hay sucursales disponibles para mostrar el inventario
        </div>
      ) : (
        <GenericTable<GlobalPartInventoryItem>
          columns={columns}
          data={products}
          getRowKey={(product) => product.productId}
          isLoading={globalPartInventory.isLoading || isLoadingBranches}
          emptyMessage="No hay datos de inventario global de repuestos para mostrar."
          toolbar={
            globalPartInventory.isFetching ? (
              <span className="text-sm text-muted-foreground">
                Actualizando...
              </span>
            ) : null
          }
          pagination={{
            currentPage,
            totalPages,
            onPageChange: (page) =>
              globalPartInventory.pagination.setPage(page),
          }}
          footer={
            products.length > 0 ? (
              <ExportButton
                data={products.map(buildExportRow)}
                title="Descargar Inventario Global de Repuestos"
                getAllData={async () => {
                  const allData = await getAllGlobalPartData();
                  return allData.map(buildExportRow);
                }}
              />
            ) : null
          }
        />
      )}
    </div>
  );
}
