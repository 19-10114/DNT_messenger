export interface CreateProductError {
  message: string;
  errors: Errors;
}

export interface Errors {
  [key: string]: string[];
}
