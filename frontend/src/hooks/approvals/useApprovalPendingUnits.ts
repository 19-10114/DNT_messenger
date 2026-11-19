import { useQuery } from '@tanstack/react-query';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { APPROVAL_PENDING_UNITS_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * "Motos por recibir" de la sucursal activa (`0` = todas): lo aprobado por
 * Empire que todavía no llegó, por línea, por modelo y en totales.
 */
export function useApprovalPendingUnits(enabled = true) {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [APPROVAL_PENDING_UNITS_QUERY_KEY, token, branchId],
    queryFn: () =>
      approvalsService.getPendingUnits(token as string, branchId as number),
    enabled: !!token && branchId !== undefined && enabled,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    isAllBranchesPendingView: branchId === 0,
    pendingRows: data?.rows ?? [],
    pendingByProduct: data?.byProduct ?? [],
    pendingMatrix: data?.matrix,
    pendingTotals: data?.totals,
    isLoadingPending: isLoading || branchId === undefined,
    isFetchingPending: isFetching,
    isErrorPending: isError,
    refetchPending: refetch,
  };
}
