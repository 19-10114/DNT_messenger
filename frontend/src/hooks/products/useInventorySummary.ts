import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { applyQueryConfig } from '@/config/queryOptimization.config';

const productsService = new ProductsService();

/**
 * KPIs del inventario de motos de la sede activa (0 = todas).
 * Se vuelve a pedir al cambiar de sede o el filtro de usadas; `keepPreviousData`
 * deja las tarjetas con el número anterior mientras llega el nuevo.
 * @param used - true para contar solo motos usadas (sigue al check de la tabla)
 */
export function useBikeInventorySummary(used = false) {
  const token = useToken();
  const branchId = useCurrentBranchId()?.toString();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['bikeInventorySummary', token, branchId, used],
    queryFn: () =>
      productsService.getBikeInventorySummary(
        token as string,
        branchId as string,
        used
      ),
    enabled: !!token && !!branchId,
    keepPreviousData: true,
    ...applyQueryConfig('INVENTORY'),
  });

  return {
    bikeSummary: data?.data,
    isLoadingBikeSummary: isLoading,
    isFetchingBikeSummary: isFetching,
    isErrorBikeSummary: isError,
    refetchBikeSummary: refetch,
  };
}

/**
 * KPIs del inventario de repuestos de la sede activa (0 = todas).
 */
export function usePartInventorySummary() {
  const token = useToken();
  const branchId = useCurrentBranchId()?.toString();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['partInventorySummary', token, branchId],
    queryFn: () =>
      productsService.getPartInventorySummary(
        token as string,
        branchId as string
      ),
    enabled: !!token && !!branchId,
    keepPreviousData: true,
    ...applyQueryConfig('INVENTORY'),
  });

  return {
    partSummary: data?.data,
    isLoadingPartSummary: isLoading,
    isFetchingPartSummary: isFetching,
    isErrorPartSummary: isError,
    refetchPartSummary: refetch,
  };
}
