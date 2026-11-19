import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  Approval,
  ApprovalEnvelope,
  ApprovalLookup,
  ApprovalPage,
  ApprovalPendingByModel,
  ApprovalPendingUnits,
  ApprovalSearchResult,
  CreateApprovalPayload,
  MoveApprovalBikesPayload,
  GetApprovalsQueryParams,
  UpdateApprovalPayload,
} from './types';

const BASE_ENDPOINT = '/approvals';
const MULTIPART = { 'Content-Type': 'multipart/form-data' };

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
 * Aprobaciones de Empire Keeway: lo aprobado por modelo y lo recibido.
 *
 * Lo recibido no se carga a mano: cada compra de moto a Empire con el número
 * de aprobación cuenta sola, y anular la compra la descuenta.
 */
export class ApprovalsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Listado paginado, de la aprobación más nueva a la más vieja.
   * @param branchId - Sucursal que cargó la aprobación; `0` = todas
   */
  public async getApprovals(
    token: string,
    branchId: number | string = 0,
    queryParameters: GetApprovalsQueryParams = {}
  ): Promise<ApprovalPage> {
    const response = await this.service.get<ApprovalEnvelope<ApprovalPage>>({
      endpoint: `${BASE_ENDPOINT}/all/${branchId}`,
      params: cleanParams(queryParameters),
      token,
    });
    return response.data;
  }

  /** Detalle con líneas, motos recibidas y URL firmada del documento. */
  public async getApproval(token: string, id: number): Promise<Approval> {
    const response = await this.service.get<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}`,
      token,
    });
    return response.data;
  }

  /**
   * Registra una aprobación tal como la aprobó Empire. Las compras ya
   * registradas con ese número se vinculan solas (`linkedPurchases`).
   */
  public async createApproval(
    token: string,
    payload: CreateApprovalPayload
  ): Promise<Approval> {
    const response = await this.service.post<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/`,
      data: payload,
      token,
    });
    return response.data;
  }

  /** Edita encabezado y líneas (las líneas son el conjunto completo nuevo). */
  public async updateApproval(
    token: string,
    id: number,
    payload: UpdateApprovalPayload
  ): Promise<Approval> {
    const response = await this.service.patch<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /** Empire no enviará el resto: deja de esperarlo. Lo recibido se queda. */
  public async closeApproval(
    token: string,
    id: number,
    reason: string
  ): Promise<Approval> {
    const response = await this.service.post<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}/close`,
      data: { reason },
      token,
    });
    return response.data;
  }

  /**
   * Pasa motos aún no recibidas de un modelo a otra sucursal (Empire las
   * entregó en otro lado). Lo ya recibido no se mueve.
   */
  public async moveBikes(
    token: string,
    id: number,
    payload: MoveApprovalBikesPayload
  ): Promise<Approval> {
    const response = await this.service.post<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}/move`,
      data: payload,
      token,
    });
    return response.data;
  }

  /** Solo admin / administrador. */
  public async reopenApproval(token: string, id: number): Promise<Approval> {
    const response = await this.service.post<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}/reopen`,
      token,
    });
    return response.data;
  }

  /**
   * Sube (o reemplaza) el documento de Empire: PDF o foto, hasta 20 MB. Se
   * guarda como `Empire Approvals/<número>_<fecha>.<ext>`.
   */
  public async uploadDocument(
    token: string,
    id: number,
    file: File
  ): Promise<Approval> {
    const formData = new FormData();
    formData.append('document', file);
    const response = await this.service.post<ApprovalEnvelope<Approval>>({
      endpoint: `${BASE_ENDPOINT}/${id}/document`,
      data: formData,
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  /** "Motos por recibir". `0` = todas las sucursales. Sin paginar. */
  public async getPendingUnits(
    token: string,
    branchId: number | string = 0
  ): Promise<ApprovalPendingUnits> {
    const response = await this.service.get<
      ApprovalEnvelope<ApprovalPendingUnits>
    >({
      endpoint: `${BASE_ENDPOINT}/pending-units/${branchId}`,
      token,
    });
    return response.data;
  }

  /**
   * Autocompletado: aprobaciones abiertas cuyo número empieza con `q`, de
   * menor a mayor. Con `branchId`, cada una trae lo pendiente para esa sucursal.
   */
  public async search(
    token: string,
    q: string,
    branchId?: number
  ): Promise<ApprovalSearchResult[]> {
    const response = await this.service.get<
      ApprovalEnvelope<ApprovalSearchResult[]>
    >({
      endpoint: `${BASE_ENDPOINT}/search`,
      params: cleanParams({ q, branch: branchId || undefined }),
      token,
    });
    return response.data;
  }

  /** Por recibir de Empire por modelo para una sucursal (`0` = todas). */
  public async getPendingByModel(
    token: string,
    branchId: number | string = 0
  ): Promise<ApprovalPendingByModel[]> {
    const response = await this.service.get<
      ApprovalEnvelope<ApprovalPendingByModel[]>
    >({
      endpoint: `${BASE_ENDPOINT}/pending-by-model/${branchId}`,
      token,
    });
    return response.data;
  }

  /**
   * Modelos y cupo de una aprobación, para el carrito de compra. 404 si el
   * número no existe.
   * @param purchaseOrderId - Al editar una preorden, para no contarla dos veces
   */
  public async lookup(
    token: string,
    number: string,
    purchaseOrderId?: number
  ): Promise<ApprovalLookup> {
    const response = await this.service.get<ApprovalEnvelope<ApprovalLookup>>({
      endpoint: `${BASE_ENDPOINT}/lookup`,
      params: cleanParams({ number, purchaseOrder: purchaseOrderId }),
      token,
    });
    return response.data;
  }
}
