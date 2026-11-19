import { useQuery } from '@tanstack/react-query';

import { ApprovalsService } from '@/services/approvals/approvals.service';
import { useToken } from '@/stores/auth/auth.store';
import { APPROVAL_PENDING_BY_MODEL_QUERY_KEY } from './approvalsQueryKeys';

const approvalsService = new ApprovalsService();

/**
 * Motos por recibir de Empire por modelo para una sucursal (`0` = todas),
 * para las vistas de inventario. Devuelve un mapa `productId → cantidad` y
 * el total.
 */
export function useApprovalPendingByModel(
  branchId: number | undefined,
  enabled = true
) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: [APPROVAL_PENDING_BY_MODEL_QUERY_KEY, token, branchId],
    queryFn: () =>
      approvalsService.getPendingByModel(token as string, branchId as number),
    enabled: !!token && branchId !== undefined && enabled,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  const byProduct = new Map<number, number>(
    (data ?? []).map((row) => [row.productId, row.remainingQuantity])
  );
  return {
    pendingByProduct: byProduct,
    pendingModels: data ?? [],
    pendingTotal: (data ?? []).reduce(
      (sum, row) => sum + row.remainingQuantity,
      0
    ),
    isLoadingPendingByModel: isLoading && enabled,
    isErrorPendingByModel: isError,
  };
}
