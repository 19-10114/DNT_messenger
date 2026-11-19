import { useQuery } from '@tanstack/react-query';

import { BikeRequestsService } from '@/services/bikeRequests/bikeRequests.service';
import { useToken } from '@/stores/auth/auth.store';
import { BIKE_REQUEST_QUERY_KEY } from './bikeRequestsQueryKeys';

const bikeRequestsService = new BikeRequestsService();

/**
 * Detalle de una solicitud (líneas y entregas). No se acota a la sucursal
 * activa: se llega por id desde el listado o desde "Motos por entregar".
 *
 * @param bikeRequestId - Id local de la solicitud
 */
export function useBikeRequest(bikeRequestId: number) {
  const token = useToken();
  const isValidId = Number.isInteger(bikeRequestId) && bikeRequestId > 0;

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [BIKE_REQUEST_QUERY_KEY, token, bikeRequestId],
    queryFn: () =>
      bikeRequestsService.getBikeRequest(token as string, bikeRequestId),
    enabled: !!token && isValidId,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    bikeRequest: data,
    isLoadingBikeRequest: isValidId && isLoading,
    isFetchingBikeRequest: isFetching,
    /** También `true` con un id inválido en la URL. */
    isErrorBikeRequest: isError || !isValidId,
    bikeRequestError: error,
    refetchBikeRequest: refetch,
  };
}
