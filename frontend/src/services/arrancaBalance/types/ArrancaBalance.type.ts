import { Pagination } from '@/models/pagination.model';
import { BranchItem } from '@/services/branches/types/Branch.type';

/**
 * Estado de revisión de un movimiento (espejo de
 * `ARRANCA_BALANCE_STATUS_CHOICES` en `transactions/models.py`). Todo
 * movimiento nace `pending` en los dos sistemas; lo aprueba o rechaza el
 * sistema que **no** lo creó, y esa decisión es definitiva.
 */
export const ARRANCA_BALANCE_STATUSES = [
  'pending',
  'approved',
  'declined',
] as const;

export type ArrancaBalanceStatus = (typeof ARRANCA_BALANCE_STATUSES)[number];

/** Las dos decisiones posibles sobre un movimiento pendiente. */
export type ArrancaBalanceDecision = Exclude<ArrancaBalanceStatus, 'pending'>;

/**
 * Hacia dónde fue el **valor**: dinero, o mercancía que vale dinero.
 * `mc_to_arranca` cubre tanto "MC le pagó a Arranca" como "MC le entregó una
 * moto" (la plata de esa moto viaja después, como deuda). `amount` siempre es
 * positivo: el sentido lo da este campo, no el signo. Mismo valor y mismo
 * significado en Arranca.
 */
export const ARRANCA_BALANCE_DIRECTIONS = [
  'mc_to_arranca',
  'arranca_to_mc',
] as const;

export type ArrancaBalanceDirection =
  (typeof ARRANCA_BALANCE_DIRECTIONS)[number];

/**
 * Qué generó el movimiento (espejo de `ARRANCA_BALANCE_KIND_CHOICES`). Lo fija
 * el sistema que lo crea y nunca se edita: lo cargado desde la UI siempre es
 * `manual`, por eso no está en el formulario.
 */
export const ARRANCA_BALANCE_KINDS = [
  'manual',
  'cash_close',
  'bike_sale',
  'bike_return',
] as const;

export type ArrancaBalanceKind = (typeof ARRANCA_BALANCE_KINDS)[number];

/** Sistema que creó el movimiento: decide quién lo edita y quién lo aprueba. */
export type ArrancaBalanceOrigin = 'moto_candela' | 'arranca';

/** `responsible` viene recortado por el backend, igual que en GPS. */
export interface ArrancaBalanceResponsible {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  branch?: BranchItem | null;
}

export interface ArrancaBalance {
  id: number;
  /** Id compartido con el gemelo del movimiento en Arranca. */
  syncId: string;
  origin: ArrancaBalanceOrigin;
  amount: number;
  concept: string;
  direction: ArrancaBalanceDirection;
  status: ArrancaBalanceStatus;
  /** Sucursal MC. `null` solo en movimientos anteriores a la sincronización. */
  branch: { id: number; name: string } | null;
  createdAt: string;
  lastModified: string;
  /**
   * Quien tocó el movimiento por última vez en MC. Si fue desde Arranca es el
   * usuario de integración, y el nombre real viene en `externalResponsible`.
   */
  responsible: ArrancaBalanceResponsible | null;
  externalResponsible: string;
  observations: string;
  /**
   * Id de la transacción que generó el movimiento, cuando lo creó el sistema
   * (una moto enviada a Arranca, o la cancelación de esa venta). `null` en los
   * movimientos cargados a mano. Los generados **no se editan**: el monto sale
   * de la venta, y lo que los revierte es cancelar la venta.
   */
  transaction: number | null;
  kind: ArrancaBalanceKind;
  /**
   * De qué se trata: el día cerrado (`yyyy-mm-dd`) en un cierre de caja, el
   * serial de chasis (o la placa) en una moto, vacío en uno manual.
   */
  reference: string;
  /** Cuándo se aprobó o rechazó; `null` mientras está pendiente. */
  decidedAt: string | null;
}

/** Envoltorio estándar de la API (`{ message, data }`). */
export interface ArrancaBalanceEnvelope<T> {
  message: string;
  data: T;
}

/** Cantidad por estado bajo los demás filtros; alimenta los contadores de las pestañas. */
export type ArrancaBalanceStatusCounts = Record<
  ArrancaBalanceStatus | 'all',
  number
>;

export interface ArrancaBalancePage extends Pagination<ArrancaBalance> {
  staticData?: { statusCounts: ArrancaBalanceStatusCounts };
}

export interface GetArrancaBalancesQueryParams {
  page?: number;
  pageSize?: number;
  status?: ArrancaBalanceStatus;
  direction?: ArrancaBalanceDirection;
  kind?: ArrancaBalanceKind;
  /** Busca solo en el concepto. */
  search?: string;
  /** `yyyy-mm-dd`, inclusivo, sobre `createdAt`. */
  startDate?: string;
  /** `yyyy-mm-dd`, inclusivo, sobre `createdAt`. */
  endDate?: string;
}

/**
 * Campos que se crean y editan. **Ni `status` ni `responsible` están a
 * propósito:** un movimiento nace pendiente, el estado cambia solo con una
 * decisión, y el responsable lo fija el backend.
 */
export interface ArrancaBalancePayload {
  amount: number;
  concept: string;
  direction: ArrancaBalanceDirection;
  /** Id de sucursal MC. */
  branch: number;
  observations: string;
}
