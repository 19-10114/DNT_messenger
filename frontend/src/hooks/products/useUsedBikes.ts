import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import {
  GetUsedBikesTableQueryParams,
  UsedBike,
} from '@/services/products/types/UsedBike.type';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

const productsService = new ProductsService();

/** Convención del proyecto: 0 trae los registros de todas las sucursales */
export const ALL_BRANCHES = 0;

interface UseUsedBikesOptions extends GetUsedBikesTableQueryParams {
  /** Sucursal a consultar; por defecto, la activa en el store */
  branchId?: number;
}

/**
 * Hook para el listado paginado de motos usadas
 * @param options - Sucursal, paginación y filtro por estado
 * @returns Registros de motos usadas y estados de la consulta
 */
export function useUsedBikes(options: UseUsedBikesOptions = {}) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const { branchId, ...queryParameters } = options;
  const effectiveBranchId = branchId ?? currentBranchId;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['usedBikes', token, effectiveBranchId, queryParameters],
    queryFn: () =>
      productsService.getUsedBikesTable(
        token as string,
        effectiveBranchId as number,
        queryParameters
      ),
    enabled: !!token && effectiveBranchId !== undefined,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    usedBikes: (data?.data.results ?? []) as UsedBike[],
    pagination: data?.data,
    isLoadingUsedBikes: isLoading,
    isFetchingUsedBikes: isFetching,
    isErrorUsedBikes: isError,
    usedBikesError: error,
    refetchUsedBikes: refetch,
  };
}

/**
 * Hook para el detalle de una moto usada
 * @param usedBikeId - Id del registro
 * @returns Registro completo y estados de la consulta
 */
export function useUsedBike(usedBikeId: number | undefined) {
  const token = useToken();

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['usedBike', token, usedBikeId],
    queryFn: () =>
      productsService.getUsedBikeById(token as string, usedBikeId as number),
    enabled: !!token && !!usedBikeId,
    refetchOnWindowFocus: false,
  });

  return {
    usedBike: data,
    isLoadingUsedBike: isLoading,
    isErrorUsedBike: isError,
    usedBikeError: error,
    refetchUsedBike: refetch,
  };
}
