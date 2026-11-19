export interface ProductTransactionBranch {
  id: number;
  name: string;
  type: string;
  location: string | null;
  contact: string | null;
  url: string | null;
  billingAddress: string | null;
}

export interface ProductTransactionUser {
  id: number;
  email: string;
  documentId: string;
  username: string;
  firstName: string;
  lastName: string;
  branch: ProductTransactionBranch | null;
  role: string | null;
  isSuperuser: boolean;
  isStaff: boolean;
  isActive: boolean;
  phoneNumber: string;
  type: string;
}

export interface ProductTransactionProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  type: string | null;
  isFeatured: boolean;
  cost: number;
  price: number | null;
  createdAt: string;
  lastUpdated: string;
  ekAvailable: boolean;
  packageQuantity: number;
  mfb: boolean;
}

export interface ProductTransactionItem {
  id: number;
  product: ProductTransactionProduct;
  originBranch: ProductTransactionBranch | null;
  targetBranch: ProductTransactionBranch | null;
  user: ProductTransactionUser | null;
  responsible: ProductTransactionUser | null;
  orderNumber: number | null;
  orderId: string;
  plate: string;
  color: string;
  serialNumber: string;
  inNumber: string;
  outNumber: string;
  year: string;
  invoiceNumber: string;
  receptionDate: string;
  createdAt: string;
  amount: number;
  tax: number | null;
  quantity: number;
  type: 'purchase' | 'sale';
  notes: string;
  reserved: boolean;
  mfb: boolean;
  invoiceOrigin: string | null;
  motorSerial: string | null;
  deposit: unknown;
  case: string;
}

export interface ProductTransactionBranchTotal {
  branchId: number;
  branchName: string;
  totalQuantity: number;
  totalAmount: number | null;
}

export interface ProductTransactionsStaticData {
  perBranchTotals: ProductTransactionBranchTotal[];
}

export interface ProductTransactionsData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: ProductTransactionItem[];
  staticData?: ProductTransactionsStaticData;
}

export interface ProductTransactionsResponse {
  message: string;
  data: ProductTransactionsData;
}

export interface ProductTransactionsParams {
  page?: string;
  pageSize?: string;
  start_date?: string;
  end_date?: string;
  branch?: string;
}
