import { Pagination } from '@/models/pagination.model';
import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  ActivityEnvelope,
  ActivityEvent,
  ActivityFeedPage,
  ActivityTargetModel,
  GetActivityFeedQueryParams,
} from './types';

export class ActivityService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Feed paginado de acciones, de la más reciente a la más antigua.
   * @param token - Token de autenticación
   * @param queryParameters - Paginación y filtros (actor, sucursal, sección, fechas)
   */
  public async getActivityFeed(
    token: string,
    queryParameters: GetActivityFeedQueryParams = {}
  ): Promise<ActivityFeedPage> {
    const params: { [key: string]: string | number } = {};
    Object.entries(queryParameters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params[key] = value;
      }
    });

    const response = await this.service.get<ActivityEnvelope<ActivityFeedPage>>(
      {
        endpoint: '/activity/',
        params,
        token,
      }
    );

    return response.data;
  }

  /**
   * Historia de una entidad (con lo relacionado), de lo más reciente a lo más
   * antiguo, paginada como el feed.
   * @param token - Token de autenticación
   * @param targetModel - Tipo de entidad (`used_bike`, `order`)
   * @param targetId - Id de la entidad
   */
  public async getEntityActivity(
    token: string,
    targetModel: ActivityTargetModel,
    targetId: number,
    page = 1,
    pageSize = 20
  ): Promise<Pagination<ActivityEvent>> {
    const response = await this.service.get<
      ActivityEnvelope<Pagination<ActivityEvent>>
    >({
      endpoint: `/activity/${targetModel}/${targetId}`,
      params: { page, pageSize },
      token,
    });

    return response.data;
  }
}
