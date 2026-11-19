export interface ProductSummaryBranch {
  branchId: number;
  branchName: string;
  totalQuantity: number;
  totalAmount: number;
}

export interface ProductSummaryMonth {
  /** Mes en número (1-12) */
  month: number;
  totalQuantity: number;
  totalAmount: number;
  branches: ProductSummaryBranch[];
}

export interface ProductSummaryYear {
  year: number;
  totalQuantity: number;
  totalAmount: number;
  months: ProductSummaryMonth[];
}

export interface ProductSummaryResponse {
  message: string;
  data: ProductSummaryYear[];
}
