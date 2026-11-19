import { format, parseISO } from 'date-fns';

import {
  ApprovalStatus,
  ApprovalStatusCounts,
} from '@/services/approvals/types';

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En curso',
  completed: 'Completada',
  closed: 'Cerrada',
};

/** Etiquetas en plural para las pestañas. */
export const APPROVAL_STATUS_TAB_LABELS: Record<ApprovalStatus, string> = {
  pending: 'Pendientes',
  in_progress: 'En curso',
  completed: 'Completadas',
  closed: 'Cerradas',
};

export const APPROVAL_STATUS_CLASSES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export const APPROVAL_STATUS_DOT_CLASSES: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  closed: 'bg-gray-400',
};

export const APPROVAL_PROGRESS_TONES: Record<
  ApprovalStatus,
  'amber' | 'blue' | 'emerald' | 'gray'
> = {
  pending: 'amber',
  in_progress: 'blue',
  completed: 'emerald',
  closed: 'gray',
};

/** Roles que gestionan aprobaciones (mismo criterio que el backend). */
export const APPROVALS_ALLOWED_ROLES = ['admin', 'manager', 'administrator'];

/** Roles que pueden reabrir una aprobación cerrada. */
export const APPROVAL_REOPEN_ROLES = ['admin', 'administrator'];

/**
 * El número tal como lo guarda el backend: sin espacios y en mayúsculas.
 * "13 222 345" y "13222345 " son el mismo número.
 */
export function normalizeApprovalNumber(value: string | null | undefined) {
  return (value ?? '').replace(/\s+/g, '').toUpperCase();
}

export function getApprovalStatusCount(
  counts: ApprovalStatusCounts,
  tab: ApprovalStatus | 'all'
): number {
  if (tab === 'all') return counts.all;
  if (tab === 'in_progress') return counts.inProgress;
  return counts[tab];
}

/** `2026-09-01` → `01/09/2026`. */
export function formatApprovalDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd/MM/yyyy');
  } catch {
    return value;
  }
}

/** Fecha y hora local, como en el resto de los listados. */
export function formatApprovalDateTime(
  value: string | null | undefined
): string {
  if (!value) return '';
  try {
    return format(parseISO(value), 'dd/MM/yyyy HH:mm');
  } catch {
    return value;
  }
}

/** "Keeway RK 150", con la marca delante si el nombre no la trae. */
export function formatApprovalProduct(product: {
  name: string;
  brand?: string;
}): string {
  if (!product.brand) return product.name;
  return product.name.toLowerCase().includes(product.brand.toLowerCase())
    ? product.name
    : `${product.brand} ${product.name}`;
}

/** Mensaje del backend si lo hay; si no, el genérico. */
export function getApprovalErrorMessage(
  error: unknown,
  fallback: string
): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
}

export function getApprovalErrorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}
