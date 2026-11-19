export interface CurrentUserModelBackendResponse {
  id: number;
  email: string;
  countryUserId: string;
  username: string;
  groups: number[];
  customer: any;
  lastLogin: any;
  isSuperuser: boolean;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isActive: boolean;
  dateJoined: string;
  rif: any;
  phoneNumber: string;
  passportNumber: any;
  nationality: any;
  birthDate: any;
  forgotPasswordToken: any;
  userPermissions: any[];
  billing?: boolean;
}

export interface CurrentUserBackendResponse {
  message: string;
  data: CurrentUserModelBackendResponse;
}
