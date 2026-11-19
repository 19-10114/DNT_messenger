import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import {
  GetUsersResponse,
  GetSellersReportResponse,
} from './types/usersBackendResponse.types';

export class UsersService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getUsers(
    token: string,
    role: string,
    branchId?: string,
    queryParameters: {
      page?: string;
      pageSize?: string;
      search?: string;
    } = {}
  ): Promise<GetUsersResponse> {
    try {
      const params: Record<string, string> = {
        role,
        page: queryParameters.page ?? '1',
        pageSize: queryParameters.pageSize ?? '10',
      };

      if (queryParameters.search) params.search = queryParameters.search;

      const response = await this.service.get<{ data: GetUsersResponse }>({
        endpoint: createUrl({
          url: `/users/role/${branchId}`,
          parameters: params,
        }),
        token,
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  public async getSellersReport(
    token: string,
    branchId: string,
    queryParameters: {
      seller?: string;
      category?: string;
      start?: string;
      finish?: string;
      page?: string;
      page_size?: string;
    } = {}
  ): Promise<GetSellersReportResponse> {
    try {
      const params: Record<string, string> = {
        page: queryParameters.page ?? '1',
        page_size: queryParameters.page_size ?? '10',
      };

      if (queryParameters.seller) params.seller = queryParameters.seller;
      if (queryParameters.category) params.category = queryParameters.category;
      if (queryParameters.start) params.start = queryParameters.start;
      if (queryParameters.finish) params.finish = queryParameters.finish;

      const response = await this.service.get<GetSellersReportResponse>({
        endpoint: createUrl({
          url: `/orders/sellers/sales-report/${branchId}`,
          parameters: params,
        }),
        token,
      });
      return response;
    } catch (error) {
      console.error('Error fetching sellers report:', error);
      throw error;
    }
  }

  public async getRoles(
    token: string
  ): Promise<{ message: string; data: [string, number][] }> {
    try {
      const response = await this.service.get<{
        message: string;
        data: [string, number][];
      }>({
        endpoint: createUrl({
          url: '/users/roles',
        }),
        token,
      });
      return response;
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
}
