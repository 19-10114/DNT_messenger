/**
 * Prefijos de las query keys del módulo de GPS.
 *
 * Viven en su propio archivo, y no en el barrel, porque no solo los usan los
 * hooks de GPS: registrar la instalación de un GPS pasa por
 * `useCreateBikeService`, y esa mutación tiene que invalidar estas dos cachés
 * para que la unidad desaparezca del desplegable y del monitoreo en el acto.
 * Importarlos desde el barrel crearía un ciclo con los hooks que el barrel
 * reexporta.
 */
export const GPS_UNITS_QUERY_KEY = 'gpsUnits';
export const GPS_AVAILABLE_UNITS_QUERY_KEY = 'gpsAvailableUnits';
/** Traslados entre sucursales pendientes (`useGpsTransfers`). */
export const GPS_TRANSFERS_QUERY_KEY = 'gpsTransfers';
