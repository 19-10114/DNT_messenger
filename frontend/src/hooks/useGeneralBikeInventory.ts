import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useState } from 'react';
import { GetAllServiceQueryParametersType } from '@/services/products/types';

const productsService = new ProductsService();

/**
 * Hook para obtener el inventario general de motos con soporte para paginación
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param initialQueryParameters - Parámetros iniciales de paginación (opcional)
 * @returns Objeto con datos, estados y funciones para el inventario general de motos
 */
export function useGeneralBikeInventory(
  token: string | undefined,
  branchId?: string | undefined,
  initialQueryParameters: GetAllServiceQueryParametersType = {}
) {
  // Estado para controlar la paginación
  const [queryParameters, setQueryParameters] =
    useState<GetAllServiceQueryParametersType>({
      page: initialQueryParameters.page || '1',
      pageSize: initialQueryParameters.pageSize || '10',
      search: initialQueryParameters.search || '',
    });

  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId || (globalBranchId ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'generalBikeInventory',
      token,
      effectiveBranchId,
      queryParameters,
    ],
    queryFn: () =>
      productsService.getGeneralBikeInventory(
        token as string,
        effectiveBranchId as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveBranchId,
  });

  // Función para cambiar la página
  const setPage = (page: number) => {
    setQueryParameters((prev) => ({
      ...prev,
      page: page.toString(),
    }));
  };

  // Función para cambiar el tamaño de página
  const setPageSize = (pageSize: number) => {
    setQueryParameters((prev) => ({
      ...prev,
      pageSize: pageSize.toString(),
      page: '1', // Resetear a la primera página cuando cambia el tamaño
    }));
  };

  return {
    data,
    isLoading,
    isError,
    refetch,
    pagination: {
      currentPage: parseInt(queryParameters.page || '1', 10),
      pageSize: parseInt(queryParameters.pageSize || '10', 10),
      setPage,
      setPageSize,
    },
    queryParameters,
  };
}
