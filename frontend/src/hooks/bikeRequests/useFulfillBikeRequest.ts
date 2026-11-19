import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BikeRequestsService } from '@/services/bikeRequests/bikeRequests.service';
import { FulfillBikeRequestPayload } from '@/services/bikeRequests/types';
import { useToken } from '@/stores/auth/auth.store';
import { ARRANCA_BALANCES_QUERY_KEY } from '@/hooks/arrancaBalance/arrancaBalanceQueryKeys';
import { ARRANCA_MC_REPORT_QUERY_KEY } from '@/hooks/arrancaMcReport/arrancaMcReportQueryKeys';
import {
  BIKE_REQUESTS_QUERY_KEY,
  BIKE_REQUEST_AVAILABLE_UNITS_QUERY_KEY,
  BIKE_REQUEST_PENDING_UNITS_QUERY_KEY,
  BIKE_REQUEST_QUERY_KEY,
} from './bikeRequestsQueryKeys';

const bikeRequestsService = new BikeRequestsService();

/**
 * Despacha un lote de motos de una solicitud. Invalida todo el módulo
 * (listado, detalle, disponibles y "Motos por entregar") y, como cada moto
 * genera una venta a Arranca con su movimiento de balance, también el balance
 * y el reporte "Arranca - MC".
 */
export function useFulfillBikeRequest() {
  const token = useToken();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({
      bikeRequestId,
      payload,
    }: {
      bikeRequestId: number;
      payload: FulfillBikeRequestPayload;
    }) =>
      bikeRequestsService.fulfillBikeRequest(
        token as string,
        bikeRequestId,
        payload
      ),
    onSuccess: () =>
      Promise.all([
        ...[
          BIKE_REQUESTS_QUERY_KEY,
          BIKE_REQUEST_QUERY_KEY,
          BIKE_REQUEST_PENDING_UNITS_QUERY_KEY,
          ARRANCA_BALANCES_QUERY_KEY,
          ARRANCA_MC_REPORT_QUERY_KEY,
        ].map((key) => queryClient.invalidateQueries({ queryKey: [key] })),
        // Solo se marca vieja: el diálogo se cierra al terminar, y volver a
        // pedirla ahora daría 409 si la solicitud quedó completada.
        queryClient.invalidateQueries({
          queryKey: [BIKE_REQUEST_AVAILABLE_UNITS_QUERY_KEY],
          refetchType: 'none',
        }),
      ]),
  });

  return {
    fulfillBikeRequest: mutation.mutateAsync,
    isFulfillingBikeRequest: mutation.isLoading,
  };
}
