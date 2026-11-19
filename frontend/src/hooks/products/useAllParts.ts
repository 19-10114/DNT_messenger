import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const productsService = new ProductsService();

interface UseAllPartsOptions {
  /**
   * `false` deja la consulta en pausa: no se dispara sola y se pide a mano con
   * `refetch()`. Es lo que hay que usar para catálogos completos
   * (`pageSize: '100000'`) que solo hacen falta al tocar un botón.
   * Ojo: con la consulta pausada `isLoading` queda en `true` para siempre
   * (React Query v4), así que para el estado del botón usá `isFetching`.
   */
  enabled?: boolean;
}

/**
 * Hook para obtener todos los repuestos con soporte para paginación
 * @param queryParameters - Parámetros de paginación/búsqueda
 * @param options - `enabled` para pedir la data a demanda
 * @returns JSON response con toda la informacion de repuestos
 */
export function useAllParts(
  queryParameters: GetAllServiceQueryParametersType = {},
  options: UseAllPartsOptions = {}
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['allParts', token, queryParameters],
    queryFn: () =>
      productsService.getAllParts(token as string, queryParameters),
    enabled: !!token && (options.enabled ?? true),
    keepPreviousData: true,
    // Listado paginado: sin refetch al volver a la pestaña (ver INVENTORY)
    ...applyQueryConfig('INVENTORY'),
  });

  return {
    data: data?.data,
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}
