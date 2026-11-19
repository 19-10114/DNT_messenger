// "Procura de Repuestos" — see ARCHITECTURE.md (ProcurementAnalysisView,
// GET /purchases/procurement-analysis/<branchId>).

export type ProcurementTier = 'urgente' | 'pronto' | 'ok';
export type AbcClass = 'A' | 'B' | 'C';
export type XyzClass = 'X' | 'Y' | 'Z';

export interface ProcurementWindow {
  startDate: string;
  endDate: string;
  lookbackDays: number;
  leadTimeDays: number;
}

export interface ProcurementRow {
  productId: number;
  sku: string;
  name: string;
  model: string;
  stockActual: number;
  /** Company-wide, shown next to stockActual — see ARCHITECTURE.md. */
  stockGlobal: number;
  unitsSold: number;
  inStockDays: number;
  /** Fecha de la última venta en esta sucursal (o pool de sucursales), sin
   * límite de ventana -- a diferencia de unitsSold, no está acotada a los
   * últimos lookbackDays. `null` = nunca se vendió acá. */
  lastSaleDate: string | null;
  demandaDiariaPropia: number;
  /** Company-wide average (not stockout-corrected), shown next to
   * demandaDiariaPropia — see ARCHITECTURE.md. */
  demandaDiariaGlobal: number;
  /** Rotation class used for the reorder-point math — company-wide, from
   * ProductRotation. */
  abc: AbcClass;
  xyz: XyzClass;
  /** Same repuesto's class computed from THIS branch's own sales only —
   * display-only, can disagree sharply with abc/xyz (e.g. AX globally, CZ
   * in every branch — a lubricant whose local revenue never outranks bike
   * sales). Never replaces the global one. */
  abcLocal: AbcClass;
  xyzLocal: XyzClass;
  reorderPoint: number;
  diasCobertura: number | null;
  /** ceil(reorderPoint - stockActual), 0 floor — "si pidiera hoy, cuánto". */
  suggestedQty: number;
  unitCost: number;
  estimatedCost: number;
  /** 'ok' = no action needed; still returned (not filtered out) so the
   * catalog can be browsed/filtered/sorted as one table. */
  tier: ProcurementTier;
}

export interface ProcurementAbcKpi {
  total: number;
  stockout: number;
}

export type ProcurementKpis = Record<AbcClass, ProcurementAbcKpi>;

export interface ProcurementAnalysisData {
  window: ProcurementWindow;
  rows: ProcurementRow[];
  kpis: ProcurementKpis;
}

export interface ProcurementAnalysisResponse {
  message: string;
  data: ProcurementAnalysisData;
}

// "Ver detalle" — per-branch breakdown of one product. See ARCHITECTURE.md
// (ProcurementProductBranchesView, GET /purchases/procurement-analysis/product/<productId>).
export interface ProductBranchRow {
  branchId: number;
  branchName: string;
  stockActual: number;
  unitsSold: number;
  /** Plain average (units sold / window days), NOT stockout-corrected —
   * this is a secondary detail view, see ARCHITECTURE.md. */
  demandaDiaria: number;
  diasCobertura: number | null;
  /** No 'vigilar' here — the fleet-demand boost isn't computed per
   * (product, branch). See ARCHITECTURE.md. */
  tier: 'urgente' | 'pronto' | 'ok';
}

export interface ProductBranchBreakdownData {
  windowDays: number;
  rows: ProductBranchRow[];
}

export interface ProductBranchBreakdownResponse {
  message: string;
  data: ProductBranchBreakdownData;
}
