import { useQuery } from '@tanstack/react-query';

import { GpsService } from '@/services/gps/gps.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { GPS_TRANSFERS_QUERY_KEY } from './gpsQueryKeys';

const gpsService = new GpsService();

/**
 * Traslados de GPS entre sucursales pendientes, **de la sucursal activa**:
 * los que tiene que aceptar o rechazar (`incomingGpsTransfers`) y los que
 * envió y todavía esperan (`outgoingGpsTransfers`). Desde la sucursal `0`
 * (Super Admin) llegan todos los pendientes como `incoming`.
 *
 * Igual que `useGpsUnits`, espera a que la sucursal se hidrate en vez de caer
 * a `0`.
 */
export function useGpsTransfers() {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [GPS_TRANSFERS_QUERY_KEY, token, branchId],
    queryFn: () =>
      gpsService.getGpsTransfers(token as string, branchId as number),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  return {
    incomingGpsTransfers: data?.incoming ?? [],
    outgoingGpsTransfers: data?.outgoing ?? [],
    isAllBranchesGpsTransfersView: branchId === 0,
    isLoadingGpsTransfers: isLoading || branchId === undefined,
    isFetchingGpsTransfers: isFetching,
    isErrorGpsTransfers: isError,
    refetchGpsTransfers: refetch,
  };
}
