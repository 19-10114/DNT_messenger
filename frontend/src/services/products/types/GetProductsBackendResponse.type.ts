import type { ProductBackendResponse } from './CommonBackendResponse.type';

export interface GetProductsBackendResponseType {
  message: string;
  data: BackendPagination;
}

export interface BackendPagination {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: ProductBackendResponse[];
}

export interface GetAllServiceQueryParametersType {
  page?: string;
  pageSize?: string;
  search?: string;
  origin?: string;
  branch?: string;
  role?: string;
  /** `'true'` deja solo motos usadas; se omite la clave para no filtrar */
  used?: string;
  /** `'true'` pide sólo motos con GPS (destino Arranca); se omite la clave para no filtrar */
  needGps?: string;
  /**
   * `'true'` en el inventario general de todas las sucursales: incluye las
   * sucursales y modelos que sólo tienen motos por recibir de Empire (en 0).
   */
  pending?: string;
}
export interface ProductsAndCategoriesResponse {
  message: string;
  data: ProductsAndCategoriesData;
}

export interface ProductsAndCategoriesData {
  motos: { [key: string]: number }[];
  Consolas: { [key: string]: number }[];
  Celulares: { [key: string]: number }[];
  Sonido: { [key: string]: number }[];
  juguetes: { [key: string]: number }[];
  'TV - AUDIO': { [key: string]: number }[];
  ELECTRODOMÉSTICOS: { [key: string]: number }[];
  reparacion: { [key: string]: number }[];
  iniciales: { [key: string]: number }[];
}

export interface TopPartItem {
  id: number;
  sku: string;
  name: string;
  totalQuantity: number;
}

export interface TopPartsData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: TopPartItem[];
}

export interface TopPartsBackendResponse {
  message: string;
  data: TopPartsData;
}

export interface TopPartsQueryParams {
  start: string;
  finish: string;
  page?: string;
  pageSize?: string;
}
