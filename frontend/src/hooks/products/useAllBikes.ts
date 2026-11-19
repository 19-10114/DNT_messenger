import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const productsService = new ProductsService();

interface UseAllBikesOptions {
  /**
   * `false` deja la consulta apagada: no se dispara hasta que el consumidor la
   * enciende (p. ej. cuando se elige la categoría "Moto" en un formulario).
   * Ojo: con la consulta apagada `isLoading` queda en `true` para siempre
   * (React Query v4), así que para estados de carga usá `isFetching`.
   */
  enabled?: boolean;
}

/**
 * Hook para obtener todas las motos con soporte para paginación
 * @param queryParameters - Parámetros de paginación/búsqueda
 * @param options - `enabled` para encender la consulta solo cuando hace falta
 * @returns JSON response con toda la información de motos
 */
export function useAllBikes(
  queryParameters: GetAllServiceQueryParametersType = {},
  options: UseAllBikesOptions = {}
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['allBikes', token, queryParameters],
    queryFn: () =>
      productsService.getAllBikes(token as string, queryParameters),
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
