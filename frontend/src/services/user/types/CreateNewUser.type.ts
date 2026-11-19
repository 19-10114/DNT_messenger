export interface CreateNewUserData {
  username: string;
  email: string;
  documentId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  branch: string;
  role: string;
}

export interface CreateNewUserSuccessfullyResponse {
  message: string;
  data: string;
}

export interface CreateNewUserErrorResponse {
  message: string;
  errors: {
    [key: string]: string[];
  };
}
