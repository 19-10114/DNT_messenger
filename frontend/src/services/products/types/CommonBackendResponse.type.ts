export interface ProductBackendResponse {
  id: number;
  category: number;
  description: string;
  name: string;
  stock: number;
  leasePrice: number;
  initialFee: number;
  cashPrice: number;
  brand: string;
  internalId: string;
  extra: object;
}
