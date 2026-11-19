// services/users/types/usersBackendResponse.types.ts
export interface UserItem {
  id: number;
  email: string;
  documentId: string;
  username: string;
  groups: any[];
  customer: any | null;
  branch: {
    id: number;
    name: string;
    type: string;
    location: any | null;
    contact: any | null;
    url: any | null;
    billingAddress: any | null;
  } | null;
  lastLogin: string | null;
  isSuperuser: boolean;
  firstName: string;
  lastName: string;
  isStaff: boolean;
  isActive: boolean;
  dateJoined: string;
  phoneNumber: string;
  type: string;
  role: string;
  billing: boolean;
  forgotPasswordToken: any | null;
  userPermissions: any[];
}

export interface GetUsersResponse {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: UserItem[];
}

export interface SellerBranch {
  id: number;
  name: string;
  type: string;
  location: string | null;
  contact: string | null;
  url: string | null;
  billingAddress: string | null;
}

export interface SellerInfo {
  id: number;
  firstName: string;
  lastName: string;
  documentId: string;
  role: string;
  branch: SellerBranch;
}

export interface SellerTotals {
  totalUsd: number;
  totalBs: number;
  totalSoldUsd: number;
  totalQuantity: number;
}

export interface ProductSold {
  productId: number;
  name: string;
  quantity: number;
  total: number;
}

export interface PaymentMethodTotal {
  type: string;
  total: number;
}

export interface SellerReportItem {
  seller: SellerInfo;
  totals: SellerTotals;
  productsSold: ProductSold[];
  paymentMethodTotals: PaymentMethodTotal[];
}

export interface GetSellersReportResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: SellerReportItem[];
    staticData: {
      paymentMethodTotals: PaymentMethodTotal[];
    };
  };
}
