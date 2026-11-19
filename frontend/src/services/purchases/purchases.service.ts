import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import { Pagination } from '@/models/pagination.model';
import {
  BikeIdentityCheckPayload,
  BikeIdentityConflict,
  CreatePurchaseOrderPayload,
  UpdatePurchaseOrderPayload,
  GetAllPurchaseOrdersQueryParams,
  PurchaseOrder,
  PurchaseOrderResponse,
} from './types/PurchaseOrder.type';
import {
  ProcurementAnalysisData,
  ProcurementAnalysisResponse,
  ProductBranchBreakdownData,
  ProductBranchBreakdownResponse,
} from './types/ProcurementAnalysis.type';
import {
  AnyInvoicePage,
  AnyInvoicePageResponse,
  InvoiceCartKind,
  InvoiceReaderStatusResponse,
} from './types/InvoiceReader.type';

interface GetAllPurchaseOrdersBackendResponse {
  message: string;
  data: Pagination<PurchaseOrder>;
}

export class PurchasesService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getAllPurchaseOrders(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllPurchaseOrdersQueryParams = {}
  ): Promise<Pagination<PurchaseOrder>> {
    const response =
      await this.service.get<GetAllPurchaseOrdersBackendResponse>({
        endpoint: createUrl({
          url: `/purchases/all/${branchId}`,
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            ...(queryParameters?.category && {
              category: queryParameters.category,
            }),
            ...(queryParameters?.status && { status: queryParameters.status }),
          },
        }),
        token,
      });
    return response.data;
  }

  public async getPurchaseOrder(
    token: string | undefined,
    id: number
  ): Promise<PurchaseOrder> {
    const response = await this.service.get<PurchaseOrderResponse>({
      endpoint: `/purchases/${id}`,
      token,
    });
    return response.data;
  }

  /**
   * Reverse lookup by the resulting `Order` id, for the transaction detail
   * view: a transaction points at the `Order`, not the `PurchaseOrder` that
   * created it on approval.
   */
  public async getPurchaseOrderByOrderId(
    token: string | undefined,
    orderId: number
  ): Promise<PurchaseOrder> {
    const response = await this.service.get<PurchaseOrderResponse>({
      endpoint: `/purchases/by-order/${orderId}`,
      token,
    });
    return response.data;
  }

  public async createPurchaseOrder(
    token: string | undefined,
    payload: CreatePurchaseOrderPayload
  ): Promise<PurchaseOrder> {
    const response = await this.service.post<PurchaseOrderResponse>({
      endpoint: '/purchases/',
      data: payload,
      token,
    });
    return response.data;
  }

  public async updatePurchaseOrder(
    token: string | undefined,
    id: number,
    payload: UpdatePurchaseOrderPayload
  ): Promise<PurchaseOrder> {
    const response = await this.service.patch<PurchaseOrderResponse>({
      endpoint: `/purchases/${id}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Placa y seriales contra las motos del sistema y las otras preórdenes
   * abiertas. Lo usa el carrito al agregar una moto; el backend lo vuelve a
   * verificar al guardar.
   */
  public async checkBikeIdentity(
    token: string | undefined,
    payload: BikeIdentityCheckPayload
  ): Promise<BikeIdentityConflict[]> {
    const response = await this.service.post<{
      message: string;
      data: { conflicts: BikeIdentityConflict[] };
    }>({
      endpoint: '/purchases/bike-identity-check',
      data: payload,
      token,
    });
    return response.data.conflicts;
  }

  public async approvePurchaseOrder(
    token: string | undefined,
    id: number
  ): Promise<PurchaseOrder> {
    const response = await this.service.post<PurchaseOrderResponse>({
      endpoint: `/purchases/${id}/approve`,
      data: {},
      token,
    });
    return response.data;
  }

  public async rejectPurchaseOrder(
    token: string | undefined,
    id: number,
    reason: string
  ): Promise<PurchaseOrder> {
    const response = await this.service.post<PurchaseOrderResponse>({
      endpoint: `/purchases/${id}/reject`,
      data: { reason },
      token,
    });
    return response.data;
  }

  /**
   * "Procura de Repuestos": qué comprar en una sucursal, ver ARCHITECTURE.md
   * (ProcurementAnalysisView).
   */
  public async getProcurementAnalysis(
    token: string | undefined,
    branchId: number,
    params: { lookbackDays?: number; leadTimeDays?: number } = {}
  ): Promise<ProcurementAnalysisData> {
    const response = await this.service.get<ProcurementAnalysisResponse>({
      endpoint: createUrl({
        url: `/purchases/procurement-analysis/${branchId}`,
        parameters: {
          ...(params.lookbackDays && {
            lookback_days: String(params.lookbackDays),
          }),
          ...(params.leadTimeDays && {
            lead_time_days: String(params.leadTimeDays),
          }),
        },
      }),
      token,
    });
    return response.data;
  }

  /**
   * "Ver detalle": desglose por sucursal de un repuesto, ver ARCHITECTURE.md
   * (ProcurementProductBranchesView).
   */
  public async getProductBranchBreakdown(
    token: string | undefined,
    productId: number
  ): Promise<ProductBranchBreakdownData> {
    const response = await this.service.get<ProductBranchBreakdownResponse>({
      endpoint: `/purchases/procurement-analysis/product/${productId}`,
      token,
    });
    return response.data;
  }

  /**
   * Si "Subir Factura" está disponible (el backend tiene Google Vision
   * configurado). Si no, el botón se muestra deshabilitado.
   */
  public async getInvoiceReaderStatus(
    token: string | undefined
  ): Promise<{ enabled: boolean }> {
    const response = await this.service.get<InvoiceReaderStatusResponse>({
      endpoint: '/purchases/invoice/status',
      token,
    });
    return response.data;
  }

  /**
   * Lee UNA página escaneada de factura de Empire Keeway y devuelve sus
   * líneas ya cruzadas con el catálogo. No crea nada. El PDF se parte en
   * páginas en el navegador: Cloud Run corta los requests en 32MB.
   * @param image - JPEG/PNG de la página (≤ 7MB)
   * @param page - Número de página, vuelve tal cual en la respuesta
   * @param kind - El carrito que lee: una página del otro tipo, o una nota de
   * crédito, vuelve `status: 'skipped'`
   */
  public async readInvoicePage(
    token: string | undefined,
    image: Blob,
    page: number,
    kind: InvoiceCartKind = 'parts'
  ): Promise<AnyInvoicePage> {
    const formData = new FormData();
    formData.append('image', image, `pagina-${page}.jpg`);
    formData.append('page', String(page));
    formData.append('kind', kind);
    const response = await this.service.post<AnyInvoicePageResponse>({
      endpoint: '/purchases/invoice/read-page',
      customHeaders: { 'Content-Type': 'multipart/form-data' },
      data: formData,
      token,
    });
    return response.data;
  }
}
