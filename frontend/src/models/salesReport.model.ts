export interface SalesReportDateRange {
  startDate?: string;
  endDate?: string;
}

export interface SalesReportSummary {
  totalSales: number; // ventas totales (sumatoria en USD)
  totalBs: number;
  totalUsd: number;
  receivedUsd: number;
  receivedBs: number;
  motosQuantity: number;
  motosAmount: number;
  mfbQuantity: number; // motores fuera de borda
  mfbAmount: number;
  repuestosQuantity: number;
  repuestosAmount: number;
}

export interface VehicleReportRow {
  id: string | number;
  modelo: string;
  cantidad: number;
  dpCantidad: number;
  usd: number;
  bs: number;
  receivedUsd: number;
  receivedBs: number;
  variants: any[];
  items: any[];
}

export interface SpareReportRow {
  id: string | number;
  producto: string;
  cantidad: number;
  dpCantidad: number;
  usd: number;
  bs: number;
  receivedUsd: number;
  receivedBs: number;
  items: any[];
}
