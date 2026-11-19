export interface OtherProductItem {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  isFeatured: boolean;
  cost: number | null | { source: string; parsedValue: number };
  createdAt: string;
  lastUpdated: string;
  ekAvailable: boolean;
  packageQuantity: number | null;
}

export interface OtherProductsResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: OtherProductItem[];
  };
}
