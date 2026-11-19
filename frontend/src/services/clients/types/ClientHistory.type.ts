import { ClientData } from './Client.type';

export interface GetAllClientsResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ClientData[];
  };
}

export interface ClientOrderListItem {
  id: number;
  status: 'completed' | 'canceled' | 'incomplete';
  type: 'sale' | 'purchase' | 'payment' | 'wholesale';
  totalUsd: number;
  totalBs: number;
  totalInvoiceUsd: number;
  /** Real order value from its transaction lines (not the invoice fields) */
  computedTotal: number;
  billed: boolean;
  createdAt: string;
}

export interface GetClientOrdersResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ClientOrderListItem[];
    staticData: {
      totalSpent: number;
    };
  };
}

export interface GetClientPreOrdersResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ClientOrderListItem[];
    staticData: {
      activeCount: number;
      totalPending: number;
    };
  };
}

export interface ClientProductSummary {
  productId: number;
  productName: string;
  quantity: number;
}

export interface GetClientProductsResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ClientProductSummary[];
  };
}

export interface ClientProductTransaction {
  id: number;
  quantity: number;
  amount: number;
  /** Real sold value of the line: amount * quantity for parts, amount for everything else */
  lineValue: number;
  receptionDate: string;
  orderNumberId: number;
}

export interface GetClientProductDetailResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ClientProductTransaction[];
  };
}
