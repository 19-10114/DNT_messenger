import { useQuery } from '@tanstack/react-query';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { useToken } from '@/stores/auth/auth.store';
import { APPROVAL_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * Detalle de una aprobación. Se pide fresco al montar: trae la URL firmada
 * del documento, que vence a los pocos minutos.
 */
export function useApproval(approvalId: number) {
  const token = useToken();
  const isValidId = Number.isInteger(approvalId) && approvalId > 0;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [APPROVAL_QUERY_KEY, token, approvalId],
    queryFn: () => approvalsService.getApproval(token as string, approvalId),
    enabled: !!token && isValidId,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  return {
    approval: data,
    isLoadingApproval: isValidId && isLoading,
    isFetchingApproval: isFetching,
    /** También `true` con un id inválido en la URL. */
    isErrorApproval: isError || !isValidId,
    approvalError: error,
    refetchApproval: refetch,
  };
}
