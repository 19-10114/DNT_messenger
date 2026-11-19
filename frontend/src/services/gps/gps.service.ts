import { Pagination } from '@/models/pagination.model';
import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  GetGpsUnitsQueryParams,
  GpsEnvelope,
  GpsUnit,
  GpsTransferDecision,
  GpsTransfers,
  GpsUnitsSnapshot,
  UpdateGpsUnitPayload,
} from './types';

/**
 * Tamaño de página del snapshot completo. El listado de GPS es una tabla
 * angosta (una fila por tracker), así que conviene traer pocas páginas grandes
 * en vez de muchas chicas.
 */
const SNAPSHOT_PAGE_SIZE = 200;

/**
 * Techo de páginas del snapshot: 5.000 unidades. Existe para que un inventario
 * inesperadamente grande no dispare decenas de requests; al alcanzarlo el
 * snapshot se marca `isTruncated` y la vista lo informa.
 */
const SNAPSHOT_MAX_PAGES = 25;

export class GpsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Listado paginado de unidades GPS.
   * @param token - Token de autenticación
   * @param branchId - Sucursal destino a la que acotar; `0` = todas
   * @param queryParameters - Paginación, filtro por estado/responsable y búsqueda
   */
  public async getGpsUnits(
    token: string,
    branchId: number | string = 0,
    queryParameters: GetGpsUnitsQueryParams = {}
  ): Promise<Pagination<GpsUnit>> {
    const { page, pageSize, status, responsible, search } = queryParameters;
    const params: { [key: string]: string | number } = {};
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    if (status) params.status = status;
    if (responsible) params.responsible = responsible;
    if (search) params.search = search;

    const response = await this.service.get<GpsEnvelope<Pagination<GpsUnit>>>({
      endpoint: `/gps/all/${branchId}`,
      params,
      token,
    });

    return response.data;
  }

  /**
   * Inventario completo de unidades GPS, recorriendo todas las páginas.
   *
   * La vista de monitoreo necesita el universo entero: los KPIs cuentan por
   * estado y una de las pestañas es "todo lo que NO está disponible", que el
   * filtro `?status=` del backend (un único estado) no sabe expresar. Traerlo
   * una vez y derivar en cliente evita tanto un filtro imposible como cinco
   * consultas paralelas solo para contar.
   *
   * @param token - Token de autenticación
   * @param branchId - Sucursal destino a la que acotar; `0` = todas
   */
  public async getAllGpsUnits(
    token: string,
    branchId: number | string = 0
  ): Promise<GpsUnitsSnapshot> {
    const firstPage = await this.getGpsUnits(token, branchId, {
      page: 1,
      pageSize: SNAPSHOT_PAGE_SIZE,
    });

    const totalPages = firstPage.totalPages ?? 1;
    const pagesToFetch = Math.min(totalPages, SNAPSHOT_MAX_PAGES);

    const remainingPages = await Promise.all(
      Array.from({ length: Math.max(pagesToFetch - 1, 0) }, (_, index) =>
        this.getGpsUnits(token, branchId, {
          page: index + 2,
          pageSize: SNAPSHOT_PAGE_SIZE,
        })
      )
    );

    return {
      units: [
        ...(firstPage.results ?? []),
        ...remainingPages.flatMap((page) => page.results ?? []),
      ],
      totalElements: firstPage.totalElements ?? 0,
      isTruncated: totalPages > SNAPSHOT_MAX_PAGES,
    };
  }

  /**
   * Unidad GPS individual.
   * @param token - Token de autenticación
   * @param gpsUnitId - Id de la unidad
   */
  public async getGpsUnitById(
    token: string,
    gpsUnitId: number
  ): Promise<GpsUnit> {
    const response = await this.service.get<GpsEnvelope<GpsUnit>>({
      endpoint: `/gps/${gpsUnitId}`,
      token,
    });

    return response.data;
  }

  /**
   * Actualiza una unidad GPS (cambio de estado, responsable, sucursal...).
   *
   * Ojo: el backend replica el cambio en Arranca dentro de la misma
   * transacción, así que un fallo de esa sincronización responde 502 y **no**
   * guarda nada — el error hay que mostrarlo, no ignorarlo.
   *
   * @param token - Token de autenticación
   * @param gpsUnitId - Id de la unidad
   * @param payload - Campos a modificar
   */
  public async updateGpsUnit(
    token: string,
    gpsUnitId: number,
    payload: UpdateGpsUnitPayload
  ): Promise<GpsUnit> {
    const response = await this.service.patch<GpsEnvelope<GpsUnit>>({
      endpoint: `/gps/${gpsUnitId}`,
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * Aprueba una unidad: la deja `available` en Moto Candela.
   *
   * No es un endpoint aparte, es el PATCH de siempre — pero la transición
   * `pending` -> `available` es la única que el backend replica en Arranca como
   * `on_branch` (ver `patch_for_update` en `gps/services/arranca.py`): en MC
   * "disponible" después de "pendiente" significa que la unidad ya llegó a su
   * sucursal, que es lo que `on_branch` quiere decir allá.
   *
   * Por eso aprobar solo tiene sentido sobre una unidad `pending`. Hacerlo
   * sobre cualquier otra deja MC en `available` **sin** avisarle a Arranca, y
   * los dos registros quedan diciendo cosas distintas.
   *
   * @param token - Token de autenticación
   * @param gpsUnitId - Id de la unidad
   */
  public async approveGpsUnit(
    token: string,
    gpsUnitId: number
  ): Promise<GpsUnit> {
    return this.updateGpsUnit(token, gpsUnitId, { status: 'available' });
  }

  /**
   * Traslados entre sucursales pendientes de una sucursal: los que tiene que
   * decidir (`incoming`) y los que envió (`outgoing`).
   * @param token - Token de autenticación
   * @param branchId - Sucursal; `0` = todos los pendientes, en `incoming`
   */
  public async getGpsTransfers(
    token: string,
    branchId: number | string
  ): Promise<GpsTransfers> {
    const response = await this.service.get<GpsEnvelope<GpsTransfers>>({
      endpoint: `/gps/transfers/${branchId}`,
      token,
    });

    return response.data;
  }

  /**
   * Acepta o rechaza el traslado pendiente de una unidad.
   *
   * Aceptar no cambia nada en Arranca (ya muestra la sucursal que recibe).
   * Rechazar devuelve la unidad a la sucursal que la envió, acá y en Arranca a
   * la vez: si Arranca falla responde 502 y no cambia nada. El estado de la
   * unidad no se toca en ningún caso.
   * @param token - Token de autenticación
   * @param gpsUnitId - Id de la unidad
   * @param decision - `accept` o `decline`
   */
  public async decideGpsTransfer(
    token: string,
    gpsUnitId: number,
    decision: GpsTransferDecision
  ): Promise<GpsUnit> {
    const response = await this.service.post<GpsEnvelope<GpsUnit>>({
      endpoint: `/gps/${gpsUnitId}/transfer/${decision}`,
      data: {},
      token,
    });

    return response.data;
  }

  /**
   * Rechaza una unidad: la borra en Moto Candela.
   *
   * Es un borrado de verdad, no un soft delete. El backend deja la unidad
   * liberada en Arranca (`{targetBranch: null, status: 'available'}`), así que
   * el tracker vuelve a estar "en mano, sin asignar" allá.
   *
   * @param token - Token de autenticación
   * @param gpsUnitId - Id de la unidad
   */
  public async deleteGpsUnit(
    token: string,
    gpsUnitId: number
  ): Promise<{ success: boolean }> {
    const response = await this.service.delete<
      GpsEnvelope<{ success: boolean }>
    >({
      endpoint: `/gps/${gpsUnitId}`,
      token,
    });

    return response.data;
  }
}
