import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { useToken } from '@/stores/auth/auth.store';
import { normalizeApprovalNumber } from '@/components/approvals/approvals.utils';
import { APPROVAL_LOOKUP_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * Modelos y cupo de una aprobación mientras se escribe su número en el
 * carrito de compra. Espera a que se deje de escribir; un 404 es "no existe"
 * y no se reintenta.
 *
 * @param number - Lo escrito, sin normalizar
 * @param purchaseOrderId - Al editar una preorden, para no contarla dos veces
 */
export function useApprovalLookup(number: string, purchaseOrderId?: number) {
  const token = useToken();
  const [debouncedNumber] = useDebounce(normalizeApprovalNumber(number), 400);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: [
      APPROVAL_LOOKUP_QUERY_KEY,
      token,
      debouncedNumber,
      purchaseOrderId,
    ],
    queryFn: () =>
      approvalsService.lookup(
        token as string,
        debouncedNumber,
        purchaseOrderId
      ),
    enabled: !!token && !!debouncedNumber,
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 15 * 1000,
  });

  const isNotFound =
    (error as { response?: { status?: number } })?.response?.status === 404;

  return {
    /** Número normalizado efectivamente consultado. */
    lookupNumber: debouncedNumber,
    /** Mientras se escribe, todavía no corresponde a lo escrito. */
    isLookupStale: debouncedNumber !== normalizeApprovalNumber(number),
    approvalLookup: isError ? undefined : data,
    isLoadingLookup: !!debouncedNumber && (isLoading || isFetching),
    isLookupNotFound: isNotFound,
    isLookupError: isError && !isNotFound,
  };
}
