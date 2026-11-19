import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import {
  ClientData,
  GetClientBackendResponse,
  CreateClientPayload,
  CreateClientBackendResponse,
} from './types/Client.type';
import {
  GetAllClientsResponse,
  GetClientOrdersResponse,
  GetClientPreOrdersResponse,
  GetClientProductsResponse,
  GetClientProductDetailResponse,
} from './types/ClientHistory.type';

export class ClientService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Buscar cliente por cédula de identidad
   * @param countryId - Cédula de identidad del cliente
   * @param token - Token de autenticación
   * @returns Información del cliente
   */
  public async getClientByCountryId(
    countryId: string,
    token: string
  ): Promise<ClientData | undefined> {
    const response = await this.service.get<GetClientBackendResponse>({
      endpoint: `/users/client/${countryId}`,
      token,
    });
    const clientArray = response.data;
    if (Array.isArray(clientArray) && clientArray.length > 0) {
      return clientArray[0];
    }
    return undefined;
  }

  /**
   * Crear un nuevo cliente
   * @param payload - Datos del cliente a crear
   * @param token - Token de autenticación
   * @returns ID del cliente creado
   */
  public async createClient(
    payload: CreateClientPayload,
    token: string
  ): Promise<{ id: number }> {
    const response = await this.service.post<CreateClientBackendResponse>({
      endpoint: '/users/client/1', // El 1 es placeholder según la documentación
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: payload,
    });

    return response.data;
  }

  /**
   * Actualizar un cliente existente (PATCH)
   * @param countryId - Cédula de identidad del cliente
   * @param payload - Datos parciales del cliente a actualizar
   * @param token - Token de autenticación
   * @returns Respuesta del servidor
   */
  public async updateClient(
    countryId: string,
    payload: Partial<CreateClientPayload>,
    token: string
  ): Promise<{ id: number }> {
    const response = await this.service.patch<CreateClientBackendResponse>({
      endpoint: `/users/client/${countryId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: payload,
    });

    return response.data;
  }

  public async getoriginsClient(
    token: string
  ): Promise<{ message: string; data: string[][] }> {
    const response = await this.service.get<{
      message: string;
      data: string[][];
    }>({
      endpoint: '/users/client/origins',
      token,
    });
    console.log('Response from getoriginsClient:', response);
    return response;
  }

  /**
   * Lista de clientes, paginada y buscable por nombre o cédula.
   */
  public async getAllClients(
    token: string,
    queryParameters: {
      search?: string;
      role?: string;
      page?: string;
      pageSize?: string;
    } = {}
  ): Promise<GetAllClientsResponse> {
    const response = await this.service.get<GetAllClientsResponse>({
      endpoint: createUrl({
        url: '/users/client/all',
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
          ...(queryParameters.search ? { search: queryParameters.search } : {}),
          ...(queryParameters.role ? { role: queryParameters.role } : {}),
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Órdenes completadas (facturadas) de un cliente, con el total gastado
   * (sobre el resultado completo, no solo la página actual) en staticData.
   */
  public async getClientOrders(
    token: string,
    clientId: number | string,
    queryParameters: { page?: string; pageSize?: string } = {}
  ): Promise<GetClientOrdersResponse> {
    const response = await this.service.get<GetClientOrdersResponse>({
      endpoint: createUrl({
        url: `/orders/client/${clientId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Pre órdenes (no facturadas) de un cliente.
   */
  public async getClientPreOrders(
    token: string,
    clientId: number | string,
    queryParameters: { page?: string; pageSize?: string } = {}
  ): Promise<GetClientPreOrdersResponse> {
    const response = await this.service.get<GetClientPreOrdersResponse>({
      endpoint: createUrl({
        url: `/orders/client/pre-orders/${clientId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Productos comprados por un cliente (agregado por producto).
   */
  public async getClientProducts(
    token: string,
    clientId: number | string,
    queryParameters: { page?: string; pageSize?: string } = {}
  ): Promise<GetClientProductsResponse> {
    const response = await this.service.get<GetClientProductsResponse>({
      endpoint: createUrl({
        url: `/users/client/products-sold/${clientId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
        },
      }),
      token,
    });
    return response;
  }

  /**
   * Detalle: cada transacción individual de un producto comprado por un
   * cliente (drill-down desde getClientProducts).
   */
  public async getClientProductDetail(
    token: string,
    clientId: number | string,
    productId: number | string,
    queryParameters: { page?: string; pageSize?: string } = {}
  ): Promise<GetClientProductDetailResponse> {
    const response = await this.service.get<GetClientProductDetailResponse>({
      endpoint: createUrl({
        url: `/users/client/products-sold/${clientId}/${productId}`,
        parameters: {
          page: queryParameters.page ?? '1',
          pageSize: queryParameters.pageSize ?? '10',
        },
      }),
      token,
    });
    return response;
  }
}
