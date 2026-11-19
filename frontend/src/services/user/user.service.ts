import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  CreateNewUserData,
  CreateNewUserErrorResponse,
  CreateNewUserSuccessfullyResponse,
} from './types/CreateNewUser.type';

export class UserService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  public async createUser(token: string, user: CreateNewUserData) {
    // deberia de haber una promesa (?)
    return this.service.post<
      CreateNewUserErrorResponse | CreateNewUserSuccessfullyResponse
    >({
      endpoint: '/users/all',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: {
        ...user,
      },
    });
  }

  public async modifyUser(
    token: string,
    userId: number,
    user: Partial<CreateNewUserData>
  ) {
    return this.service.patch<
      CreateNewUserErrorResponse | CreateNewUserSuccessfullyResponse
    >({
      endpoint: `/users/${userId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: {
        ...user,
      },
    });
  }
}
