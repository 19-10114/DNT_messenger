import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useState } from 'react';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const productsService = new ProductsService();

/**
 * Hook para obtener el inventario global de repuestos con soporte para paginación
 * @param initialQueryParameters - Parámetros iniciales de paginación (opcional)
 * @returns Objeto con datos, estados y funciones para el inventario global de repuestos
 */
export function useGlobalPartInventory(
  initialQueryParameters: GetAllServiceQueryParametersType = {}
) {
  const token = useToken();

  const [queryParameters, setQueryParameters] =
    useState<GetAllServiceQueryParametersType>({
      page: initialQueryParameters.page || '1',
      pageSize: initialQueryParameters.pageSize || '10',
      search: initialQueryParameters.search || '',
    });

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['globalPartInventory', token, queryParameters],
    queryFn: () =>
      productsService.getGlobalPartInventory(token as string, queryParameters),
    enabled: !!token,
    // Sostiene la tabla mientras se escribe en el buscador: cada búsqueda es
    // una queryKey nueva y sin esto `isLoading` volvería a `true` en cada tecla
    keepPreviousData: true,
    ...applyQueryConfig('INVENTORY'),
  });

  const setPage = (page: number) => {
    setQueryParameters((prev) => ({
      ...prev,
      page: page.toString(),
    }));
  };

  const setPageSize = (pageSize: number) => {
    setQueryParameters((prev) => ({
      ...prev,
      pageSize: pageSize.toString(),
      page: '1', // Resetear a la primera página cuando cambia el tamaño
    }));
  };

  const setSearch = (search: string) => {
    setQueryParameters((prev) => ({
      ...prev,
      search,
      page: '1', // Resetear a la primera página cuando cambia la búsqueda
    }));
  };

  return {
    data: data?.data,
    isLoading,
    isFetching,
    isError,
    refetch,
    pagination: {
      currentPage: parseInt(queryParameters.page || '1', 10),
      pageSize: parseInt(queryParameters.pageSize || '10', 10),
      setPage,
      setPageSize,
    },
    queryParameters,
    setSearch,
  };
}
