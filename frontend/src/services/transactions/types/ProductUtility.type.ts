export interface ProductUtilitySummary {
  revenue: number;
  cogs: number;
  utility: number;
  unitsSold: number;
  unitsPurchased: number;
  unitsMatched: number;
  unmatchedUnits: number;
}

export interface ProductUtilityBranch {
  branchId: number;
  branchName: string;
  revenue: number;
  cogs: number;
  utility: number;
  unitsSold: number;
}

export interface ProductUtilityData {
  summary: ProductUtilitySummary;
  perBranch: ProductUtilityBranch[];
}

export interface ProductUtilityResponse {
  message: string;
  data: ProductUtilityData;
}
