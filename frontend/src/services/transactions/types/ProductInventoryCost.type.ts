export interface ProductInventoryCostLayer {
  unitCost: number;
  quantity: number;
  totalValue: number;
}

export interface ProductInventoryCostData {
  totalQuantity: number;
  totalValue: number;
  layers: ProductInventoryCostLayer[];
}

export interface ProductInventoryCostResponse {
  message: string;
  data: ProductInventoryCostData;
}
