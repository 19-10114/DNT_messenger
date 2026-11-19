import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import {
  CategoryUtilityReportPayload,
  CategoryUtilityReportResponse,
} from '@/services/transactions/types/CategoryUtilityReport.type';
import { useToken } from '@/stores/auth/auth.store';

const transactionService = new TransactionService();

/**
 * Hook para el reporte "Utilidad por Categoría" (Super Admin). Ver
 * ARCHITECTURE.md — CategoryUtilityReportView / POST /transactions/utility-by-category.
 */
export function useCategoryUtilityReport(
  payload: CategoryUtilityReportPayload
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery<
    CategoryUtilityReportResponse,
    Error
  >({
    queryKey: [
      'categoryUtilityReport',
      token,
      payload.startDate,
      payload.endDate,
      payload.branches,
      payload.categories,
    ],
    queryFn: () => transactionService.getCategoryUtilityReport(token, payload),
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  return {
    data: data?.data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}
