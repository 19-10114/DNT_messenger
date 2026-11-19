export interface CashObjectItem {
  id: number;
  date: string;
  product: string;
  amount: number;
  adds: boolean;
  type: string;
}

export interface CashObjectsData {
  totalCash: number;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  cashObjects: CashObjectItem[];
}

export interface CashObjectsResponse {
  message: string;
  data: CashObjectsData;
}
