/**
 * Respuestas de los resúmenes de inventario (KPIs de las páginas de
 * inventario de motos y repuestos).
 *
 * `value` / `totalValue` vienen en `null` cuando el usuario no es super admin:
 * el valor es costo y solo lo ve ese rol. Las cantidades siempre vienen.
 */

export interface BikeModelSummary {
  id: number;
  model: string;
  brand: string;
  quantity: number;
  value: number | null;
}

export interface BikeBranchSummary {
  branchId: number;
  branchName: string;
  quantity: number;
  value: number | null;
}

export interface BikeInventorySummary {
  totalUnits: number;
  totalValue: number | null;
  models: BikeModelSummary[];
  /** Solo con la sede 0 (todas); vacío para una sede concreta. */
  branches: BikeBranchSummary[];
}

export interface BikeInventorySummaryResponse {
  message: string;
  data: BikeInventorySummary;
}

export interface PartSkuSummary {
  id: number;
  sku: string;
  name: string;
  /** Modelo de moto al que aplica; `''` cuando el producto no tiene. */
  model: string;
  units: number;
  value: number | null;
}

export interface PartModelSummary {
  /** `''` agrupa los repuestos sin modelo. */
  model: string;
  skuCount: number;
  units: number;
  value: number | null;
}

export interface PartInventorySummary {
  totalValue: number | null;
  /** Referencias distintas con stock mayor a 0. */
  skuCount: number;
  totalUnits: number;
  bySku: PartSkuSummary[];
  byModel: PartModelSummary[];
}

export interface PartInventorySummaryResponse {
  message: string;
  data: PartInventorySummary;
}
