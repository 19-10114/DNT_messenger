import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  ArrancaBalance,
  ArrancaBalanceDecision,
  ArrancaBalanceEnvelope,
  ArrancaBalancePage,
  ArrancaBalancePayload,
  GetArrancaBalancesQueryParams,
} from './types';

const BASE_ENDPOINT = '/transactions/arranca-balance';

/**
 * Movimientos de dinero entre Moto Candela y Arranca.
 *
 * Cada escritura se replica en Arranca **dentro de la misma transacción** del
 * backend: si Arranca no responde o la rechaza, la respuesta es 502 y no se
 * guarda nada — el error hay que mostrarlo, no ignorarlo.
 */
export class ArrancaBalanceService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Listado paginado de movimientos, del más reciente al más antiguo.
   * `staticData.statusCounts` cuenta cada estado con los demás filtros
   * aplicados (ignora `status`), para los contadores de las pestañas.
   * @param token - Token de autenticación
   * @param branchId - Sucursal MC a la que acotar; `0` = todas
   * @param queryParameters - Paginación, estado, sentido, búsqueda y fechas
   */
  public async getArrancaBalances(
    token: string,
    branchId: number | string = 0,
    queryParameters: GetArrancaBalancesQueryParams = {}
  ): Promise<ArrancaBalancePage> {
    const params: { [key: string]: string | number } = {};
    Object.entries(queryParameters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params[key] = value;
    });

    const response = await this.service.get<
      ArrancaBalanceEnvelope<ArrancaBalancePage>
    >({
      endpoint: `${BASE_ENDPOINT}/all/${branchId}`,
      params,
      token,
    });

    return response.data;
  }

  /**
   * Crea un movimiento pendiente en MC y en Arranca. El responsable es quien
   * hace el request.
   * @param token - Token de autenticación
   * @param payload - Datos del movimiento
   */
  public async createArrancaBalance(
    token: string,
    payload: ArrancaBalancePayload
  ): Promise<ArrancaBalance> {
    const response = await this.service.post<
      ArrancaBalanceEnvelope<ArrancaBalance>
    >({
      endpoint: `${BASE_ENDPOINT}/`,
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * Edita un movimiento. Solo vale para uno creado en Moto Candela y todavía
   * pendiente (409 si no). Editar deja como responsable a quien edita.
   * @param token - Token de autenticación
   * @param arrancaBalanceId - Id del movimiento
   * @param payload - Campos a modificar
   */
  public async updateArrancaBalance(
    token: string,
    arrancaBalanceId: number,
    payload: Partial<ArrancaBalancePayload>
  ): Promise<ArrancaBalance> {
    const response = await this.service.patch<
      ArrancaBalanceEnvelope<ArrancaBalance>
    >({
      endpoint: `${BASE_ENDPOINT}/${arrancaBalanceId}`,
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * Aprueba o rechaza un movimiento. Solo vale para uno creado en Arranca y
   * todavía pendiente (409 si no); la decisión es definitiva.
   * @param token - Token de autenticación
   * @param arrancaBalanceId - Id del movimiento
   * @param decision - `approved` o `declined`
   */
  public async decideArrancaBalance(
    token: string,
    arrancaBalanceId: number,
    decision: ArrancaBalanceDecision
  ): Promise<ArrancaBalance> {
    const response = await this.service.patch<
      ArrancaBalanceEnvelope<ArrancaBalance>
    >({
      endpoint: `${BASE_ENDPOINT}/${arrancaBalanceId}`,
      data: { status: decision },
      token,
    });

    return response.data;
  }
}
