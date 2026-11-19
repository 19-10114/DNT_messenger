import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  APPROVALS_QUERY_KEY,
  APPROVAL_LOOKUP_QUERY_KEY,
  APPROVAL_PENDING_UNITS_QUERY_KEY,
  APPROVAL_QUERY_KEY,
  APPROVAL_SEARCH_QUERY_KEY,
  APPROVAL_PENDING_BY_MODEL_QUERY_KEY,
} from '@/hooks/approvals/approvalsQueryKeys';
import { PurchasesService } from '@/services/purchases/purchases.service';
import { useToken } from '@/stores/auth/auth.store';
import {
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  GetAllPurchaseOrdersQueryParams,
} from '@/services/purchases/types/PurchaseOrder.type';

const purchasesService = new PurchasesService();

/**
 * Una preorden de motos reserva cupo de su aprobación de Empire y aprobarla
 * cuenta las motos: cualquier cambio refresca el módulo de aprobaciones.
 */
function invalidateApprovals(queryClient: QueryClient) {
  [
    APPROVALS_QUERY_KEY,
    APPROVAL_QUERY_KEY,
    APPROVAL_PENDING_UNITS_QUERY_KEY,
    APPROVAL_LOOKUP_QUERY_KEY,
    APPROVAL_SEARCH_QUERY_KEY,
    APPROVAL_PENDING_BY_MODEL_QUERY_KEY,
  ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

export function useAllPurchaseOrders(
  branchId: string | undefined,
  queryParameters: GetAllPurchaseOrdersQueryParams = {}
) {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchaseOrders', token, branchId, queryParameters],
    queryFn: () =>
      purchasesService.getAllPurchaseOrders(
        token,
        branchId as string,
        queryParameters
      ),
    enabled: !!token && !!branchId,
  });

  return { data, isLoading, isError, refetch };
}

export function usePurchaseOrder(id: number | undefined) {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['purchaseOrder', token, id],
    queryFn: () => purchasesService.getPurchaseOrder(token, id as number),
    enabled: !!token && !!id,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * The purchase preorder behind a resulting `Order` (reverse of
 * `resulting_order`). Used from the transaction detail view when a
 * transaction's `orderNumber` points at a type='purchase' order, to show the
 * same ficha as "Preórdenes de Compra" instead of the generic order modal.
 */
export function usePurchaseOrderByOrder(
  orderId: number | undefined,
  enabled: boolean = true
) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['purchaseOrderByOrder', token, orderId],
    queryFn: () =>
      purchasesService.getPurchaseOrderByOrderId(token, orderId as number),
    enabled: !!token && !!orderId && enabled,
  });

  return { data, isLoading, isError };
}

export function useCreatePurchaseOrder() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePurchaseOrderPayload) =>
      purchasesService.createPurchaseOrder(token, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      invalidateApprovals(queryClient);
    },
  });
}

export function useUpdatePurchaseOrder(id: number) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdatePurchaseOrderPayload) =>
      purchasesService.updatePurchaseOrder(token, id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      invalidateApprovals(queryClient);
      queryClient.invalidateQueries({ queryKey: ['purchaseOrder', token, id] });
    },
  });
}

export function useApprovePurchaseOrder() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      purchasesService.approvePurchaseOrder(token, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      invalidateApprovals(queryClient);
    },
  });
}

export function useRejectPurchaseOrder() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      purchasesService.rejectPurchaseOrder(token, id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      invalidateApprovals(queryClient);
    },
  });
}
