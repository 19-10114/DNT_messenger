export interface ProductModel {
  id: number;
  internalId: string;
  name: string;
  category: number;
  description: string;
  stock: number;
  leasePrice: number;
  initialFee: number;
  cashPrice: number;
  brand: string;
  profileImage: string;
  extra: Object;
  leaseOptions: { [key: string]: LeaseInfo };
  images: string[];
  createdAt: string;
  isFeatured: boolean;
  sku: string;
  cost?: number;
  price?: number;
  model?: string;
}

export interface LeaseInfo {
  initialFee: number;
  weeklyFee: number;
  total: number;
}

export interface ProductsByCategory {
  [category: string]: ProductInfo[];
}

export interface ProductInfo {
  [productName: string]: number;
}

export interface BikeModel {
  id: number;
  plate: string;
  color: string;
  serialNumber: string;
  inNumber: string;
  year: string;
  receptionDate: Date;
  amount: number;
  product: BikeName;
  notes: string;
  orderId: string;
  prices: Prices;
}

export interface Prices {
  cost: number;
  epPrice: number;
  dpPrice: number;
  price: number;
  bulkPrice: number;
}

export interface BikeName {
  id: number;
  name: string;
  model: string;
  brand: string;
}
