export interface DailyReportResultItem {
  orderId: number | string;
  invoiceNumber: string;
  inNumber?: string | number;
  outNumber?: string | number;
  product: string;
  color: string;
  originBranchId: number;
  originBranchName: string;
  cashUsd: number;
  nonCashUsd: number;
  cashBs: number;
  nonCashBs: number;
  totalUsd: number;
  totalBs: number;
  type?: string;
}

export interface DailyReportBaseTotals {
  totalCashUsd: number;
  totalNonCashUsd: number;
  totalCashBs: number;
  totalNonCashBs: number;
  grandTotalUsd: number;
  grandTotalBs: number;
}

export interface BikeSummary {
  [productName: string]: Record<string, number>;
}

export interface DailyReportData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: DailyReportResultItem[];
  staticData: {
    totals: DailyReportBaseTotals;
    notes?: string[];
    bikeSummary?: BikeSummary;
  };
}

export interface DailyReportBackendResponse {
  message: string;
  /**
   * Cuando no hay movimientos en la fecha consultada el backend responde 404
   * con `data: []`. El servicio normaliza ese caso a una respuesta resuelta,
   * así que aquí el arreglo vacío significa "sin datos", no un error.
   */
  data: DailyReportData | [];
}

export interface DailyReportOtherResultItem {
  /** Id de la orden (gasto legado) o del gasto (`source: 'expense'`). */
  id: number;
  totalUsd: number;
  totalBs: number;
  /** Solo en filas del Módulo de Gastos. */
  source?: 'expense';
  amountUsd?: number;
  concept?: string;
  category?: string;
  kind?: string;
  paymentMethod?: string;
}

export interface ValueWithSource {
  source: string;
  parsedValue: number;
}

export interface DailyReportOtherTotals {
  dp: ValueWithSource;
  spentBs: ValueWithSource;
  spentCashBs: ValueWithSource;
  spentUsd: ValueWithSource;
  spentCashUsd: ValueWithSource;
  abonoBs: ValueWithSource;
  abonoCashBs: ValueWithSource;
  abonoUsd: ValueWithSource;
  abonoCashUsd: ValueWithSource;
  totalCashUsd: ValueWithSource;
  totalUsd: ValueWithSource;
  totalCashBs: ValueWithSource;
  totalBs: ValueWithSource;
  /**
   * Salidas de efectivo del día (USD). No son gastos: no están en `spent*`
   * ni en las filas, pero ya vienen restadas de `totalCashUsd`.
   */
  withdrawnCashUsd?: ValueWithSource;
}

export interface DailyReportOthersData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: DailyReportOtherResultItem[];
  staticData: {
    totals: DailyReportOtherTotals;
    notes: string[];
  };
}

export interface DailyReportOthersBackendResponse {
  message: string;
  /** Ver la nota de `DailyReportBackendResponse.data`. */
  data: DailyReportOthersData | [];
}

export interface DailyReportQueryParams {
  date: string;
  page?: string;
  pageSize?: string;
}
