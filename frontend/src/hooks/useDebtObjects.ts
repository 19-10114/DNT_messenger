import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { DebtObjectsResponse } from '@/services/transactions/types/DebtObjects.type';
import { GetAllServiceQueryParametersType } from '@/services/transactions/types/GetAllTransactions';

const transactionService = new TransactionService();

/**
 * Hook para obtener objetos de deuda entre dos sucursales con paginación
 */
export function useDebtObjects(
  token: string | undefined,
  firstBranch?: string,
  secondBranch?: string,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  const globalBranchId = useCurrentBranchId();
  const effectiveFirstBranch =
    firstBranch ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'debtObjects',
      token,
      effectiveFirstBranch,
      secondBranch,
      queryParameters,
    ],
    queryFn: () =>
      transactionService.getDebtObjects(
        token,
        effectiveFirstBranch as string,
        secondBranch as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveFirstBranch && !!secondBranch,
    staleTime: 1000 * 30,
  });

  return { data, isLoading, isError, refetch } as {
    data: DebtObjectsResponse['data'] | undefined;
    isLoading: boolean;
    isError: boolean;
    refetch: () => void;
  };
}
