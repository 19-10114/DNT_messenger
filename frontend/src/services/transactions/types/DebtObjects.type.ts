export interface DebtObjectItem {
  id: number;
  date: string; // ISO string
  product: string;
  amount: number;
  adds: boolean; // true si suma a la deuda, false si resta
  type: string; // e.g., "transaction"
}

export interface DebtObjectsData {
  totalDebt: number;
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  debtObjects: DebtObjectItem[];
}

export interface DebtObjectsResponse {
  message: string;
  data: DebtObjectsData;
}
