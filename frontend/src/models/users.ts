import { UserModel } from './user.model';
import { Pagination } from './pagination.model';
export interface UsersResponse {
  message: string;
  data: Pagination<UserModel>;
}
