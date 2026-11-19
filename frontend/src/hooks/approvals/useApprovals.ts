import { useQuery } from '@tanstack/react-query';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { GetApprovalsQueryParams } from '@/services/approvals/types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { APPROVALS_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * Página de aprobaciones de Empire **cargadas por la sucursal activa**
 * (`0` = todas). Espera a que la sucursal se hidrate, como `useBikeRequests`.
 */
export function useApprovals(queryParameters: GetApprovalsQueryParams) {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [APPROVALS_QUERY_KEY, token, branchId, queryParameters],
    queryFn: () =>
      approvalsService.getApprovals(
        token as string,
        branchId as number,
        queryParameters
      ),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    approvalsBranchId: branchId,
    isAllBranchesApprovalsView: branchId === 0,
    approvals: data?.results ?? [],
    approvalStatusCounts: data?.staticData?.statusCounts,
    totalApprovals: data?.totalElements ?? 0,
    totalApprovalPages: data?.totalPages ?? 1,
    isLoadingApprovals: isLoading || branchId === undefined,
    isFetchingApprovals: isFetching,
    isErrorApprovals: isError,
    refetchApprovals: refetch,
  };
}
