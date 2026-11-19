export interface LoginBackendResponse {
  message: string;
  data: {
    token: string;
  };
}
