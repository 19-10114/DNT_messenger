import { TargetStatus } from '@/services/salesTargets/types';

/** Cantidad y USD cobrado de un servicio del taller. */
export interface WorkshopCount {
  count: number;
  usd: number;
}

export interface WorkshopDay {
  day: string;
  activations: number;
  gpsInstalls: number;
  oilChanges: number;
  labor: number;
}

export interface TransferSide {
  lines: number;
  units: number;
  usd: number;
}

export interface ManagerDashboardBikes {
  received: number;
  sold: number;
  soldUsd: number;
  openPreorders: number;
  openPreorderUnits: number;
}

export interface ManagerDashboardParts {
  totalRevenue: number;
  totalUtility: number;
  units: number;
  byCategory: {
    categoryId: number | null;
    name: string;
    revenue: number;
    utility: number;
    units: number;
  }[];
  topProducts: {
    productId: number;
    name: string;
    units: number;
    revenue: number;
  }[];
}

export interface ManagerDashboardWorkshop {
  activations: WorkshopCount;
  gpsInstalls: WorkshopCount;
  oilChanges: WorkshopCount;
  labor: WorkshopCount;
  byDay: WorkshopDay[];
}

export interface ManagerDashboardTransfers {
  sent: TransferSide;
  received: TransferSide;
}

export interface ManagerDashboardUsedBikes {
  evaluations: number;
  inReview: number;
  approved: number;
  rejected: number;
  purchased: number;
  purchasedUsd: number;
  sold: number;
  soldUsd: number;
}

export interface ManagerDashboardArranca {
  requests: number;
  requestedUnits: number;
  deliveredUnits: number;
  openRequests: number;
  openRemainingUnits: number;
}

export interface ManagerDashboardPending {
  gpsTransfers: number;
  gpsWaiting: number;
  cashCloses: { count: number; usd: number };
}

export interface ManagerDashboardTargets {
  month: string;
  monthLabel: string;
  targetUnits: number;
  soldUnits: number;
  targetToDate: number | null;
  compliancePct: number | null;
  progressPct: number | null;
  status: TargetStatus | null;
  projectedUnits: number | null;
  branches:
    | {
        branchId: number;
        name: string;
        targetUnits: number;
        soldUnits: number;
        compliancePct: number | null;
        status: TargetStatus | null;
      }[]
    | null;
}

export interface ManagerDashboardPayroll {
  totalUsd: number;
  byAccount: { code: string; name: string; usd: number }[];
}

export interface ManagerDashboardQuotas {
  pendingUnits: number;
  byModel: { productId: number; model: string; remaining: number }[];
}

/**
 * `GET /dashboard/manager/<branchId>`: todos los bloques del Inicio de
 * gerencia. Un bloque llega en `null` cuando falló en el servidor (y su
 * error va en `warnings`) o, en `targets`, cuando no hay meta este mes.
 */
export interface ManagerDashboard {
  range: { start: string; finish: string };
  branch: { id: number; name: string } | null;
  generatedAt: string;
  cached: boolean;
  bikes: ManagerDashboardBikes | null;
  parts: ManagerDashboardParts | null;
  workshop: ManagerDashboardWorkshop | null;
  transfers: ManagerDashboardTransfers | null;
  usedBikes: ManagerDashboardUsedBikes | null;
  arranca: ManagerDashboardArranca | null;
  pending: ManagerDashboardPending | null;
  targets: ManagerDashboardTargets | null;
  payroll: ManagerDashboardPayroll | null;
  quotas: ManagerDashboardQuotas | null;
  warnings: string[];
}

export interface ManagerDashboardQuery {
  branchId: number;
  start: string;
  finish: string;
}
