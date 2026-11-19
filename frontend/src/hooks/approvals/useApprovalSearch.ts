import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { useToken } from '@/stores/auth/auth.store';
import { normalizeApprovalNumber } from '@/components/approvals/approvals.utils';
import { APPROVAL_SEARCH_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * Autocompletado del número de aprobación: aprobaciones abiertas cuyo número
 * empieza con lo escrito, de menor a mayor. Vacío = las primeras abiertas.
 *
 * @param query - Lo escrito, sin normalizar
 * @param branchId - Sucursal que recibe, para mostrar lo pendiente para ella
 * @param enabled - Solo mientras la lista está abierta
 */
export function useApprovalSearch(
  query: string,
  branchId: number | undefined,
  enabled: boolean
) {
  const token = useToken();
  const [debounced] = useDebounce(normalizeApprovalNumber(query), 250);

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [APPROVAL_SEARCH_QUERY_KEY, token, debounced, branchId],
    queryFn: () =>
      approvalsService.search(token as string, debounced, branchId),
    enabled: !!token && enabled,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 15 * 1000,
  });

  return {
    approvalSearchResults: data ?? [],
    isSearchingApprovals: enabled && (isLoading || isFetching),
    isApprovalSearchError: isError,
  };
}
