import { format } from 'date-fns';

import {
  ArrancaBalance,
  ArrancaBalanceDirection,
  ArrancaBalanceKind,
  ArrancaBalanceOrigin,
  ArrancaBalanceStatus,
} from '@/services/arrancaBalance/types';

export const ARRANCA_BALANCE_STATUS_LABELS: Record<
  ArrancaBalanceStatus,
  string
> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  declined: 'Rechazado',
};

/** Etiquetas en plural para las pestañas. */
export const ARRANCA_BALANCE_STATUS_TAB_LABELS: Record<
  ArrancaBalanceStatus,
  string
> = {
  pending: 'Pendientes',
  approved: 'Aprobados',
  declined: 'Rechazados',
};

export const ARRANCA_BALANCE_STATUS_CLASSES: Record<
  ArrancaBalanceStatus,
  string
> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  declined: 'bg-red-50 text-red-700 ring-red-200',
};

export const ARRANCA_BALANCE_STATUS_DOT_CLASSES: Record<
  ArrancaBalanceStatus,
  string
> = {
  pending: 'bg-amber-500',
  approved: 'bg-emerald-500',
  declined: 'bg-red-500',
};

export const ARRANCA_BALANCE_DIRECTION_LABELS: Record<
  ArrancaBalanceDirection,
  string
> = {
  mc_to_arranca: 'Moto Candela → Arranca',
  arranca_to_mc: 'Arranca → Moto Candela',
};

export const ARRANCA_BALANCE_KIND_LABELS: Record<ArrancaBalanceKind, string> = {
  manual: 'Manual',
  cash_close: 'Cierre de caja',
  bike_sale: 'Venta de moto',
  bike_return: 'Devolución de moto',
};

export const ARRANCA_BALANCE_ORIGIN_LABELS: Record<
  ArrancaBalanceOrigin,
  string
> = {
  moto_candela: 'Moto Candela',
  arranca: 'Arranca',
};

/**
 * Moto Candela edita solo lo que creó, solo mientras está pendiente, y nunca
 * un movimiento generado por una venta (su monto sale de la transacción; lo
 * que lo revierte es cancelar la venta). El backend aplica las mismas reglas
 * (409); esto evita ofrecer el botón.
 */
export function canEditArrancaBalance(balance: ArrancaBalance): boolean {
  return (
    balance.origin === 'moto_candela' &&
    balance.status === 'pending' &&
    balance.transaction === null
  );
}

/** Movimiento creado por el sistema a partir de una venta, no cargado a mano. */
export function isLedgerArrancaBalance(balance: ArrancaBalance): boolean {
  return balance.transaction !== null;
}

/**
 * Moto Candela aprueba o rechaza solo lo que creó Arranca, mientras está
 * pendiente. Lo que creó Moto Candela lo decide Arranca.
 */
export function canDecideArrancaBalance(balance: ArrancaBalance): boolean {
  return balance.origin === 'arranca' && balance.status === 'pending';
}

/**
 * Quién tocó el movimiento por última vez. Si fue desde Arranca, el
 * responsable es el usuario de integración y el nombre real viene aparte.
 */
export function getArrancaBalanceResponsibleName(
  balance: ArrancaBalance
): string {
  if (balance.externalResponsible) {
    return `${balance.externalResponsible} (Arranca)`;
  }
  const responsible = balance.responsible;
  if (!responsible) return '';
  const fullName = [responsible.firstName, responsible.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return fullName || responsible.username;
}

/** Fecha y hora locales: dos movimientos del mismo día se distinguen por la hora. */
export function formatArrancaBalanceDateTime(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'dd/MM/yyyy HH:mm');
}
