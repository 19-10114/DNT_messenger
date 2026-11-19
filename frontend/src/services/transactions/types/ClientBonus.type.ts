export type ClientBalanceOrdering =
  | 'client_name'
  | 'balance'
  | 'orders_count'
  | 'total_spent'
  | 'last_order_date'
  | 'last_order_branch';

export interface ClientBonusItem {
  id: number;
  date: string;
  amount: number;
  type: string; // 'order' | 'transaction'
  adds: boolean;
}

export interface ClientBonusClient {
  id: number;
  firstName: string;
  lastName: string;
  countryId: string;
  phoneNumber: string;
  email: string;
  address: string;
  city: string;
  inFavor: number;
  createdAt: string;
  type: string; // 'regular' | 'aliado'
}

export interface ClientBonusResult {
  client: ClientBonusClient;
  totalBonusSold: number;
  totalBonusUsed: number;
  total: number;
  items: ClientBonusItem[];
}

export interface ClientBonusData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: ClientBonusResult[];
  staticData: {
    total: number;
  };
}

export interface ClientBonusResponse {
  message: string;
  data: ClientBonusData;
}

export interface ClientBalanceSummaryResult {
  client: ClientBonusClient;
  balance: number;
  ordersCount: number;
  totalSpent: number;
  lastOrderDate: string | null;
  lastOrderBranch: { id: number; name: string } | null;
}

export interface ClientBalanceSummaryData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: ClientBalanceSummaryResult[];
  staticData: {
    totalDeposited: number;
    totalUsed: number;
    netBalance: number;
  };
}

export interface ClientBalanceSummaryResponse {
  message: string;
  data: ClientBalanceSummaryData;
}
