import { useMutation, useQueryClient } from '@tanstack/react-query';

import { GpsService } from '@/services/gps/gps.service';
import { GpsTransferDecision } from '@/services/gps/types';
import { useToken } from '@/stores/auth/auth.store';
import {
  GPS_AVAILABLE_UNITS_QUERY_KEY,
  GPS_TRANSFERS_QUERY_KEY,
  GPS_UNITS_QUERY_KEY,
} from './gpsQueryKeys';

const gpsService = new GpsService();

/**
 * Las acciones que el monitoreo puede ejecutar sobre una fila: aprobar,
 * rechazar, cambiar de sucursal y aceptar o rechazar un traslado.
 *
 * Todas mueven el parque, así que invalidan las tres cachés del módulo — el
 * monitoreo, el desplegable de IMEI disponibles (aprobar agrega una unidad,
 * rechazar la saca) y los traslados pendientes.
 *
 * Aprobar y cambiar de sucursal son el PATCH de siempre, rechazar es el
 * DELETE. Cambiar de una sucursal a otra deja un traslado pendiente que la
 * sucursal que recibe acepta o rechaza (`decideTransfer`).
 */
export function useGpsUnitActions() {
  const token = useToken();
  const queryClient = useQueryClient();

  const invalidateGpsQueries = () => {
    queryClient.invalidateQueries({ queryKey: [GPS_UNITS_QUERY_KEY] });
    queryClient.invalidateQueries({
      queryKey: [GPS_AVAILABLE_UNITS_QUERY_KEY],
    });
    queryClient.invalidateQueries({ queryKey: [GPS_TRANSFERS_QUERY_KEY] });
  };

  const approveMutation = useMutation({
    mutationFn: (gpsUnitId: number) =>
      gpsService.approveGpsUnit(token as string, gpsUnitId),
    onSuccess: invalidateGpsQueries,
  });

  const rejectMutation = useMutation({
    mutationFn: (gpsUnitId: number) =>
      gpsService.deleteGpsUnit(token as string, gpsUnitId),
    onSuccess: invalidateGpsQueries,
  });

  const branchMutation = useMutation({
    mutationFn: ({
      gpsUnitId,
      targetBranch,
    }: {
      gpsUnitId: number;
      /** Sucursal MC destino. Vaciar la sucursal no es una operación válida. */
      targetBranch: number;
    }) =>
      gpsService.updateGpsUnit(token as string, gpsUnitId, { targetBranch }),
    onSuccess: invalidateGpsQueries,
  });

  const transferMutation = useMutation({
    mutationFn: ({
      gpsUnitId,
      decision,
    }: {
      gpsUnitId: number;
      decision: GpsTransferDecision;
    }) => gpsService.decideGpsTransfer(token as string, gpsUnitId, decision),
    onSuccess: invalidateGpsQueries,
  });

  return {
    approveGpsUnit: approveMutation.mutateAsync,
    rejectGpsUnit: rejectMutation.mutateAsync,
    setGpsUnitBranch: branchMutation.mutateAsync,
    decideGpsTransfer: transferMutation.mutateAsync,
    isDecidingGpsTransfer: transferMutation.isLoading,
    isApprovingGpsUnit: approveMutation.isLoading,
    isRejectingGpsUnit: rejectMutation.isLoading,
    isChangingGpsUnitBranch: branchMutation.isLoading,
    /** Cualquier acción en vuelo: con esto la tabla bloquea sus botones. */
    isActingOnGpsUnit:
      approveMutation.isLoading ||
      rejectMutation.isLoading ||
      branchMutation.isLoading ||
      transferMutation.isLoading,
  };
}
