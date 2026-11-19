import { useCallback, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';

import { DashboardService } from '@/services/dashboard/dashboard.service';
import { ManagerDashboardQuery } from '@/services/dashboard/types';
import { useToken } from '@/stores/auth/auth.store';

export const MANAGER_DASHBOARD_QUERY_KEY = 'managerDashboard';

const dashboardService = new DashboardService();

/**
 * Inicio de gerencia para una sucursal y un rango. El servidor cachea un
 * minuto; `refreshManagerDashboard` pide saltarse esa caché.
 */
export function useManagerDashboard(
  query: ManagerDashboardQuery,
  { enabled = true }: { enabled?: boolean } = {}
) {
  const token = useToken();
  // La próxima petición salta la caché del servidor (botón "Actualizar").
  const forceRefresh = useRef(false);

  const { data, isLoading, isError, error, isFetching, refetch } = useQuery({
    queryKey: [MANAGER_DASHBOARD_QUERY_KEY, token, query],
    queryFn: () => {
      const refresh = forceRefresh.current;
      forceRefresh.current = false;
      return dashboardService.getManagerDashboard(
        token as string,
        query,
        refresh
      );
    },
    enabled: !!token && enabled && !!query.start && !!query.finish,
    keepPreviousData: true,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const refreshManagerDashboard = useCallback(() => {
    forceRefresh.current = true;
    return refetch();
  }, [refetch]);

  return {
    managerDashboard: data,
    isLoadingManagerDashboard: isLoading,
    isErrorManagerDashboard: isError,
    managerDashboardError: error,
    isFetchingManagerDashboard: isFetching,
    refreshManagerDashboard,
  };
}
