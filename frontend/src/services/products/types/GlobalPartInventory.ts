export interface GlobalPartInventoryBranch {
  branchId: number;
  branchName: string;
  quantity: number;
  cost: number;
}

export interface GlobalPartInventoryItem {
  productId: number;
  sku: string;
  name: string;
  model: string;
  branches: GlobalPartInventoryBranch[];
}

export interface GlobalPartInventoryResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: GlobalPartInventoryItem[];
  };
}
