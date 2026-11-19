import { useQuery } from '@tanstack/react-query';

import { BikeRequestsService } from '@/services/bikeRequests/bikeRequests.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { BIKE_REQUEST_PENDING_UNITS_QUERY_KEY } from './bikeRequestsQueryKeys';

const bikeRequestsService = new BikeRequestsService();

/**
 * "Motos por entregar" de la sucursal activa (`0` = todas): una fila por
 * línea pendiente de cada solicitud abierta, más los totales. Sin paginar.
 * Espera a que la sucursal se hidrate, igual que `useBikeRequests`.
 */
export function useBikeRequestPendingUnits() {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [BIKE_REQUEST_PENDING_UNITS_QUERY_KEY, token, branchId],
    queryFn: () =>
      bikeRequestsService.getPendingUnits(token as string, branchId as number),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    isAllBranchesPendingUnitsView: branchId === 0,
    pendingUnitRows: data?.rows ?? [],
    pendingUnitTotals: data?.totals,
    isLoadingPendingUnits: isLoading || branchId === undefined,
    isFetchingPendingUnits: isFetching,
    isErrorPendingUnits: isError,
    refetchPendingUnits: refetch,
  };
}
