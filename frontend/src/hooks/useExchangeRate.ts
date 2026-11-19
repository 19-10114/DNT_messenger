import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { format } from 'date-fns';

// const calculatorService = new CalculatorService();
const TWELVE_HOURS = 1000 * 60 * 60 * 12;

const formatLastUpdated = (lastUpdated: string) => {
  const date = new Date(lastUpdated);
  date.setUTCHours(date.getUTCHours() - 4);

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} | ${hours}:${minutes}:${seconds}`;
};
/**
 * Hook que muestra la tasa de cambio del BCV
 * @param token - Token de autenticación
 * @param date - Fecha opcional para obtener tasa histórica; sin ella, la de hoy en Venezuela
 * @returns ExchangeRate - Number, estado de carga y error
 */
export function useExchangeRate(token: string, date?: Date) {
  const productsService = new ProductsService();
  const queryClient = useQueryClient();
  // Without a date the backend resolves "today" in Venezuela time. The browser
  // must not decide it: toISOString() is UTC, which from 8 p.m. in Venezuela is
  // already tomorrow. A chosen date is sent as its local calendar day.
  const formattedDate = date ? format(date, 'yyyy-MM-dd') : undefined;

  const {
    data: rateData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['exchangeRate', formattedDate ?? 'today'],
    queryFn: async () => {
      const response = await productsService.getExchangeRate(
        token,
        formattedDate
      );
      return response.data;
    },
    enabled: !!token,
    refetchInterval: !date ? TWELVE_HOURS : undefined,
    staleTime: !date ? TWELVE_HOURS : undefined,
  });

  const { mutate: updateUsdtRate, isLoading: isUpdating } = useMutation({
    mutationFn: (rate: number) => productsService.updateUsdtRate(token, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchangeRate'] });
    },
  });

  return {
    rate: rateData?.rate?.exchangeRate || 0,
    eurRate: rateData?.rate?.eurRate || 0,
    usdtRate: rateData?.rate?.usdtRate || 0,
    lastUpdated: formatLastUpdated(rateData?.rate?.lastUpdated || ''),
    date: rateData?.date,
    isLoading,
    isError,
    updateUsdtRate,
    isUpdating,
  };
}
