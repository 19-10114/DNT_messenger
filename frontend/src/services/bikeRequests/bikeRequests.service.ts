import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  BikeRequest,
  BikeRequestAvailableUnits,
  BikeRequestEnvelope,
  BikeRequestPage,
  BikeRequestPendingUnits,
  FulfillBikeRequestPayload,
  GetBikeRequestsQueryParams,
} from './types';

const BASE_ENDPOINT = '/bike-requests';

/** Quita los filtros vacíos para que no viajen como `?search=`. */
function cleanParams(queryParameters: object): {
  [key: string]: string | number;
} {
  const params: { [key: string]: string | number } = {};
  Object.entries(queryParameters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number;
    }
  });
  return params;
}

/**
 * Solicitudes de motos de Arranca a una sucursal de Moto Candela.
 *
 * Las crea y cancela Arranca; Moto Candela solo las despacha. Despachar se
 * replica en Arranca **dentro de la misma transacción** del backend: si
 * Arranca no responde o la rechaza, la respuesta es 502 y no se despachó nada.
 */
export class BikeRequestsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Listado paginado, de la más nueva a la más vieja. `staticData.statusCounts`
   * cuenta cada estado con los demás filtros aplicados (ignora `status`).
   * @param token - Token de autenticación
   * @param branchId - Sucursal MC; `0` = todas
   * @param queryParameters - Paginación, estado, búsqueda y fechas
   */
  public async getBikeRequests(
    token: string,
    branchId: number | string = 0,
    queryParameters: GetBikeRequestsQueryParams = {}
  ): Promise<BikeRequestPage> {
    const response = await this.service.get<
      BikeRequestEnvelope<BikeRequestPage>
    >({
      endpoint: `${BASE_ENDPOINT}/all/${branchId}`,
      params: cleanParams(queryParameters),
      token,
    });

    return response.data;
  }

  /**
   * Detalle con líneas y entregas (las anuladas incluidas).
   * @param token - Token de autenticación
   * @param bikeRequestId - Id local de la solicitud
   */
  public async getBikeRequest(
    token: string,
    bikeRequestId: number
  ): Promise<BikeRequest> {
    const response = await this.service.get<BikeRequestEnvelope<BikeRequest>>({
      endpoint: `${BASE_ENDPOINT}/${bikeRequestId}`,
      token,
    });

    return response.data;
  }

  /**
   * Motos que hoy pueden llenar cada línea pendiente: exactamente las que el
   * despacho aceptaría. 409 si la solicitud ya no está abierta.
   * @param token - Token de autenticación
   * @param bikeRequestId - Id local de la solicitud
   * @param search - Placa o chasis (opcional)
   */
  public async getAvailableUnits(
    token: string,
    bikeRequestId: number,
    search?: string
  ): Promise<BikeRequestAvailableUnits> {
    const response = await this.service.get<
      BikeRequestEnvelope<BikeRequestAvailableUnits>
    >({
      endpoint: `${BASE_ENDPOINT}/${bikeRequestId}/available-units`,
      params: cleanParams({ search }),
      token,
    });

    return response.data;
  }

  /**
   * Despacha un lote de motos. Cada moto se registra como venta a Arranca
   * (sucursal 43) y se replica allá en el acto; 502 = no se despachó nada.
   * @param token - Token de autenticación
   * @param bikeRequestId - Id local de la solicitud
   * @param payload - Motos por línea y número de factura opcional
   * @returns El detalle actualizado
   */
  public async fulfillBikeRequest(
    token: string,
    bikeRequestId: number,
    payload: FulfillBikeRequestPayload
  ): Promise<BikeRequest> {
    const response = await this.service.post<BikeRequestEnvelope<BikeRequest>>({
      endpoint: `${BASE_ENDPOINT}/${bikeRequestId}/fulfill`,
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * "Motos por entregar": una fila por línea pendiente de cada solicitud
   * abierta, de la más vieja a la más nueva, con totales. Sin paginar.
   * @param token - Token de autenticación
   * @param branchId - Sucursal MC; `0` = todas
   */
  public async getPendingUnits(
    token: string,
    branchId: number | string = 0
  ): Promise<BikeRequestPendingUnits> {
    const response = await this.service.get<
      BikeRequestEnvelope<BikeRequestPendingUnits>
    >({
      endpoint: `${BASE_ENDPOINT}/pending-units/${branchId}`,
      token,
    });

    return response.data;
  }
}
