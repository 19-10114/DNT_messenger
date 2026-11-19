import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { CashObjectsResponse } from '@/services/transactions/types/CashObjects.type';
import { GetAllServiceQueryParametersType } from '@/services/transactions/types/GetAllTransactions';

const transactionService = new TransactionService();

/**
 * Hook para obtener objetos de efectivo de una sucursal con paginación
 */
export function useCashObjects(
  token: string | undefined,
  branchId?: string,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cashObjects', token, effectiveBranchId, queryParameters],
    queryFn: () =>
      transactionService.getCashObjects(
        token,
        effectiveBranchId as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveBranchId,
    staleTime: 1000 * 30,
  });

  return { data, isLoading, isError, refetch } as {
    data: CashObjectsResponse['data'] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
}
