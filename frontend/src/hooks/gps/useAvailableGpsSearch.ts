import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { GpsService } from '@/services/gps/gps.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { GPS_AVAILABLE_UNITS_QUERY_KEY } from './gpsQueryKeys';

const gpsService = new GpsService();

/**
 * Espera antes de consultar al servidor. Es deliberadamente larga (1,5s): el
 * IMEI se teclea entero de corrido, así que buscar a mitad del número solo
 * devuelve ruido. El componente muestra un spinner durante toda la espera para
 * que el retardo se lea como "buscando", no como "se colgó".
 */
export const GPS_SEARCH_DEBOUNCE_MS = 1500;

/** Cuántas opciones trae el desplegable como máximo. */
const GPS_SEARCH_PAGE_SIZE = 20;

/**
 * Búsqueda con debounce de unidades GPS **disponibles**, para el autocompletado
 * de IMEI al instalar un GPS en una moto.
 *
 * Solo devuelve unidades en estado `available`: una unidad ya instalada, en
 * calle o pendiente no puede volver a instalarse, así que nunca debe aparecer
 * como opción.
 *
 * Y solo las de la **sucursal activa**, igual que el monitoreo: no se puede
 * instalar una unidad que está en otra sucursal. Desde la sucursal `0` (Super
 * Admin) se ven todas.
 *
 * @param term - Texto tecleado (IMEI, número de línea, marca o modelo)
 * @param enabled - Permite no consultar mientras el desplegable está cerrado
 * @returns Opciones y estados de la búsqueda, incluido el debounce en curso
 */
export function useAvailableGpsSearch(term: string, enabled = true) {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const trimmedTerm = term.trim();

  const [debouncedTerm, setDebouncedTerm] = useState(trimmedTerm);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (trimmedTerm === debouncedTerm) {
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    const timeoutId = setTimeout(() => {
      setDebouncedTerm(trimmedTerm);
      setIsDebouncing(false);
    }, GPS_SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  }, [trimmedTerm, debouncedTerm]);

  const { data, isFetching, isError, refetch } = useQuery({
    queryKey: [GPS_AVAILABLE_UNITS_QUERY_KEY, token, branchId, debouncedTerm],
    queryFn: () =>
      gpsService.getGpsUnits(token as string, branchId as number, {
        status: 'available',
        search: debouncedTerm || undefined,
        page: 1,
        pageSize: GPS_SEARCH_PAGE_SIZE,
      }),
    enabled: !!token && enabled && branchId !== undefined,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000,
  });

  return {
    // Una unidad en traslado no se instala hasta que la sucursal que recibe la
    // acepta (el backend responde 409), así que no se ofrece.
    availableUnits: (data?.results ?? []).filter(
      (unit) => !unit.transferFromBranch
    ),
    totalAvailableUnits: data?.totalElements ?? 0,
    /** Cierto durante la espera del debounce y mientras la consulta viaja. */
    isSearchingAvailableUnits: isDebouncing || isFetching,
    /** Solo la espera del debounce, sin la consulta. */
    isDebouncingAvailableUnits: isDebouncing,
    isErrorAvailableUnits: isError,
    refetchAvailableUnits: refetch,
  };
}
