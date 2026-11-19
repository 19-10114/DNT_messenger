export interface FinancialProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  createdAt: string;
}

export interface FinancialProductsResponse {
  message: string;
  data: FinancialProduct[];
}
