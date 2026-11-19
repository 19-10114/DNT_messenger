import { LoginFormData } from '@/schemas/login.schema';
import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import {
  CurrentUserBackendSuccessfullyResponse,
  CurrentUserBackendErrorResponse,
} from '../users/types/currentUserBackendResponse.types';
import { LoginBackendResponse } from './types/loginBackendResponse.type';
import { UserModel } from '@/models/user.model';
import { UsersResponse } from '@/models/users';
import { Pagination } from '@/models/pagination.model';
import { GetAllServiceQueryParametersType } from '../products/types';
import { createUrl } from '@/utils/createUrl.utils';

export class AuthService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async getCurrentUser(token: string): Promise<UserModel | undefined> {
    const currentUser = await this.service.get<
      CurrentUserBackendSuccessfullyResponse | CurrentUserBackendErrorResponse
    >({
      endpoint: '/users/self',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    if ('detail' in currentUser) {
      return undefined;
    }
    localStorage.setItem('TOKEN', token);
    return {
      ...currentUser.data,
      token,
    };
  }

  public async getUserById(
    id: string,
    token: string
  ): Promise<UserModel | undefined> {
    const currentUser = await this.service.get<
      CurrentUserBackendSuccessfullyResponse | CurrentUserBackendErrorResponse
    >({
      endpoint: `/users/${id}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    if ('detail' in currentUser) {
      return undefined;
    }

    return {
      ...currentUser.data,
      token,
    };
  }

  public async getAllUserBySearch(
    token: string | undefined,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<UserModel>> {
    const params: Record<string, string> = {
      pageSize: queryParameters?.pageSize ?? '10',
      page: queryParameters?.page ?? '1',
      search: queryParameters?.search ?? '',
    };
    if (queryParameters?.branch) params.branch = queryParameters.branch;
    if (queryParameters?.role) params.role = queryParameters.role;

    const response = await this.service.get<UsersResponse>({
      endpoint: createUrl({
        url: '/users/search',
        parameters: params,
      }),
      token,
    });
    return {
      ...response.data,
    };
  }

  public async getUsers(
    token: string | undefined,
    queryParameters: GetAllServiceQueryParametersType = {}
  ): Promise<Pagination<UserModel>> {
    const params: Record<string, string> = {
      pageSize: queryParameters?.pageSize ?? '10',
      page: queryParameters?.page ?? '1',
    };
    if (queryParameters?.branch) params.branch = queryParameters.branch;
    if (queryParameters?.role) params.role = queryParameters.role;
    if (queryParameters?.search) params.search = queryParameters.search;

    const response = await this.service.get<UsersResponse>({
      endpoint: createUrl({
        url: '/users/all',
        parameters: params,
      }),
      token,
    });
    return {
      ...response.data,
    };
  }

  public async login(formData: LoginFormData): Promise<UserModel | undefined> {
    if (!localStorage) return;
    const {
      data: { token },
    } = await this.service.post<LoginBackendResponse>({
      endpoint: '/authentication/login',
      data: {
        ...formData,
      },
    });

    const currentUser = await this.getCurrentUser(token);

    if (!currentUser) {
      throw new Error(
        'Debes iniciar sesión antes de poder utilizar esta aplicación.'
      );
    }

    return currentUser;
  }

  public async logout(token: string) {
    await this.service.post<void>({
      endpoint: '/authentication/logout',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
  }
}
