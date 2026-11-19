import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import {
  GetSuppliersQueryParams,
  Supplier,
  SupplierPayload,
  SuppliersPage,
} from './types/Supplier.type';

interface BackendResponse<T> {
  message: string;
  data: T;
}

/** Proveedores (`/api/suppliers/`). Leer: cualquiera; escribir: administración. */
export class SuppliersService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getSuppliers(
    token: string | undefined,
    params: GetSuppliersQueryParams = {}
  ): Promise<SuppliersPage> {
    const parameters = Object.fromEntries(
      Object.entries({ page: '1', pageSize: '10', ...params }).filter(
        ([, value]) => value !== undefined && value !== ''
      )
    ) as Record<string, string>;
    const response = await this.service.get<BackendResponse<SuppliersPage>>({
      endpoint: createUrl({ url: '/suppliers/', parameters }),
      token,
    });
    return response.data;
  }

  public async createSupplier(
    token: string | undefined,
    payload: SupplierPayload
  ): Promise<Supplier> {
    const response = await this.service.post<BackendResponse<Supplier>>({
      endpoint: '/suppliers/',
      data: payload,
      token,
    });
    return response.data;
  }

  public async updateSupplier(
    token: string | undefined,
    id: number,
    payload: SupplierPayload
  ): Promise<Supplier> {
    const response = await this.service.patch<BackendResponse<Supplier>>({
      endpoint: `/suppliers/${id}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /** Activar o desactivar. Un inactivo sale del selector; sus gastos lo conservan. */
  public async setSupplierActive(
    token: string | undefined,
    id: number,
    active: boolean
  ): Promise<Supplier> {
    const response = await this.service.post<BackendResponse<Supplier>>({
      endpoint: `/suppliers/${id}/${active ? 'activate' : 'deactivate'}`,
      token,
    });
    return response.data;
  }
}
