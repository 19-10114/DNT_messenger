import { useQuery } from '@tanstack/react-query';

import { BikeRequestsService } from '@/services/bikeRequests/bikeRequests.service';
import { useToken } from '@/stores/auth/auth.store';
import { BIKE_REQUEST_AVAILABLE_UNITS_QUERY_KEY } from './bikeRequestsQueryKeys';

const bikeRequestsService = new BikeRequestsService();

/**
 * Motos que hoy pueden llenar cada línea pendiente de la solicitud. Solo se
 * pide con el diálogo de despacho abierto (`enabled`) y siempre fresca: el
 * stock cambia, y una moto listada debe ser una moto que el despacho acepta.
 * La búsqueda por placa/chasis se hace en el cliente sobre esta lista, para
 * que filtrar no pierda lo ya elegido.
 *
 * @param bikeRequestId - Id local de la solicitud
 * @param enabled - `true` mientras el diálogo esté abierto
 */
export function useBikeRequestAvailableUnits(
  bikeRequestId: number,
  enabled: boolean
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [BIKE_REQUEST_AVAILABLE_UNITS_QUERY_KEY, token, bikeRequestId],
    queryFn: () =>
      bikeRequestsService.getAvailableUnits(token as string, bikeRequestId),
    enabled: !!token && enabled && bikeRequestId > 0,
    staleTime: 0,
    cacheTime: 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return {
    availableUnits: data,
    isLoadingAvailableUnits: enabled && isLoading,
    isFetchingAvailableUnits: isFetching,
    isErrorAvailableUnits: isError,
    availableUnitsError: error,
    refetchAvailableUnits: refetch,
  };
}
