import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import {
  UtilityApiResponse,
  UtilityPayload,
  SearchType,
  ViewModeType,
} from '@/services/transactions/types/SalesReport.type';
import { useToken } from '@/stores/auth/auth.store';

interface UseUtilityDataOptions {
  enabled?: boolean;
  staleTime?: number;
  onSuccess?: (data: UtilityApiResponse) => void;
  onError?: (error: Error) => void;
}

interface UtilityDataParams {
  branchId: string;
  search: SearchType;
  view: ViewModeType;
  startDate: string;
  endDate: string;
}

export const useUtilityData = (
  params: UtilityDataParams,
  options: UseUtilityDataOptions = {}
) => {
  const token = useToken();
  const transactionService = new TransactionService();

  const {
    enabled = true,
    staleTime = 5 * 60 * 1000,
    onSuccess,
    onError,
  } = options;

  const queryKey = [
    'utilityData',
    params.branchId,
    params.search,
    params.view,
    params.startDate,
    params.endDate,
    token,
  ];

  const queryFn = async (): Promise<UtilityApiResponse> => {
    if (!token) {
      throw new Error('Token no disponible');
    }

    if (!params.branchId) {
      throw new Error('Se requiere el ID de la sucursal');
    }

    if (!params.startDate || !params.endDate) {
      throw new Error('Se requieren las fechas de inicio y fin');
    }

    const payload: UtilityPayload = {
      search: params.search,
      view: params.view,
      start_date: params.startDate,
      end_date: params.endDate,
    };

    const response = await transactionService.getUtilityData(
      token,
      params.branchId,
      payload
    );

    if (!response) {
      throw new Error('No se pudieron cargar los datos de utilidad');
    }

    return response;
  };

  const shouldEnable = () => {
    return (
      !!token &&
      enabled &&
      !!params.branchId &&
      !!params.startDate &&
      !!params.endDate
    );
  };

  return useQuery<UtilityApiResponse, Error>({
    queryKey,
    queryFn,
    enabled: shouldEnable(),
    staleTime,
    retry: (failureCount, error) => {
      if (error.message.includes('token') || error.message.includes('auth')) {
        return false;
      }
      return failureCount < 2;
    },
    onSuccess,
    onError,
    refetchOnWindowFocus: false,
  });
};
