import { useQuery } from '@tanstack/react-query';
import { PurchasesService } from '@/services/purchases/purchases.service';
import { ProcurementAnalysisData } from '@/services/purchases/types/ProcurementAnalysis.type';
import { useToken } from '@/stores/auth/auth.store';

const purchasesService = new PurchasesService();

/**
 * "Procura de Repuestos" — qué repuestos comprar en una sucursal. Ver
 * ARCHITECTURE.md (ProcurementAnalysisView / GET
 * /purchases/procurement-analysis/<branchId>).
 */
export function useProcurementAnalysis(
  branchId: number | undefined,
  params: { lookbackDays?: number; leadTimeDays?: number } = {}
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    ProcurementAnalysisData,
    Error
  >({
    queryKey: [
      'procurementAnalysis',
      token,
      branchId,
      params.lookbackDays,
      params.leadTimeDays,
    ],
    queryFn: () =>
      purchasesService.getProcurementAnalysis(
        token,
        branchId as number,
        params
      ),
    // branchId=0 means "todas las sucursales" (Super Admin) -- a valid,
    // intentional value, so this can't be a truthy check on branchId itself.
    enabled: !!token && branchId !== undefined,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
