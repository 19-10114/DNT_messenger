import { Pagination } from '@/models/pagination.model';
import {
  ArrancaBalance,
  ArrancaBalanceDirection,
  ArrancaBalanceKind,
  ArrancaBalanceStatus,
} from '@/services/arrancaBalance/types';
import { GpsStatus } from '@/services/gps/types';

/**
 * Reporte "Arranca - MC": todo lo que Moto Candela comparte con Arranca —el
 * balance, las motos que MC le entrega y los GPS que Arranca envía— en una
 * sola pantalla. Ver §3.12e del ARCHITECTURE.md del backend.
 *
 * **Signo.** Todo va desde el punto de vista de Moto Candela, y positivo
 * significa *a favor de Moto Candela*: `mc_to_arranca` suma y
 * `arranca_to_mc` resta. Arranca arma el mismo reporte con los signos al
 * revés, así que para el mismo rango y sucursal los dos `net` son iguales y
 * opuestos.
 *
 * **Sólo lo aprobado mueve el balance.** Lo pendiente se muestra al lado
 * (`pending`, `projectedNet`), nunca dentro; lo rechazado no cuenta.
 */

export type ReportPerspective = 'arranca' | 'moto_candela';

export interface CountAmount {
  count: number;
  amount: number;
}

export interface ArrancaMcBalanceBlock {
  /** Balance aprobado hasta `endDate`, con signo. */
  net: number;
  /** Balance aprobado antes de `startDate`. */
  opening: number;
  /** Aprobado en el rango a favor de Moto Candela (MC → Arranca). */
  sent: number;
  /** Aprobado en el rango a favor de Arranca (Arranca → MC). */
  received: number;
  periodNet: number;
  /** `net + pending.net`: dónde quedaría si se aprobara todo lo pendiente. */
  projectedNet: number;
  pending: {
    count: number;
    net: number;
    sent: number;
    received: number;
    /** Lo creó Arranca: lo decide Moto Candela. */
    awaitingUs: CountAmount;
    /** Lo creó Moto Candela: lo decide Arranca. */
    awaitingPartner: CountAmount;
    oldestCreatedAt: string | null;
  };
  declined: CountAmount;
  statusCounts: Record<ArrancaBalanceStatus | 'all', number>;
  decisions: { count: number; averageHours: number | null };
  lastMovementAt: string | null;
}

export interface ArrancaMcKindRow {
  kind: ArrancaBalanceKind;
  count: number;
  sent: number;
  received: number;
  net: number;
  pendingCount: number;
  pendingAmount: number;
  /** Lo pendiente con signo: lo que movería el balance si se aprobara. */
  pendingNet: number;
}

export interface ArrancaMcBranchRow {
  /** `null` solo en movimientos anteriores a la sincronización. */
  branch: number | null;
  branchName: string;
  net: number;
  periodNet: number;
  pendingCount: number;
  pendingNet: number;
}

export interface ArrancaMcSeriesPoint {
  date: string;
  sent: number;
  received: number;
  net: number;
  runningBalance: number;
}

export interface ArrancaMcCashCloseBranch {
  branch: number | null;
  branchName: string;
  count: number;
  total: number;
  lastBusinessDate: string | null;
  lastAmount: number;
  lastStatus: ArrancaBalanceStatus;
  lastClosedAt: string;
}

export interface ArrancaMcCashCloses {
  count: number;
  total: number;
  average: number;
  approvedTotal: number;
  pendingTotal: number;
  pendingCount: number;
  declinedCount: number;
  byBranch: ArrancaMcCashCloseBranch[];
}

export interface ArrancaMcBikeMoney {
  count: number;
  approvedAmount: number;
  pendingAmount: number;
}

export interface ArrancaMcBikes {
  sales: ArrancaMcBikeMoney;
  returns: ArrancaMcBikeMoney;
  netCount: number;
  /** Las motos que MC le entregó a Arranca, de toda la empresa. */
  units: {
    total: number;
    inRange: number;
    /**
     * `null` en Moto Candela: para MC toda moto entregada está vendida a
     * Arranca, y no ve si Arranca ya la colocó con un cliente.
     */
    available: number | null;
    street: number | null;
    withGps: number;
    byModel: { product: string; count: number }[];
    /** Sucursal de MC que la vendió. */
    byBranch: { branch: string; count: number }[];
  };
  monthly: {
    month: string;
    salesCount: number;
    salesAmount: number;
    returnsCount: number;
    returnsAmount: number;
    units: number;
  }[];
}

export interface ArrancaMcGpsAging {
  id: number;
  imei: string;
  number: string;
  status: GpsStatus;
  branch: number | null;
  branchName: string;
  /** Cuándo llegó a Moto Candela. */
  sentAt: string | null;
  days: number;
}

export interface ArrancaMcGps {
  total: number;
  byStatus: Record<GpsStatus, number>;
  /** Los GPS que vinieron de Arranca y siguen en Moto Candela. */
  withPartner: {
    total: number;
    byStatus: Record<GpsStatus, number>;
    byBranch: {
      branch: number | null;
      branchName: string;
      label: string;
      count: number;
      installed: number;
    }[];
  };
  stale: { days: number; count: number };
  aging: ArrancaMcGpsAging[];
  weekly: { weekStart: string; sent: number; returned: number }[];
}

/** `GET /transactions/arranca-mc-report/summary/<branchId>`. */
export interface ArrancaMcSummary {
  perspective: ReportPerspective;
  mcBranch: number;
  startDate: string;
  endDate: string;
  generatedAt: string;
  balance: ArrancaMcBalanceBlock;
  byKind: ArrancaMcKindRow[];
  byBranch: ArrancaMcBranchRow[];
  series: ArrancaMcSeriesPoint[];
  cashCloses: ArrancaMcCashCloses;
  bikes: ArrancaMcBikes;
  gps: ArrancaMcGps;
}

/** Una fila del feed: el movimiento más su efecto sobre el balance. */
export interface ArrancaMcFeedRow extends ArrancaBalance {
  /**
   * La moto de un movimiento de venta o devolución, como se lee:
   * "placa - modelo". `null` en otros tipos o si la moto no se encuentra; ahí
   * se muestra `reference` (el chasis), que sigue siendo el vínculo entre los
   * dos sistemas.
   */
  bikeLabel: string | null;
  /** `amount` con signo: positivo a favor de Moto Candela. */
  signedAmount: number;
  /** Balance justo después de este movimiento; `null` si no está aprobado. */
  runningBalance: number | null;
  /** Arranca lo llena desde su tabla de cierres; en MC siempre es `null`. */
  cashClose: null;
}

export type ArrancaMcFeedPage = Pagination<ArrancaMcFeedRow>;

export interface ArrancaMcSummaryQuery {
  /** Sucursal de Moto Candela; `0` = todas. */
  branchId: number;
  /** `yyyy-mm-dd`, inclusivo, en días de Caracas. Sin fechas: el mes en curso. */
  startDate?: string;
  endDate?: string;
}

export interface ArrancaMcFeedQuery extends ArrancaMcSummaryQuery {
  page?: number;
  pageSize?: number;
  kind?: ArrancaBalanceKind;
  status?: ArrancaBalanceStatus;
  direction?: ArrancaBalanceDirection;
  /** Concepto, referencia y observaciones. */
  search?: string;
}
