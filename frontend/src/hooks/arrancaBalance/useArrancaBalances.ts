import { useQuery } from '@tanstack/react-query';

import { ArrancaBalanceService } from '@/services/arrancaBalance/arrancaBalance.service';
import { GetArrancaBalancesQueryParams } from '@/services/arrancaBalance/types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { ARRANCA_BALANCES_QUERY_KEY } from './arrancaBalanceQueryKeys';

const arrancaBalanceService = new ArrancaBalanceService();

/**
 * Página de movimientos entre Moto Candela y Arranca, del más reciente al más
 * antiguo, **acotada a la sucursal activa** (`0` = todas, el modo Super Admin
 * del `BranchSelector`).
 *
 * `currentBranchId` arranca en `undefined` y se hidrata de la cookie, así que la
 * consulta espera a que exista en vez de caer a `0`, igual que `useGpsUnits`.
 *
 * Paginado en el servidor: es un registro de dinero que solo crece. Cada
 * pestaña de estado es un `?status=` distinto, y los contadores vienen en la
 * misma respuesta (`statusCounts`).
 *
 * @param queryParameters - Paginación, estado, sentido, búsqueda y fechas
 */
export function useArrancaBalances(
  queryParameters: GetArrancaBalancesQueryParams
) {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: [ARRANCA_BALANCES_QUERY_KEY, token, branchId, queryParameters],
    queryFn: () =>
      arrancaBalanceService.getArrancaBalances(
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
    arrancaBalanceBranchId: branchId,
    isAllBranchesArrancaBalanceView: branchId === 0,
    arrancaBalances: data?.results ?? [],
    arrancaBalanceStatusCounts: data?.staticData?.statusCounts,
    totalArrancaBalances: data?.totalElements ?? 0,
    totalArrancaBalancePages: data?.totalPages ?? 1,
    // Mientras no se sabe la sucursal no hay consulta, pero la vista sigue
    // esperando datos: sin esto la tabla diría "no hay movimientos".
    isLoadingArrancaBalances: isLoading || branchId === undefined,
    isFetchingArrancaBalances: isFetching,
    isErrorArrancaBalances: isError,
    refetchArrancaBalances: refetch,
  };
}
