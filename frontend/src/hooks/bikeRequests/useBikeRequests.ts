import { useQuery } from '@tanstack/react-query';

import { BikeRequestsService } from '@/services/bikeRequests/bikeRequests.service';
import { GetBikeRequestsQueryParams } from '@/services/bikeRequests/types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { BIKE_REQUESTS_QUERY_KEY } from './bikeRequestsQueryKeys';

const bikeRequestsService = new BikeRequestsService();

/**
 * Página de solicitudes de motos de Arranca, de la más nueva a la más vieja,
 * **acotada a la sucursal activa** (`0` = todas). Igual que
 * `useArrancaBalances`: espera a que la sucursal se hidrate en vez de caer a
 * `0`, paginado en el servidor y con los contadores de las pestañas en la
 * misma respuesta.
 *
 * @param queryParameters - Paginación, estado, búsqueda y fechas
 */
export function useBikeRequests(queryParameters: GetBikeRequestsQueryParams) {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [BIKE_REQUESTS_QUERY_KEY, token, branchId, queryParameters],
    queryFn: () =>
      bikeRequestsService.getBikeRequests(
        token as string,
        branchId as number,
        queryParameters
      ),
    enabled: !!token && branchId !== undefined,
    // Cambiar de pestaña o de filtro no vacía la tabla mientras llega la nueva página
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    /** Sucursal activa; `0` = todas. `undefined` mientras se hidrata. */
    bikeRequestsBranchId: branchId,
    isAllBranchesBikeRequestsView: branchId === 0,
    bikeRequests: data?.results ?? [],
    bikeRequestStatusCounts: data?.staticData?.statusCounts,
    totalBikeRequests: data?.totalElements ?? 0,
    totalBikeRequestPages: data?.totalPages ?? 1,
    isLoadingBikeRequests: isLoading || branchId === undefined,
    isFetchingBikeRequests: isFetching,
    isErrorBikeRequests: isError,
    refetchBikeRequests: refetch,
  };
}
