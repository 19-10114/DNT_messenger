import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { SalesTargetsService } from '@/services/salesTargets/salesTargets.service';
import {
  NonWorkingDayInput,
  SalesTargetConfigInput,
  SalesTargetQuery,
} from '@/services/salesTargets/types';
import { useToken } from '@/stores/auth/auth.store';
import { SALES_TARGETS_QUERY_KEY } from './salesTargetsQueryKeys';

export const salesTargetsService = new SalesTargetsService();

/**
 * Detalle de la meta de una sucursal (`0` = general) para un mes y una fecha
 * de corte. Es lo que pinta la página y el PDF.
 */
export function useSalesTargetReport(
  query: SalesTargetQuery,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const token = useToken();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [SALES_TARGETS_QUERY_KEY, token, 'report', query],
    queryFn: () => salesTargetsService.getReport(token as string, query),
    enabled: !!token && enabled,
    keepPreviousData: true,
    // Sin botón "Actualizar": las ventas se facturan en otra pantalla, así
    // que al volver a la pestaña se piden de nuevo.
    refetchOnWindowFocus: true,
  });

  return {
    salesTargetReport: data,
    isLoadingSalesTargetReport: isLoading,
    isErrorSalesTargetReport: isError,
    isFetchingSalesTargetReport: isFetching,
    refetchSalesTargetReport: refetch,
  };
}

/** Todas las sucursales con su cumplimiento del mes, y los totales. */
export function useSalesTargetOverview(
  month: string,
  cutoff?: string,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const token = useToken();

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: [SALES_TARGETS_QUERY_KEY, token, 'overview', month, cutoff],
    queryFn: () =>
      salesTargetsService.getOverview(token as string, month, cutoff),
    enabled: !!token && enabled,
    keepPreviousData: true,
    refetchOnWindowFocus: true,
  });

  return {
    salesTargetOverview: data,
    isLoadingSalesTargetOverview: isLoading,
    isErrorSalesTargetOverview: isError,
    isFetchingSalesTargetOverview: isFetching,
    refetchSalesTargetOverview: refetch,
  };
}

/** Lo que carga la configuración del mes: metas y días no hábiles. */
export function useSalesTargetsConfig(month: string, enabled: boolean) {
  const token = useToken();

  const targets = useQuery({
    queryKey: [SALES_TARGETS_QUERY_KEY, token, 'targets', month],
    queryFn: () => salesTargetsService.getTargets(token as string, month),
    enabled: !!token && enabled,
    refetchOnWindowFocus: false,
  });
  const nonWorkingDays = useQuery({
    queryKey: [SALES_TARGETS_QUERY_KEY, token, 'nonWorkingDays', month],
    queryFn: () =>
      salesTargetsService.getNonWorkingDays(token as string, month),
    enabled: !!token && enabled,
    refetchOnWindowFocus: false,
  });

  return {
    targetsConfig: targets.data,
    isLoadingTargetsConfig: targets.isLoading,
    isErrorTargetsConfig: targets.isError,
    nonWorkingDays: nonWorkingDays.data ?? [],
    isLoadingNonWorkingDays: nonWorkingDays.isLoading,
  };
}

/**
 * Devuelve una función que trae la configuración de otro mes (para "Copiar
 * del mes anterior"), pasando por la caché de React Query.
 */
export function useFetchSalesTargetsConfig() {
  const token = useToken();
  const queryClient = useQueryClient();
  return (month: string) =>
    queryClient.fetchQuery({
      queryKey: [SALES_TARGETS_QUERY_KEY, token, 'targets', month],
      queryFn: () => salesTargetsService.getTargets(token as string, month),
    });
}

/** Guarda las metas del mes (solo admin). */
export function useSaveSalesTargets(month: string) {
  const token = useToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (rows: SalesTargetConfigInput[]) =>
      salesTargetsService.saveTargets(token as string, month, rows),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [SALES_TARGETS_QUERY_KEY] }),
  });

  return {
    saveSalesTargets: mutation.mutateAsync,
    isSavingSalesTargets: mutation.isLoading,
  };
}

/** Alta y baja de días no hábiles (solo admin). */
export function useNonWorkingDayMutations() {
  const token = useToken();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [SALES_TARGETS_QUERY_KEY] });

  const create = useMutation({
    mutationFn: (body: NonWorkingDayInput) =>
      salesTargetsService.createNonWorkingDay(token as string, body),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) =>
      salesTargetsService.deleteNonWorkingDay(token as string, id),
    onSuccess: invalidate,
  });

  return {
    createNonWorkingDay: create.mutateAsync,
    isCreatingNonWorkingDay: create.isLoading,
    deleteNonWorkingDay: remove.mutateAsync,
    isDeletingNonWorkingDay: remove.isLoading,
  };
}
