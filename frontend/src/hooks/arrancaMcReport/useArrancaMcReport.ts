import { useQuery } from '@tanstack/react-query';

import { ArrancaMcReportService } from '@/services/arrancaMcReport/arrancaMcReport.service';
import {
  ArrancaMcFeedQuery,
  ArrancaMcSummaryQuery,
} from '@/services/arrancaMcReport/types';
import { useToken } from '@/stores/auth/auth.store';
import { ARRANCA_MC_REPORT_QUERY_KEY } from './arrancaMcReportQueryKeys';

export const arrancaMcReportService = new ArrancaMcReportService();

/**
 * KPIs y series del reporte "Arranca - MC", desde el punto de vista de Moto
 * Candela (positivo = a favor de MC).
 *
 * @param query - Sucursal MC (`0` = todas) y rango de fechas
 */
export function useArrancaMcSummary(query: ArrancaMcSummaryQuery) {
  const token = useToken();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [ARRANCA_MC_REPORT_QUERY_KEY, token, 'summary', query],
    queryFn: () => arrancaMcReportService.getSummary(token as string, query),
    enabled: !!token,
    // Cambiar de rango no vacía los gráficos mientras llega el siguiente.
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    arrancaMcSummary: data,
    isLoadingArrancaMcSummary: isLoading,
    isErrorArrancaMcSummary: isError,
    isFetchingArrancaMcSummary: isFetching,
    refetchArrancaMcSummary: refetch,
  };
}

/**
 * Movimientos que afectan el balance, paginados en el servidor. El saldo
 * acumulado de cada fila no cambia con los filtros.
 *
 * @param query - Sucursal, rango, filtros y paginación
 */
export function useArrancaMcFeed(query: ArrancaMcFeedQuery) {
  const token = useToken();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [ARRANCA_MC_REPORT_QUERY_KEY, token, 'feed', query],
    queryFn: () => arrancaMcReportService.getFeed(token as string, query),
    enabled: !!token,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    arrancaMcFeedRows: data?.results ?? [],
    totalArrancaMcFeedRows: data?.totalElements ?? 0,
    totalArrancaMcFeedPages: data?.totalPages ?? 1,
    isLoadingArrancaMcFeed: isLoading,
    isErrorArrancaMcFeed: isError,
    isFetchingArrancaMcFeed: isFetching,
    refetchArrancaMcFeed: refetch,
  };
}
