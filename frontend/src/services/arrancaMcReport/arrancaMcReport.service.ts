import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  ArrancaMcFeedPage,
  ArrancaMcFeedQuery,
  ArrancaMcFeedRow,
  ArrancaMcSummary,
  ArrancaMcSummaryQuery,
} from './types';

const BASE_ENDPOINT = '/transactions/arranca-mc-report';

/** El máximo que acepta el backend por página; lo usa la exportación. */
export const ARRANCA_MC_FEED_MAX_PAGE_SIZE = 100;

interface Envelope<T> {
  message: string;
  data: T;
}

/** Los filtros vacíos no viajan: `?kind=` pediría los de tipo "cadena vacía". */
function toParams(query: Record<string, string | number | undefined>) {
  const params: { [key: string]: string | number } = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params[key] = value;
  });
  return params;
}

/**
 * Reporte "Arranca - MC", desde el punto de vista de Moto Candela (positivo =
 * a favor de MC). Arranca calcula el mismo reporte con su copia de los datos.
 */
export class ArrancaMcReportService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * KPIs y series del reporte. El backend lo cachea 2 minutos.
   * @param token - Token de autenticación
   * @param query - Sucursal MC (`0` = todas) y rango de fechas
   */
  public async getSummary(
    token: string,
    { branchId, ...query }: ArrancaMcSummaryQuery
  ): Promise<ArrancaMcSummary> {
    const response = await this.service.get<Envelope<ArrancaMcSummary>>({
      endpoint: `${BASE_ENDPOINT}/summary/${branchId}`,
      params: toParams({ ...query }),
      token,
    });
    return response.data;
  }

  /**
   * Movimientos que afectan el balance, del más reciente al más antiguo, con
   * el balance acumulado después de cada uno. Filtrar no cambia ese acumulado.
   * @param token - Token de autenticación
   * @param query - Sucursal, rango, filtros y paginación
   */
  public async getFeed(
    token: string,
    { branchId, ...query }: ArrancaMcFeedQuery
  ): Promise<ArrancaMcFeedPage> {
    const response = await this.service.get<Envelope<ArrancaMcFeedPage>>({
      endpoint: `${BASE_ENDPOINT}/feed/${branchId}`,
      params: toParams({ ...query }),
      token,
    });
    return response.data;
  }

  /** Todas las filas del feed con estos filtros, página a página, para exportar. */
  public async getWholeFeed(
    token: string,
    query: Omit<ArrancaMcFeedQuery, 'page' | 'pageSize'>
  ): Promise<ArrancaMcFeedRow[]> {
    const rows: ArrancaMcFeedRow[] = [];
    let page = 1;
    let totalPages = 1;
    do {
      const result = await this.getFeed(token, {
        ...query,
        page,
        pageSize: ARRANCA_MC_FEED_MAX_PAGE_SIZE,
      });
      rows.push(...result.results);
      totalPages = result.totalPages;
      page += 1;
    } while (page <= totalPages);
    return rows;
  }
}
