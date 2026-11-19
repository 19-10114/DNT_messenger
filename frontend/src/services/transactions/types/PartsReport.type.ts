export interface PartsReportProduct {
  id: number;
  sku: string;
  name: string;
  brand: string;
  model: string;
}

export interface PartsSoldReportItem {
  product: PartsReportProduct;
  quantitySold: number;
  revenue: number;
  cost: number;
  utility: number;
  currentInventory: number;
}

export interface PaymentMethodTotal {
  type: string;
  total: number;
  /**
   * Moneda del total, cuando el mismo medio puede venir en las dos (en gastos
   * una transferencia es USD o Bs). Sin ella, el grupo sale del tipo.
   */
  currency?: 'USD' | 'BS';
}

export interface GetPartsSoldReportResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: PartsSoldReportItem[];
    staticData: {
      totalRevenue: number;
      totalCost: number;
      totalUtility: number;
      paymentMethodTotals: PaymentMethodTotal[];
    };
  };
}

export interface PartSaleDetailItem {
  transactionId: number;
  date: string;
  branchId: number;
  branchName: string;
  quantity: number;
  salePrice: number;
  cost: number;
  utility: number;
  orderNumber: number | null;
}

export interface GetPartSaleDetailResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: PartSaleDetailItem[];
  };
}
