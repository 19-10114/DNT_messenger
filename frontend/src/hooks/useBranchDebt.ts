import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';

const transactionService = new TransactionService();

/**
 * Hook para obtener la deuda entre dos sucursales
 * @param token - Token de autenticación
 * @param primaryBranchId - ID de la sucursal principal (referencia)
 * @param secondaryBranchId - ID de la sucursal secundaria (a donde apunta)
 * @returns Objeto con el monto de la deuda y estados de la consulta
 */
export function useBranchDebt(
  token: string | undefined,
  primaryBranchId: string | undefined,
  secondaryBranchId: string | undefined
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchDebt', token, primaryBranchId, secondaryBranchId],
    queryFn: () =>
      transactionService.getBranchDebt(
        token,
        primaryBranchId as string,
        secondaryBranchId as string
      ),
    enabled: !!token && !!primaryBranchId && !!secondaryBranchId,
  });

  return { data, isLoading, isError, refetch };
}
