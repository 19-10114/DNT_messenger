import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { CashWithdrawalsService } from '@/services/cashWithdrawals/cashWithdrawals.service';
import { CreateCashWithdrawalPayload } from '@/services/cashWithdrawals/types/CashWithdrawal.type';
import { useToken } from '@/stores/auth/auth.store';

const cashWithdrawalsService = new CashWithdrawalsService();

/**
 * Una salida baja el efectivo de la sucursal: al registrarla o anularla se
 * invalidan las vistas de caja y el reporte diario. Nada de gastos.
 */
function invalidateCashViews(queryClient: QueryClient) {
  [
    'cashWithdrawal',
    'cashObjects',
    'branchCash',
    'branchBalance',
    'dailyReport',
  ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

/**
 * Una salida. Sin caché: la URL del comprobante vence a los 5 minutos y
 * `canCancel` depende del día.
 */
export function useCashWithdrawal(id: number | undefined) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cashWithdrawal', token, id],
    queryFn: () =>
      cashWithdrawalsService.getCashWithdrawal(token, id as number),
    enabled: !!token && !!id,
    staleTime: 0,
    cacheTime: 0,
  });

  return { withdrawal: data, isLoading, isError };
}

export function useCreateCashWithdrawal() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCashWithdrawalPayload) =>
      cashWithdrawalsService.createCashWithdrawal(token, payload),
    onSuccess: () => invalidateCashViews(queryClient),
  });
}

export function useCancelCashWithdrawal() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      cashWithdrawalsService.cancelCashWithdrawal(token, id, reason),
    onSuccess: () => invalidateCashViews(queryClient),
  });
}
