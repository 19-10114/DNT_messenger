import axios from 'axios';
import { Pagination } from '@/models/pagination.model';
import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import {
  BalanceData,
  DebtPayload,
  GetAllServiceQueryParametersType,
  GetBalanceResponse,
  GetTransactionsBackendResponseType,
  TransactionDataPayload,
  TransactionDataResult,
  GetInventoryValueResponse,
} from './types/GetAllTransactions';
import {
  BranchDebtPayload,
  BranchDebtResponse,
  BranchTotalDebtResponse,
  BranchTotalDebtData,
} from './types/BranchDebt.type';
import { DebtObjectsResponse } from './types/DebtObjects.type';
import {
  SalesReportBackendResponse,
  SalesReportQueryParams,
  UtilityApiResponse,
  UtilityPayload,
} from './types/SalesReport.type';
import {
  DailyReportBackendResponse,
  DailyReportOthersBackendResponse,
  DailyReportQueryParams,
} from './types/DailyReport.type';
import { CashObjectsResponse } from './types/CashObjects.type';
import {
  ClientBonusResponse,
  ClientBonusData,
  ClientBalanceSummaryResponse,
  ClientBalanceSummaryData,
  ClientBalanceOrdering,
} from './types/ClientBonus.type';
import {
  ProductTransactionsParams,
  ProductTransactionsResponse,
} from './types/ProductTransactions.type';
import { ProductInventoryCostResponse } from './types/ProductInventoryCost.type';
import { ProductUtilityResponse } from './types/ProductUtility.type';
import { ProductSummaryResponse } from './types/ProductSummary.type';
import {
  GetPartsSoldReportResponse,
  GetPartSaleDetailResponse,
} from './types/PartsReport.type';
import {
  CategoryUtilityReportPayload,
  CategoryUtilityReportResponse,
} from './types/CategoryUtilityReport.type';

/**
 * El reporte diario responde 404 con `{ message, errors: [], data: [] }` cuando
 * no hay movimientos en la fecha consultada. Eso no es un error: se devuelve el
 * cuerpo tal cual para que el consumidor lo trate como "sin datos".
 */
function emptyResponseOn404<T extends { message: string; data: [] | object }>(
  error: unknown
): T {
  if (axios.isAxiosError(error) && error.response?.status === 404) {
    const body = error.response.data as T | undefined;
    if (body && Array.isArray(body.data)) {
      return body;
    }
  }
  throw error;
}

export class TransactionService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getAllTransactions(
    token: string | undefined,
    branchId?: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<TransactionDataResult>> {
    const response = await this.service.get<GetTransactionsBackendResponseType>(
      {
        endpoint: createUrl({
          url: branchId ? `/transactions/all/${branchId}` : '/transactions/all',
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            search: queryParameters?.search ?? '',
            ...(queryParameters?.originBranch && {
              origin_branch: queryParameters.originBranch,
            }),
            ...(queryParameters?.targetBranch && {
              target_branch: queryParameters.targetBranch,
            }),
          },
        }),
        token,
      }
    );

    return {
      ...response.data,
    };
  }

  /**
   * Obtiene el historial de servicios (activación, GPS, etc.) de una moto por su placa
   * @param token - Token de autenticación
   * @param plate - Placa de la moto
   */
  public async getBikeServiceHistory(
    token: string | undefined,
    plate: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<TransactionDataResult>> {
    const response = await this.service.get<GetTransactionsBackendResponseType>(
      {
        endpoint: createUrl({
          url: `/transactions/bike/services/${plate}`,
          parameters: {
            pageSize: queryParameters?.pageSize ?? '50',
            page: queryParameters?.page ?? '1',
          },
        }),
        token,
      }
    );

    return {
      ...response.data,
    };
  }

  public async getBranchBalance(
    token: string | undefined,
    id: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<BalanceData> {
    const response = await this.service.get<GetBalanceResponse>({
      endpoint: createUrl({
        url: `/transactions/balance/${id}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
        },
      }),
      token,
    });
    return response.data;
  }

  public async fetchTransactionsDebt(
    token: string | undefined,
    payload: DebtPayload,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<TransactionDataResult>> {
    const response =
      await this.service.post<GetTransactionsBackendResponseType>({
        endpoint: createUrl({
          url: '/transactions/all',
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            search: queryParameters?.search ?? '',
          },
        }),
        data: payload,
        token,
      });

    return {
      ...response.data,
    };
  }

  public async createBatchTransactions(
    payload: TransactionDataPayload[],
    token: string
  ): Promise<any> {
    const response =
      await this.service.post<GetTransactionsBackendResponseType>({
        endpoint: '/transactions/batch',
        customHeaders: {
          Authorization: `Token ${token}`,
        },
        data: payload,
      });
    const adaptedResponse: GetTransactionsBackendResponseType = {
      ...response,
    };

    return adaptedResponse;
  }

  public async createTransaction(
    payload: TransactionDataPayload,
    token: string
  ): Promise<any> {
    //TODO: ADD TYPES FOR PROMISE
    const response =
      await this.service.post<GetTransactionsBackendResponseType>({
        endpoint: '/transactions/',
        customHeaders: {
          Authorization: `Token ${token}`,
        },
        data: payload,
      });
    const adaptedResponse: GetTransactionsBackendResponseType = {
      ...response,
    };

    return adaptedResponse;
  }

  /**
   * Actualiza una transacción existente
   * @param payload - Datos de la transacción a actualizar
   * @param token - Token de autenticación
   * @returns Respuesta del servidor
   */
  public async updateTransaction(
    payload: TransactionDataPayload,
    token: string
  ): Promise<any> {
    const response =
      await this.service.patch<GetTransactionsBackendResponseType>({
        endpoint: `/transactions/`,
        customHeaders: {
          Authorization: `Token ${token}`,
        },
        data: payload,
      });
    const adaptedResponse: GetTransactionsBackendResponseType = {
      ...response,
    };

    return adaptedResponse;
  }

  public async deleteTransaction(
    payload: TransactionDataPayload,
    token: string
  ): Promise<any> {
    //TODO: ADD TYPES FOR PROMISE
    const response =
      await this.service.delete<GetTransactionsBackendResponseType>({
        endpoint: '/transactions',
        customHeaders: {
          Authorization: `Token ${token}`,
        },
        data: payload,
      });
    const adaptedResponse: GetTransactionsBackendResponseType = {
      ...response,
    };

    return adaptedResponse;
  }

  /**
   * Revierte una transacción suelta (solo admin).
   *
   * Solo para movimientos sin orden asociada -- traslados entre sucursales,
   * compras a Empire, ventas a Arranca. El backend rechaza con 409 una
   * transacción que pertenece a una orden: esa se revierte desde la orden.
   */
  public async revertTransaction(
    transactionId: number | string,
    reason: string,
    token: string
  ): Promise<{ message: string }> {
    return this.service.post<{ message: string }>({
      endpoint: `/transactions/${transactionId}/revert`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: { reason },
    });
  }

  /**
   * Obtiene la deuda entre dos sucursales
   * @param token - Token de autenticación
   * @param primaryBranchId - ID de la sucursal principal (referencia)
   * @param secondaryBranchId - ID de la sucursal secundaria (a donde apunta)
   * @returns Objeto con el monto de la deuda (positivo si la secundaria debe a la principal, negativo en caso contrario)
   */
  public async getBranchDebt(
    token: string | undefined,
    primaryBranchId: string,
    secondaryBranchId: string
  ): Promise<number> {
    const payload: BranchDebtPayload = {
      first_branch: primaryBranchId,
      second_branch: secondaryBranchId,
    };

    const response = await this.service.post<BranchDebtResponse>({
      endpoint: '/transactions/debt',
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Obtiene información de efectivo de una sucursal
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @returns Información de efectivo de la sucursal
   */
  public async getBranchCash(
    token: string | undefined,
    branchId: string
  ): Promise<any> {
    const response = await this.service.get<any>({
      endpoint: `/transactions/cash/${branchId}`,
      token,
    });
    return response.data;
  }

  /**
   * Obtiene el total de la deuda de una sucursal
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @returns Información detallada de las deudas de la sucursal y el total
   */
  public async getBranchTotalDebt(
    token: string | undefined,
    branchId: string
  ): Promise<BranchTotalDebtData> {
    const response = await this.service.get<BranchTotalDebtResponse>({
      endpoint: `/transactions/debt/${branchId}`,
      token,
    });
    return response.data;
  }

  /**
   * Obtiene una transacción por su ID
   * @param token - Token de autenticación
   * @param id - ID de la transacción
   * @returns Datos de la transacción
   */
  public async getTransactionById(
    token: string | undefined,
    id: string
  ): Promise<TransactionDataResult> {
    const response = await this.service.get<{ data: TransactionDataResult }>({
      endpoint: `/transactions/${id}`,
      token,
    });
    return response.data;
  }

  /**
   * Reporte de ventas por categoría, paginado
   */
  public async getSalesReport(
    token: string | undefined,
    branchId: string,
    params: SalesReportQueryParams
  ): Promise<SalesReportBackendResponse['data']> {
    const endpoint = createUrl({
      url: `/transactions/salesreport/${branchId}`,
      parameters: {
        start: params.start,
        finish: params.finish,
        category: params.category,
        page: params.page ?? '1',
        pageSize: params.pageSize ?? '10',
        ...(params.dp && { dp: 'true' }),
      },
    });

    const response = await this.service.get<SalesReportBackendResponse>({
      endpoint,
      token,
    });

    return response.data;
  }

  /**
   * Reporte diario base con paginación y totales
   */
  public async getDailyReport(
    token: string | undefined,
    branchId: string,
    params: DailyReportQueryParams
  ): Promise<DailyReportBackendResponse> {
    const endpoint = createUrl({
      url: `/transactions/dailyreport/${branchId}`,
      parameters: {
        date: params.date,
        page: params.page ?? '1',
        pageSize: params.pageSize ?? '10',
      },
    });

    return this.service
      .get<DailyReportBackendResponse>({ endpoint, token })
      .catch((error) => emptyResponseOn404<DailyReportBackendResponse>(error));
  }

  /**
   * Reporte diario: totales adicionales (dp, abonos, gastos, etc.)
   */
  public async getDailyReportOther(
    token: string | undefined,
    branchId: string,
    params: DailyReportQueryParams
  ): Promise<DailyReportOthersBackendResponse> {
    const endpoint = createUrl({
      url: `/transactions/dailyreport/other/${branchId}`,
      parameters: {
        date: params.date,
        page: params.page ?? '1',
        pageSize: params.pageSize ?? '10',
      },
    });

    return this.service
      .get<DailyReportOthersBackendResponse>({ endpoint, token })
      .catch((error) =>
        emptyResponseOn404<DailyReportOthersBackendResponse>(error)
      );
  }

  /**
   * Obtiene todas las transacciones de repuestos para una sucursal
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @returns Datos de las transacciones de repuestos
   */
  public async getAllPartTransactions(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<TransactionDataResult>> {
    const response = await this.service.get<GetTransactionsBackendResponseType>(
      {
        endpoint: createUrl({
          url: `/transactions/all/part/${branchId}`,
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            search: queryParameters?.search ?? '',
            ...(queryParameters?.start && { start: queryParameters.start }),
            ...(queryParameters?.finish && { finish: queryParameters.finish }),
            ...(queryParameters?.originBranch && {
              origin_branch: queryParameters.originBranch,
            }),
            ...(queryParameters?.targetBranch && {
              target_branch: queryParameters.targetBranch,
            }),
          },
        }),
        token,
      }
    );
    return {
      ...response.data,
    };
  }

  /**
   * Obtiene todas las transacciones de servicios (categoría servicios) para una sucursal
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @returns Datos de las transacciones de servicios
   */
  public async getAllServiceTransactions(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<TransactionDataResult>> {
    const response = await this.service.get<GetTransactionsBackendResponseType>(
      {
        endpoint: createUrl({
          url: `/transactions/all/service/${branchId}`,
          parameters: {
            pageSize: queryParameters?.pageSize ?? '10',
            page: queryParameters?.page ?? '1',
            search: queryParameters?.search ?? '',
            ...(queryParameters?.originBranch && {
              origin_branch: queryParameters.originBranch,
            }),
            ...(queryParameters?.targetBranch && {
              target_branch: queryParameters.targetBranch,
            }),
          },
        }),
        token,
      }
    );
    return {
      ...response.data,
    };
  }

  /**
   * Reporte de repuestos vendidos en un rango de fechas, uno por parte, con
   * ingreso/costo(FIFO)/utilidad, más KPIs (totales + métodos de pago).
   * branchId '0' = todas las sucursales (super admin).
   */
  public async getPartsSoldReport(
    token: string | undefined,
    branchId: string,
    queryParameters: {
      part?: string;
      start?: string;
      finish?: string;
      page?: string;
      pageSize?: string;
    } = {}
  ): Promise<GetPartsSoldReportResponse> {
    const response = await this.service.get<GetPartsSoldReportResponse>({
      endpoint: createUrl({
        url: `/transactions/parts/report/${branchId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
          ...(queryParameters.part ? { part: queryParameters.part } : {}),
          ...(queryParameters.start ? { start: queryParameters.start } : {}),
          ...(queryParameters.finish ? { finish: queryParameters.finish } : {}),
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Detalle de ventas individuales de un repuesto en un rango de fechas —
   * cada fila con su propio costo FIFO y precio de venta.
   */
  public async getPartSaleDetail(
    token: string | undefined,
    branchId: string,
    productId: number | string,
    queryParameters: {
      start?: string;
      finish?: string;
      page?: string;
      pageSize?: string;
    } = {}
  ): Promise<GetPartSaleDetailResponse> {
    const response = await this.service.get<GetPartSaleDetailResponse>({
      endpoint: createUrl({
        url: `/transactions/parts/report/${branchId}/${productId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
          ...(queryParameters.start ? { start: queryParameters.start } : {}),
          ...(queryParameters.finish ? { finish: queryParameters.finish } : {}),
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Obtiene objetos de deuda entre dos sucursales, paginados
   * @param token - Token de autenticación
   * @param firstBranch - ID de la primera sucursal
   * @param secondBranch - ID de la segunda sucursal
   * @param queryParameters - Parámetros de paginación
   */
  public async getDebtObjects(
    token: string | undefined,
    firstBranch: string,
    secondBranch: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<DebtObjectsResponse['data']> {
    const response = await this.service.post<{
      message: string;
      data: {
        currentPage: number;
        pageSize: number;
        totalElements: number;
        totalPages: number;
        results: Array<{
          id: number;
          date: string;
          product: string;
          amount: { source: string; parsedValue: number } | number | string;
          adds: boolean;
          type: string;
        }>;
        staticData?: {
          totalDebt?: { source: string; parsedValue: number } | number | string;
        };
      };
    }>({
      endpoint: createUrl({
        url: '/transactions/debt/objects',
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
        },
      }),
      data: {
        first_branch: firstBranch,
        second_branch: secondBranch,
      },
      token,
    });

    const backend = response.data;
    const debtObjects = (backend.results || []).map((item) => {
      const amt: any = item.amount;
      let amountNumber = 0;
      if (typeof amt === 'number') amountNumber = amt;
      else if (typeof amt === 'string') amountNumber = parseFloat(amt);
      else if (
        amt &&
        typeof amt === 'object' &&
        typeof amt.parsedValue === 'number'
      ) {
        amountNumber = amt.parsedValue;
      }
      return {
        id: item.id,
        date: item.date,
        product: item.product,
        amount: amountNumber,
        adds: item.adds,
        type: item.type,
      };
    });

    const td: any = backend.staticData?.totalDebt;
    let totalDebtNumber = 0;
    if (typeof td === 'number') totalDebtNumber = td;
    else if (typeof td === 'string') totalDebtNumber = parseFloat(td);
    else if (
      td &&
      typeof td === 'object' &&
      typeof td.parsedValue === 'number'
    ) {
      totalDebtNumber = td.parsedValue;
    }

    return {
      totalDebt: totalDebtNumber,
      currentPage: backend.currentPage,
      pageSize: backend.pageSize,
      totalElements: backend.totalElements,
      totalPages: backend.totalPages,
      debtObjects,
    };
  }
  public async getCashObjects(
    token: string | undefined,
    branchId: string,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<CashObjectsResponse['data']> {
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/transactions/cash/objects/${branchId}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
        },
      }),
      token,
    });

    // Some endpoints use { message, data: { cashObjects, total, ... } }
    // Others might return { currentPage, pageSize, totalElements, totalPages, results, staticData }
    const envelope = response?.data ?? {};
    const backend = envelope?.data ?? envelope;

    const rawItems = backend?.cashObjects ?? backend?.results ?? [];

    const cashObjects = (Array.isArray(rawItems) ? rawItems : []).map(
      (item: any) => {
        const amt = item?.amount;
        let amountNumber = 0;
        if (typeof amt === 'number') amountNumber = amt;
        else if (typeof amt === 'string') {
          const maybe = parseFloat(amt);
          amountNumber = isNaN(maybe) ? 0 : maybe;
        } else if (
          amt &&
          typeof amt === 'object' &&
          typeof amt.parsedValue === 'number'
        ) {
          amountNumber = amt.parsedValue;
        }

        return {
          id: item.id,
          date: item.date,
          product: item.product,
          amount: amountNumber,
          adds: Boolean(item.adds),
          type: item.type,
        };
      }
    );

    const tc = backend?.total ?? backend?.staticData?.totalCash;
    let totalCashNumber = 0;
    if (typeof tc === 'number') totalCashNumber = tc;
    else if (typeof tc === 'string') {
      const maybe = parseFloat(tc);
      totalCashNumber = isNaN(maybe) ? 0 : maybe;
    } else if (
      tc &&
      typeof tc === 'object' &&
      typeof tc.parsedValue === 'number'
    ) {
      totalCashNumber = tc.parsedValue;
    }

    const currentPage = Number(
      backend?.currentPage ?? queryParameters?.page ?? 1
    );
    const pageSize = Number(
      backend?.pageSize ?? queryParameters?.pageSize ?? 10
    );
    const totalElements = Number(backend?.totalElements ?? cashObjects.length);
    const totalPages = Number(
      backend?.totalPages ??
        Math.max(1, Math.ceil(totalElements / (pageSize || 10)))
    );

    return {
      totalCash: totalCashNumber,
      currentPage,
      pageSize,
      totalElements,
      totalPages,
      cashObjects,
    };
  }

  /**
   * Obtiene los abonos de clientes regulares
   * @param token - Token de autenticación
   * @param queryParameters - Parámetros de paginación
   * @returns Datos de abonos de clientes regulares con paginación
   */
  public async getClientBonus(
    token: string | undefined,
    queryParameters: GetAllServiceQueryParametersType = {},
    type?: 'regular' | 'aliado',
    branchId?: string,
    clientId?: string
  ): Promise<ClientBonusData> {
    const response = await this.service.get<ClientBonusResponse>({
      endpoint: createUrl({
        url: `/transactions/client/bonus/${branchId}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          ...(type ? { type } : {}),
          ...(queryParameters?.search
            ? { search: queryParameters.search }
            : {}),
          ...(clientId ? { client: clientId } : {}),
        },
      }),
      token,
    });
    return {
      ...response.data,
    };
  }

  /**
   * Tabla de todos los clientes con saldo de abono != 0 (ordenable por
   * cualquier columna) + KPIs globales (depositado/usado/saldo neto,
   * siempre de toda la empresa, sin importar el filtro de sucursal). No
   * está acotada por búsqueda -- es la tabla completa, opcionalmente
   * filtrada a una sucursal (la de la última orden de cada cliente).
   */
  public async getClientBalanceSummary(
    token: string | undefined,
    queryParameters: GetAllServiceQueryParametersType = {},
    direction: 'asc' | 'desc' = 'desc',
    ordering: ClientBalanceOrdering = 'balance',
    branchId?: string
  ): Promise<ClientBalanceSummaryData> {
    const response = await this.service.get<ClientBalanceSummaryResponse>({
      endpoint: createUrl({
        url: '/transactions/client/balance-summary',
        parameters: {
          pageSize: queryParameters?.pageSize ?? '20',
          page: queryParameters?.page ?? '1',
          direction,
          ordering,
          ...(branchId ? { branch: branchId } : {}),
        },
      }),
      token,
    });
    return {
      ...response.data,
    };
  }

  public async uploadInventoryPurchase(
    token: string,
    file: File,
    branchId: number
  ) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const response = await this.service.post<any>({
      endpoint: `/transactions/inventory/purchase/${branchId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });
    return response;
  }

  // Obtener el valor del inventario por sucursal
  public async getInventoryValue(token: string | undefined) {
    const response = await this.service.get<GetInventoryValueResponse>({
      endpoint: '/transactions/inventoryvalue',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }
  /**
   * Obtiene las transacciones de compra o venta de un producto
   * @param token - Token de autenticación
   * @param productId - ID del producto
   * @param type - Tipo de transacción a consultar: 'purchase' | 'sale'
   * @param queryParameters - Paginación y filtros (start_date, end_date, branch)
   * @returns Json response con las transacciones del producto
   */
  public async getProductTransactions(
    token: string | undefined,
    productId: number | string,
    type: 'purchase' | 'sale',
    queryParameters: ProductTransactionsParams = {}
  ): Promise<ProductTransactionsResponse> {
    const parameters: Record<string, string> = {
      type,
      pageSize: queryParameters?.pageSize ?? '10',
      page: queryParameters?.page ?? '1',
    };

    // Filtros opcionales
    if (queryParameters?.start_date) {
      parameters.start_date = queryParameters.start_date;
    }
    if (queryParameters?.end_date) {
      parameters.end_date = queryParameters.end_date;
    }
    if (queryParameters?.branch) {
      parameters.branch = queryParameters.branch;
    }

    const response = await this.service.get<ProductTransactionsResponse>({
      endpoint: createUrl({
        url: `/transactions/product/${productId}`,
        parameters,
      }),
      token,
    });
    return response;
  }

  /**
   * Obtiene el resumen de un producto de compra o venta por año
   * @param token - Token de autenticación
   * @param productId - ID del producto
   * @param type - Tipo de transacción a resumir: 'purchase' | 'sale'
   * @param year - Año a resumir (extraído del filtro de fechas)
   * @returns Json response con el resumen del producto
   */
  public async getProductSummary(
    token: string | undefined,
    productId: number | string,
    type: 'purchase' | 'sale',
    year: string
  ): Promise<ProductSummaryResponse> {
    const response = await this.service.get<ProductSummaryResponse>({
      endpoint: createUrl({
        url: `/transactions/product/summary/${productId}`,
        parameters: { type, year },
      }),
      token,
    });
    return response;
  }

  /**
   * Obtiene la utilidad de un producto (totales y desglose por sucursal)
   * @param token - Token de autenticación
   * @param productId - ID del producto
   * @param dateRange - Rango de fechas opcional (start_date, end_date)
   * @returns Resumen de utilidad del producto y su desglose por sucursal
   */
  public async getProductUtility(
    token: string | undefined,
    productId: number | string,
    dateRange: { start_date?: string; end_date?: string } = {}
  ): Promise<ProductUtilityResponse> {
    const parameters: Record<string, string> = {};
    if (dateRange.start_date) parameters.start_date = dateRange.start_date;
    if (dateRange.end_date) parameters.end_date = dateRange.end_date;

    const response = await this.service.get<ProductUtilityResponse>({
      endpoint: createUrl({
        url: `/transactions/product/utility/${productId}`,
        parameters,
      }),
      token,
    });
    return response;
  }

  /**
   * Obtiene el costo de inventario de un producto en una sucursal
   * @param token - Token de autenticación
   * @param productId - ID del producto
   * @param branchId - ID de la sucursal
   * @returns Json response con el costo de inventario del producto en la sucursal
   */
  public async getProductInventoryCost(
    token: string | undefined,
    productId: number | string,
    branchId: number | string
  ): Promise<ProductInventoryCostResponse> {
    const response = await this.service.get<ProductInventoryCostResponse>({
      endpoint: createUrl({
        url: `/transactions/product/inventory-cost/${productId}`,
        parameters: { branch: `${branchId}` },
      }),
      token,
    });
    return response;
  }

  /**
   * Obtiene datos de utilidad (POST con filtros)
   * @param token - Token de autenticación
   * @param branchId - ID de la sucursal
   * @param payload - Payload con search, view, start_date, end_date
   * @returns Datos de utilidad
   */
  async getUtilityData(
    token: string | undefined,
    branchId: string,
    payload: UtilityPayload
  ): Promise<UtilityApiResponse | null> {
    try {
      const response = await this.service.post<UtilityApiResponse>({
        endpoint: `/transactions/utility/${branchId}`,
        data: payload,
        token,
      });
      return response;
    } catch (error) {
      console.error('Error al obtener datos de utilidad:', error);
      return null;
    }
  }

  /**
   * Reporte "Utilidad por Categoría" (Super Admin). POST con filtros de fecha,
   * sucursales y categorías; ver ARCHITECTURE.md (CategoryUtilityReportView).
   */
  async getCategoryUtilityReport(
    token: string | undefined,
    payload: CategoryUtilityReportPayload
  ): Promise<CategoryUtilityReportResponse> {
    const response = await this.service.post<CategoryUtilityReportResponse>({
      endpoint: `/transactions/utility-by-category`,
      data: payload,
      token,
    });
    return response;
  }
}
