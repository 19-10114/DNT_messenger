export interface BikeProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  createdAt: string;
  mfb: boolean;
}

export interface PaginatedBikeProducts {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: BikeProduct[];
}

export interface BikeProductsResponse {
  message: string;
  data: PaginatedBikeProducts;
}

export interface NoCostProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  isFeatured: boolean;
  cost: number | null;
  createdAt: string;
  lastUpdated: string;
  ekAvailable: boolean;
  packageQuantity: number;
  mfb: boolean;
}

export interface GetNoCostProductsResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: NoCostProduct[];
  };
}
