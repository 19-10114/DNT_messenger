import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { ManagerDashboard, ManagerDashboardQuery } from './types';

const BASE_ENDPOINT = '/dashboard';

interface Envelope<T> {
  message: string;
  data: T;
}

/** Inicio de gerencia: el backend arma todos los bloques en una respuesta. */
export class DashboardService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Resumen de una sucursal (`0` = todas, solo Super Admin) en un rango.
   * `refresh` salta la caché de un minuto del servidor.
   */
  public async getManagerDashboard(
    token: string,
    { branchId, start, finish }: ManagerDashboardQuery,
    refresh = false
  ): Promise<ManagerDashboard> {
    const params: { [key: string]: string } = { start, finish };
    if (refresh) params.refresh = '1';
    const response = await this.service.get<Envelope<ManagerDashboard>>({
      endpoint: `${BASE_ENDPOINT}/manager/${branchId}`,
      params,
      token,
    });
    return response.data;
  }
}
