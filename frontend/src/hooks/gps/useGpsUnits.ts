import { useQuery } from '@tanstack/react-query';

import { GpsService } from '@/services/gps/gps.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { GPS_UNITS_QUERY_KEY } from './gpsQueryKeys';

const gpsService = new GpsService();

/**
 * Inventario de unidades GPS para la vista de monitoreo, **acotado a la
 * sucursal activa**.
 *
 * Una sucursal solo ve las unidades que le fueron enviadas (su
 * `target_branch`); el parque entero se ve únicamente desde la sucursal `0`,
 * que es el modo Super Admin del `BranchSelector`. El recorte lo hace el
 * backend en `/gps/all/<branchId>`.
 *
 * `currentBranchId` arranca en `undefined` y se hidrata de la cookie, así que
 * la consulta espera a que exista en vez de caer a `0`: ese default le
 * mostraría el parque completo a una sucursal durante el primer render.
 *
 * Trae el universo entero de esa sucursal una sola vez (todas las páginas)
 * porque la vista necesita contar por estado y mostrar la pestaña "no
 * disponibles", que el filtro de un único `status` del backend no puede
 * expresar. Filtrar, ordenar y paginar se hace en cliente sobre este snapshot,
 * así que cambiar de pestaña es instantáneo y no dispara requests.
 *
 * @returns Unidades, totales y estados de la consulta
 */
export function useGpsUnits() {
  const token = useToken();
  const branchId = useCurrentBranchId();

  const { data, isLoading, isFetching, isError, error, refetch } = useQuery({
    queryKey: [GPS_UNITS_QUERY_KEY, token, branchId],
    queryFn: () =>
      gpsService.getAllGpsUnits(token as string, branchId as number),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    // El listado se recarga con el botón de actualizar, no al recuperar el foco
    refetchOnWindowFocus: false,
    staleTime: 60 * 1000,
  });

  return {
    /** `true` cuando la vista muestra el parque completo (Super Admin). */
    isAllBranchesGpsView: branchId === 0,
    gpsUnits: data?.units ?? [],
    totalGpsUnits: data?.totalElements ?? 0,
    isTruncatedGpsUnits: data?.isTruncated ?? false,
    // Mientras no se sabe la sucursal no hay consulta, pero la vista sigue
    // esperando datos: sin esto la tabla diría "no hay unidades".
    isLoadingGpsUnits: isLoading || branchId === undefined,
    isFetchingGpsUnits: isFetching,
    isErrorGpsUnits: isError,
    gpsUnitsError: error,
    refetchGpsUnits: refetch,
  };
}
