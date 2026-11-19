import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import { TransactionDataPayload } from '@/services/transactions/types/GetAllTransactions';
import { GetMechanicsReportResponse } from './types/MechanicReport.type';

export interface BikeServiceTransactionPayload extends TransactionDataPayload {
  mechanic: string;
}

/**
 * Segmento que va en la URL cuando el servicio no es una instalación de GPS y
 * no hay tracker que nombrar. Espeja `NO_IMEI_PLACEHOLDER` en
 * `services/views.py`: el backend ignora lo que llegue ahí mientras el producto
 * no sea el de instalación, pero el segmento no puede faltar.
 */
export const NO_IMEI_PLACEHOLDER = '-';

export class BikeServicesService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Creates a service-type Transaction (bike activation, GPS install, etc.)
   * together with the mechanic who performed it, in one atomic call.
   *
   * `imei` nombra el tracker cuando el servicio **es** una instalación de GPS:
   * el backend resuelve la unidad, la pasa a `installed` y lo replica en Arranca
   * dentro de la misma transacción que el servicio, así que o se aplican las
   * tres cosas o ninguna. Para el resto de los servicios va
   * `NO_IMEI_PLACEHOLDER` — el segmento es obligatorio aunque no se use.
   */
  public async createBikeServiceTransaction(
    payload: BikeServiceTransactionPayload,
    token: string,
    imei: string = NO_IMEI_PLACEHOLDER
  ): Promise<any> {
    const response = await this.service.post<any>({
      endpoint: `/services/bike/transaction/${encodeURIComponent(imei)}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: payload,
    });
    return response;
  }

  /**
   * Service report grouped by mechanic (analogous to the sellers report, but
   * built from TransactionMechanic assignments rather than Order.seller).
   */
  public async getMechanicsReport(
    token: string,
    branchId: string,
    queryParameters: {
      mechanic?: string;
      start?: string;
      finish?: string;
      page?: string;
      pageSize?: string;
    } = {}
  ): Promise<GetMechanicsReportResponse> {
    const response = await this.service.get<GetMechanicsReportResponse>({
      endpoint: createUrl({
        url: `/services/mechanics/report/${branchId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
          ...(queryParameters.mechanic
            ? { mechanic: queryParameters.mechanic }
            : {}),
          ...(queryParameters.start ? { start: queryParameters.start } : {}),
          ...(queryParameters.finish ? { finish: queryParameters.finish } : {}),
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }
}
