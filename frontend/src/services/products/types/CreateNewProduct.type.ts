export interface CreateNewProductData {
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: string;
}

export interface Results {
  result: Result;
}

export interface Result {
  MODELO: string;
  INICIAL: number;
  CUOTAS: number;
  CUOTA_SEMANAL: number;
  MONTO_CUOTAS: number;
  MONTO_FINANCIAR: number;
  UTILIDAD: number;
  INTERESES: number;
}

export interface CreateNewProductSuccessfullyResponse {
  message: string;
  data: string;
}

export interface CreateNewCalcSuccessfullyResponse {
  result: Result;
}

export interface CreateNewProductErrorResponse {
  message: string;
  errors: {
    [key: string]: string[];
  };
}

export interface ExchangeRateResponse {
  message: string;
  data: ExchangeRateData;
}

export interface ExchangeRateData {
  date: Date;
  exchangeRate: number;
}
