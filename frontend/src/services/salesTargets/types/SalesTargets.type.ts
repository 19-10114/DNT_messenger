/** Semáforo del cumplimiento: ≥100 % verde, 85–99 % amarillo, <85 % rojo. */
export type TargetStatus = 'green' | 'yellow' | 'red';

/** Qué proyección de cierre se muestra como principal. */
export type ProjectionKind = 'historical' | 'pace';

export interface SalesTargetBranchRef {
  id: number;
  name: string;
  code: string | null;
}

export interface SalesTargetProjectionEntry {
  units: number;
  pct: number | null;
}

export interface SalesTargetHistoricalProjection
  extends SalesTargetProjectionEntry {
  /** Parte del mes que la sede suele llevar vendida a esta altura (0–1). */
  shareToDate: number;
  monthsUsed: number;
}

export interface SalesTargetProjection {
  primary: ProjectionKind;
  pace: SalesTargetProjectionEntry | null;
  historical: SalesTargetHistoricalProjection | null;
}

export interface SalesTargetDay {
  /** YYYY-MM-DD */
  date: string;
  /** 1 = lunes … 7 = domingo */
  weekday: number;
  working: boolean;
  workingIndex: number | null;
  /** null cuando la sucursal no tiene meta ese mes. */
  dailyTarget: number | null;
  cumulativeTarget: number | null;
  /** Hasta la fecha de corte; null después. */
  sold: number | null;
  cumulativeSold: number | null;
  /** Después del corte; null antes. */
  projectedPace: number | null;
  projectedHistorical: number | null;
  reason: string | null;
}

export interface SalesTargetReport {
  /** null en la vista general. */
  branch: SalesTargetBranchRef | null;
  /** YYYY-MM */
  month: string;
  monthLabel: string;
  cutoff: string;
  target: { units: number; usd: number | null } | null;
  workingDays: { total: number; elapsed: number; remaining: number };
  sold: { units: number; usd: number };
  targetToDate: { units: number; usd: number | null } | null;
  compliancePct: number | null;
  usdCompliancePct: number | null;
  status: TargetStatus | null;
  progressPct: number | null;
  remainingUnits: number | null;
  requiredPace: number | null;
  currentPace: number | null;
  projection: SalesTargetProjection;
  historyMonthsUsed: number;
  days: SalesTargetDay[];
}

export interface SalesTargetRowProjection {
  primary: ProjectionKind;
  pace: number | null;
  historical: number | null;
}

export interface SalesTargetOverviewRow {
  branch: SalesTargetBranchRef;
  hasTarget: boolean;
  target: number | null;
  sold: number;
  soldUsd: number;
  targetToDate: number | null;
  compliancePct: number | null;
  status: TargetStatus | null;
  remainingUnits: number | null;
  requiredPace: number | null;
  currentPace: number | null;
  projection: SalesTargetRowProjection;
}

export interface SalesTargetOverview {
  month: string;
  monthLabel: string;
  cutoff: string;
  workingDays: { total: number; elapsed: number; remaining: number };
  totals: Omit<SalesTargetOverviewRow, 'branch' | 'hasTarget' | 'soldUsd'> & {
    targetUsd: number | null;
    soldUsd: number;
    progressPct: number | null;
    branchesWithTarget: number;
    branches: number;
  };
  rows: SalesTargetOverviewRow[];
}

export interface SalesTargetConfigRow {
  branch: SalesTargetBranchRef;
  targetUnits: number | null;
  targetUsd: number | null;
  suggestedUnits: number | null;
  workingDays: number;
}

export interface SalesTargetConfig {
  month: string;
  monthLabel: string;
  workingDays: number;
  rows: SalesTargetConfigRow[];
}

export interface SalesTargetConfigInput {
  branchId: number;
  /** null borra la meta de esa sucursal. */
  targetUnits: number | null;
  targetUsd?: number | null;
}

export interface NonWorkingDay {
  id: number;
  date: string;
  /** null = todas las sucursales */
  branch: number | null;
  branchName: string | null;
  reason: string;
}

export interface NonWorkingDayInput {
  date: string;
  branchId?: number | null;
  reason?: string;
}

export interface SalesTargetQuery {
  /** `0` = vista general. */
  branchId: number;
  month: string;
  /** Vacío = el corte por defecto del backend. */
  cutoff?: string;
}
