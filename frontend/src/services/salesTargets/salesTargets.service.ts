import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  NonWorkingDay,
  NonWorkingDayInput,
  SalesTargetConfig,
  SalesTargetConfigInput,
  SalesTargetOverview,
  SalesTargetQuery,
  SalesTargetReport,
} from './types';

const BASE_ENDPOINT = '/sales-targets';

interface Envelope<T> {
  message: string;
  data: T;
}

const monthParams = (month: string, cutoff?: string) => {
  const params: { [key: string]: string } = { month };
  if (cutoff) params.cutoff = cutoff;
  return params;
};

/**
 * Metas de ventas: meta mensual de motos por sucursal frente a lo vendido.
 * El backend hace todos los cálculos (cumplimiento, ritmos, proyecciones y
 * semáforo); aquí solo se piden y se guardan.
 */
export class SalesTargetsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /** Detalle de una sucursal (`0` = general), día a día. */
  public async getReport(
    token: string,
    { branchId, month, cutoff }: SalesTargetQuery
  ): Promise<SalesTargetReport> {
    const response = await this.service.get<Envelope<SalesTargetReport>>({
      endpoint: `${BASE_ENDPOINT}/report/${branchId}`,
      params: monthParams(month, cutoff),
      token,
    });
    return response.data;
  }

  /** Todas las sucursales con su cumplimiento, y los totales. */
  public async getOverview(
    token: string,
    month: string,
    cutoff?: string
  ): Promise<SalesTargetOverview> {
    const response = await this.service.get<Envelope<SalesTargetOverview>>({
      endpoint: `${BASE_ENDPOINT}/overview`,
      params: monthParams(month, cutoff),
      token,
    });
    return response.data;
  }

  /** La tabla de configuración del mes: meta actual y sugerida por sucursal. */
  public async getTargets(
    token: string,
    month: string
  ): Promise<SalesTargetConfig> {
    const response = await this.service.get<Envelope<SalesTargetConfig>>({
      endpoint: `${BASE_ENDPOINT}/targets`,
      params: monthParams(month),
      token,
    });
    return response.data;
  }

  /** Guarda todas las filas a la vez (solo admin). `targetUnits: null` borra. */
  public async saveTargets(
    token: string,
    month: string,
    rows: SalesTargetConfigInput[]
  ): Promise<SalesTargetConfig> {
    const response = await this.service.put<Envelope<SalesTargetConfig>>({
      endpoint: `${BASE_ENDPOINT}/targets`,
      params: monthParams(month),
      data: rows,
      token,
    });
    return response.data;
  }

  public async getNonWorkingDays(
    token: string,
    month: string
  ): Promise<NonWorkingDay[]> {
    const response = await this.service.get<Envelope<NonWorkingDay[]>>({
      endpoint: `${BASE_ENDPOINT}/non-working-days`,
      params: monthParams(month),
      token,
    });
    return response.data;
  }

  public async createNonWorkingDay(
    token: string,
    body: NonWorkingDayInput
  ): Promise<NonWorkingDay> {
    const response = await this.service.post<Envelope<NonWorkingDay>>({
      endpoint: `${BASE_ENDPOINT}/non-working-days`,
      data: body,
      token,
    });
    return response.data;
  }

  public async deleteNonWorkingDay(token: string, id: number): Promise<void> {
    await this.service.delete({
      endpoint: `${BASE_ENDPOINT}/non-working-days/${id}`,
      token,
    });
  }
}
