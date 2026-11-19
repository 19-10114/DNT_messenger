export interface ColorQuantity {
  color: string;
  colorHex: string;
  quantity: number;
}

export interface BikeModel {
  id: number;
  model: string;
  brand: string;
  colors: ColorQuantity[];
  totalQuantity: number;
}

export interface BranchBikeInventory {
  branchId: number;
  branchName: string;
  models: BikeModel[];
  branchTotal: number;
}

export interface AdminBikeInventoryResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: BranchBikeInventory[];
  };
}
