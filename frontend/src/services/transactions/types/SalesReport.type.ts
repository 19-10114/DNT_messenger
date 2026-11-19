export type SalesReportCategory = 'bikes' | 'mfb' | 'parts';

export interface MonetaryValue {
  source: string;
  parsedValue: number;
}

export interface SalesReportColorDetail {
  quantity: MonetaryValue;
  dpQuantity: MonetaryValue;
  hex: string;
}

export interface SalesReportItemDetail {
  id: number;
  type: 'order' | 'transaction';
  branchId: number;
  branchName: string;
}

export interface SalesReportResultItem {
  id: number;
  sku: string;
  name: string;
  category: number;
  quantity: MonetaryValue;
  dpQuantity: MonetaryValue;
  totalUsd: MonetaryValue;
  usd: MonetaryValue;
  bs: MonetaryValue;
  colors?: { [key: string]: SalesReportColorDetail };
  items: SalesReportItemDetail[];
}

export interface SalesReportTotals {
  totalUsd: MonetaryValue;
  usd: MonetaryValue;
  bs: MonetaryValue;
  totalQuantity?: number;
  totalAmount?: number;
}

export interface SalesReportBackendResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: SalesReportResultItem[];
    staticData: {
      totals: SalesReportTotals;
    };
  };
}

export interface SalesReportQueryParams {
  start: string;
  finish: string;
  category: SalesReportCategory;
  dp: boolean;
  page?: string;
  pageSize?: string;
}

export interface UtilityProduct {
  productId: number;
  productName: string;
  productModel: string;
  boughtAmount: number;
  boughtQuantity: number;
  soldAmount: number;
  soldQuantity: number;
  beginningInventory: number;
  endingInventory: number;
  utility: number;
}

export interface UtilityBranchData {
  branchId: number;
  branchName: string;
  products: UtilityProduct[];
}

export interface UtilityApiResponse {
  message: string;
  data: UtilityBranchData[];
}

export interface UtilityPayload {
  search: 'bikes' | 'parts';
  view: 'global' | 'branch';
  start_date: string;
  end_date: string;
}

export interface UtilityDataItem {
  branchName: string;
  products: {
    [productName: string]: {
      soldQuantity: number;
      utility: number;
      productId: number;
      productModel: string;
    };
  };
}

export type SearchType = 'bikes' | 'parts';
export type ViewModeType = 'global' | 'branch';
