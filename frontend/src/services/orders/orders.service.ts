import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { OrderDetails, PaymentMethod } from '@/stores/order/order.store';
import { Pagination } from '@/models/pagination.model';
import { createUrl } from '@/utils/createUrl.utils';
import {
  GetAllServiceQueryParametersType,
  GetDeliveryNotesQueryParams,
} from '@/services/transactions/types/GetAllTransactions';
import {
  OrderData,
  GetOrdersBackendResponse,
  Transaction,
  GetTransactionsByOrderResponse,
} from './types/Order.type';
import {
  GetOrderByIdResponse,
  OrderDetailsResponseData,
} from './types/GetOrderById.type';
import { InventoryDeliveryNotesResponse } from './types/Order.type';

export interface OrderPayload {
  order: {
    invoice_number: string;
    type: 'sale' | 'purchase';
    notes: string;
    payment_methods: PaymentMethod[];
    origin_branch: number;
    target_branch: number;
    total_invoice_bs: number;
    client: string;
    total_invoice_usd: number;
    total_billed_usd?: number;
    rate?: number;
    dom_reserve?: string;
    dom_number?: string;
    insurance_company?: string;
    insurance_number?: string;
    insurance_expiration?: string;
    observations?: string;
    billed?: boolean;
    delivery_note_number?: string;
    status?: string;
    seller?: string;
  };
  transactions: TransactionData[];
}

export interface TransactionData {
  order_id: string;
  plate?: string;
  color?: string;
  serial_number?: string;
  motor_serial?: string;
  in_number?: string;
  out_number?: string;
  year?: string;
  invoice_number: string;
  reception_date: string;
  amount: string;
  tax?: string;
  quantity: string;
  type: 'sale' | 'purchase';
  product: string;
  productName?: string;
  origin_branch: string;
  target_branch: string;
  user: string;
  responsible: string;
  notes?: string;
}

export interface CreateOrderResponse {
  message: string;
  data: {
    orderId: string;
    transactionIds: string[];
  };
}

export class OrderService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Crear una nueva orden con el payload estructurado según los requerimientos
   * @param payload - Datos de la orden y transacciones
   * @param token - Token de autenticación
   * @returns Respuesta del servidor
   */
  public async createOrder(
    payload: OrderPayload,
    token: string
  ): Promise<CreateOrderResponse> {
    const response = await this.service.post<CreateOrderResponse>({
      endpoint: '/orders/create',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: payload,
    });

    return response;
  }

  /**
   * Actualizar una orden existente (ej. facturar una nota de entrega)
   * Solo envía los datos de la orden, sin transacciones.
   * @param orderId - ID de la orden a actualizar
   * @param orderData - Datos de la orden (sin transacciones)
   * @param token - Token de autenticación
   * @returns Respuesta del servidor
   */
  public async patchOrder(
    orderId: string,
    orderData: OrderPayload['order'],
    token: string
  ): Promise<CreateOrderResponse> {
    const response = await this.service.patch<CreateOrderResponse>({
      endpoint: `/orders/${orderId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: orderData,
    });

    return response;
  }

  /**
   * Eliminar una orden existente
   * @param orderId - ID de la orden a eliminar
   * @param token - Token de autenticación
   */
  public async deleteOrder(
    orderId: string,
    token: string
  ): Promise<{ message: string }> {
    const response = await this.service.delete<{ message: string }>({
      endpoint: `/orders/${orderId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    return response;
  }

  /**
   * Revierte una orden y todas sus transacciones (solo admin).
   *
   * Distinto de `deleteOrder`: ese endpoint es la cancelación de pre órdenes
   * que usan los vendedores. Este además devuelve el saldo a favor del
   * cliente, regresa la orden de compra a `pending_approval` y rechaza
   * reversiones que dejarían el inventario en un estado imposible.
   */
  public async revertOrder(
    orderId: string,
    reason: string,
    token: string
  ): Promise<{ message: string }> {
    return this.service.post<{ message: string }>({
      endpoint: `/orders/${orderId}/revert`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: { reason },
    });
  }

  /**
   * Obtiene todas las órdenes de una sucursal (paginadas)
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @param queryParameters - Parámetros de paginación y búsqueda opcionales
   * @returns Paginación con la lista de órdenes
   */
  public async getAllOrders(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<OrderData>> {
    const response = await this.service.get<GetOrdersBackendResponse>({
      endpoint: createUrl({
        url: `/orders/all/${branchId}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          client: queryParameters?.search ?? '',
          ...(queryParameters?.category && {
            category: queryParameters.category,
          }),
          ...(queryParameters?.start && { start: queryParameters.start }),
          ...(queryParameters?.finish && { finish: queryParameters.finish }),
          ...(queryParameters?.branch && { branch: queryParameters.branch }),
          ...(queryParameters?.model && { model: queryParameters.model }),
        },
      }),
      token,
    });
    return response.data;
  }

  /**
   * Construir el payload de la orden a partir de los datos del store
   * @param orderDetails - Detalles de la orden
   * @param paymentMethods - Métodos de pago
   * @param selectedMotorcycles - Motocicletas seleccionadas
   * @param selectedSpareParts - Repuestos seleccionados
   * @param userId - ID del usuario
   * @returns Payload estructurado para la API
   */
  public buildOrderPayload(
    orderDetails: OrderDetails,
    paymentMethods: PaymentMethod[],
    selectedMotorcycles: any[],
    selectedSpareParts: any[],
    userId: string,
    clientId: string,
    totalInvoiceUsd: number
  ): OrderPayload {
    // Construir las transacciones para motocicletas
    const motorcycleTransactions: TransactionData[] = selectedMotorcycles.map(
      (moto, index) => ({
        order_id: orderDetails.invoice_number,
        plate: moto.plate || '',
        color: moto.color || '',
        serial_number: moto.serialNumber || moto.serial_number || '',
        motor_serial: moto.motorSerial || moto.motor_serial || '',
        in_number: moto.inNumber || moto.in_number || '',
        year: moto.year || new Date().getFullYear().toString(),
        invoice_number: orderDetails.invoice_number,
        reception_date: new Date().toISOString().split('T')[0],
        amount: (moto.price || 0).toString(),
        tax: '0',
        quantity: '1',
        type: orderDetails.type as 'sale' | 'purchase',
        product: moto.id || moto.sku || `moto-${index}`,
        productName: moto.name || moto.model || 'Motocicleta',
        origin_branch: orderDetails.origin_branch.toString(),
        target_branch: orderDetails.target_branch.toString(),
        user: userId,
        responsible: userId,
        notes: orderDetails.notes || '',
      })
    );

    // Construir las transacciones para repuestos
    const sparePartTransactions: TransactionData[] = selectedSpareParts.map(
      (part, index) => ({
        order_id: orderDetails.invoice_number,
        invoice_number: orderDetails.invoice_number,
        reception_date: new Date().toISOString().split('T')[0],
        amount: (part.price || 0).toString(),
        tax: '0',
        quantity: (part.quantity || 1).toString(),
        type: orderDetails.type as 'sale' | 'purchase',
        product: part.id || part.sku || `part-${index}`,
        productName: part.name || 'Repuesto',
        origin_branch: orderDetails.origin_branch.toString(),
        target_branch: orderDetails.target_branch.toString(),
        user: userId,
        responsible: userId,
        notes: orderDetails.notes || '',
      })
    );

    // Combinar todas las transacciones
    const allTransactions = [
      ...motorcycleTransactions,
      ...sparePartTransactions,
    ];

    // Construir el payload final
    const payload: OrderPayload = {
      order: {
        invoice_number: orderDetails.invoice_number,
        type: orderDetails.type as 'sale' | 'purchase',
        notes: orderDetails.notes || '',
        payment_methods: paymentMethods,
        origin_branch: orderDetails.origin_branch,
        target_branch: orderDetails.target_branch,
        total_invoice_bs: orderDetails.total_invoice_bs,
        client: clientId,
        total_invoice_usd: totalInvoiceUsd,
        total_billed_usd: orderDetails.total_billed_usd,
        dom_reserve: orderDetails.dom_reserve,
        dom_number: orderDetails.dom_number,
        insurance_company: orderDetails.insurance_company,
        insurance_number: orderDetails.insurance_number,
        insurance_expiration: orderDetails.insurance_expiration,
        observations: orderDetails.observations,
      },
      transactions: allTransactions,
    };

    return payload;
  }

  public async getOrderById(
    orderId: string,
    token: string
  ): Promise<GetOrderByIdResponse> {
    const raw = await this.service.get<any>({
      endpoint: `/orders/${orderId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    const data = (raw?.data ?? raw) as OrderDetailsResponseData;
    const message = raw?.message ?? 'ok';
    return { message, data };
  }

  /**
   * Obtiene las transacciones asociadas a una orden
   * @param orderId - ID de la orden
   * @param token - Token de autenticación
   * @returns Lista paginada de transacciones
   */
  public async getTransactionsByOrder(
    orderId: number,
    token: string
  ): Promise<Pagination<Transaction>> {
    const response = await this.service.get<GetTransactionsByOrderResponse>({
      endpoint: `/orders/transactions/${orderId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    return response.data;
  }
  /**
   * Obtiene las notas de entrega (órdenes con build=false) de una sucursal
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @param queryParameters - Parámetros de paginación y búsqueda opcionales
   * @returns Paginación con la lista de notas de entrega
   */
  public async getDeliveryNotes(
    token: string | undefined,
    branchId: string,
    queryParameters: GetDeliveryNotesQueryParams = {}
  ): Promise<Pagination<OrderData>> {
    try {
      const response = await this.service.get<GetOrdersBackendResponse>({
        endpoint: createUrl({
          url: `/orders/deliverynote/${branchId}`,
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            ...(queryParameters?.search && { client: queryParameters.search }),
            ...(queryParameters?.branch && { branch: queryParameters.branch }),
            ...(queryParameters?.category && {
              category: queryParameters.category,
            }),
            ...(queryParameters?.status && { status: queryParameters.status }),
            ...(queryParameters?.startDate && {
              start: queryParameters.startDate,
            }),
            ...(queryParameters?.endDate && { end: queryParameters.endDate }),
            ...(queryParameters?.preorder && {
              preorder: queryParameters.preorder,
            }),
            ...(queryParameters?.model && { model: queryParameters.model }),
            ...(queryParameters?.seller && { seller: queryParameters.seller }),
          },
        }),
        token,
      });
      return response.data;
    } catch (error: any) {
      // El backend retorna 404 cuando no hay notas de entrega
      if (error?.response?.status === 404) {
        return {
          results: [],
          totalPages: 1,
          currentPage: 1,
          totalElements: 0,
          pageSize: Number(queryParameters?.pageSize ?? '10'),
        };
      }
      throw error;
    }
  }

  public async getInventoryDeliveryNotes(
    token: string,
    branchId: string,
    category: number | string,
    page = 1,
    pageSize = 10,
    filters: {
      search?: string;
      startDate?: string;
      endDate?: string;
      model?: string;
      branch?: string;
      seller?: string;
    } = {}
  ): Promise<InventoryDeliveryNotesResponse> {
    return this.service.get<InventoryDeliveryNotesResponse>({
      endpoint: createUrl({
        url: `/orders/preorders/inventory/${branchId}`,
        parameters: {
          category: String(category),
          page: String(page),
          pageSize: String(pageSize),
          ...(filters.search && { client: filters.search }),
          ...(filters.startDate && { start: filters.startDate }),
          ...(filters.endDate && { end: filters.endDate }),
          ...(filters.model && { model: filters.model }),
          ...(filters.branch && { branch: filters.branch }),
          ...(filters.seller && { seller: filters.seller }),
        },
      }),
      token,
    });
  }

  async getBillingData(
    orderId: number,
    token: string,
    applyIgtf?: boolean
  ): Promise<BillingData> {
    const queryParam = applyIgtf !== undefined ? `?igtf=${applyIgtf}` : '';
    const response = await this.service.get<{
      message: string;
      data: BillingData;
    }>({
      endpoint: `/orders/billing/${orderId}${queryParam}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return (response as any).data ?? response;
  }
}

export interface BillingData {
  subTotal: number;
  iva: number;
  igtf: number;
  total: number;
}
