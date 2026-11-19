import { UserModel } from '@/models/user.model';

export interface CurrentUserBackendSuccessfullyResponse {
  message: string;
  data: UserModel;
}

export interface CurrentUserBackendErrorResponse {
  detail: string;
}
