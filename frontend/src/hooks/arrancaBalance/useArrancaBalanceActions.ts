import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ArrancaBalanceService } from '@/services/arrancaBalance/arrancaBalance.service';
import {
  ArrancaBalanceDecision,
  ArrancaBalancePayload,
} from '@/services/arrancaBalance/types';
import { useToken } from '@/stores/auth/auth.store';
import { ARRANCA_MC_REPORT_QUERY_KEY } from '@/hooks/arrancaMcReport/arrancaMcReportQueryKeys';
import { ARRANCA_BALANCES_QUERY_KEY } from './arrancaBalanceQueryKeys';

const arrancaBalanceService = new ArrancaBalanceService();

/**
 * Crear, editar y decidir (aprobar/rechazar) movimientos con Arranca. No hay
 * borrado: un movimiento equivocado se rechaza. Las tres invalidan el listado,
 * porque cualquiera cambia los contadores de las pestañas, y el reporte
 * "Arranca - MC", porque cambian sus cifras.
 */
export function useArrancaBalanceActions() {
  const token = useToken();
  const queryClient = useQueryClient();

  const invalidateArrancaBalances = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: [ARRANCA_BALANCES_QUERY_KEY] }),
      queryClient.invalidateQueries({
        queryKey: [ARRANCA_MC_REPORT_QUERY_KEY],
      }),
    ]);

  const createMutation = useMutation({
    mutationFn: (payload: ArrancaBalancePayload) =>
      arrancaBalanceService.createArrancaBalance(token as string, payload),
    onSuccess: invalidateArrancaBalances,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      arrancaBalanceId,
      payload,
    }: {
      arrancaBalanceId: number;
      payload: Partial<ArrancaBalancePayload>;
    }) =>
      arrancaBalanceService.updateArrancaBalance(
        token as string,
        arrancaBalanceId,
        payload
      ),
    onSuccess: invalidateArrancaBalances,
  });

  const decideMutation = useMutation({
    mutationFn: ({
      arrancaBalanceId,
      decision,
    }: {
      arrancaBalanceId: number;
      decision: ArrancaBalanceDecision;
    }) =>
      arrancaBalanceService.decideArrancaBalance(
        token as string,
        arrancaBalanceId,
        decision
      ),
    onSuccess: invalidateArrancaBalances,
  });

  return {
    createArrancaBalance: createMutation.mutateAsync,
    updateArrancaBalance: updateMutation.mutateAsync,
    decideArrancaBalance: decideMutation.mutateAsync,
    isSavingArrancaBalance:
      createMutation.isLoading || updateMutation.isLoading,
    isDecidingArrancaBalance: decideMutation.isLoading,
  };
}
