// "Utilidad por Categoría" Super Admin dashboard — see ARCHITECTURE.md
// (CategoryUtilityReportView, POST /transactions/utility-by-category).

import { PaymentMethodTotal } from '@/services/transactions/types/PartsReport.type';

// Servicios (5) only ever contributes Mano de obra / Cambio de aceite — see
// MANO_DE_OBRA_PRODUCT_ID/CAMBIO_DE_ACEITE_PRODUCT_ID in the backend's
// constants.py. Every other servicios product is excluded server-side
// regardless of this filter.
export const UTILITY_REPORT_CATEGORIES = [1, 2, 6, 5] as const;
export type UtilityReportCategoryId =
  (typeof UTILITY_REPORT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<UtilityReportCategoryId, string> = {
  1: 'Motos',
  2: 'Repuestos',
  6: 'Agropecuarios',
  5: 'Servicios',
};

export interface CategoryUtilityReportPayload {
  startDate?: string;
  endDate?: string;
  branches?: number[];
  categories?: number[];
}

export interface UtilitySummary {
  revenue: number;
  cogs: number;
  utility: number;
  unitsSold: number;
}

export interface UtilityByBranch extends UtilitySummary {
  branchId: number;
  branchName: string;
}

export interface UtilityByCategory extends UtilitySummary {
  categoryId: number;
  categoryName: string;
}

export interface UtilityByProduct extends UtilitySummary {
  productId: number;
  sku: string;
  name: string;
  brand: string | null;
  model: string | null;
  categoryId: number;
  /** Current on-hand stock, company-wide (all branches) — not scoped by the
   * sucursales filter. Bikes are summed across their per-color quantities. */
  availableQuantity: number;
}

export interface UtilityByMonth extends UtilitySummary {
  month: string; // 'YYYY-MM'
}

export interface CategoryUtilityTrend {
  startDate: string;
  endDate: string;
  byMonth: UtilityByMonth[];
}

export interface CategoryUtilityReportData {
  summary: UtilitySummary;
  byBranch: UtilityByBranch[];
  topProducts: UtilityByProduct[];
  byCategory: UtilityByCategory[];
  trend: CategoryUtilityTrend;
  paymentMethodTotals: PaymentMethodTotal[];
}

export interface CategoryUtilityReportResponse {
  message: string;
  data: CategoryUtilityReportData;
}
