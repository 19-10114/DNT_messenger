import { format } from 'date-fns';

import {
  BikeRequestActor,
  BikeRequestMoney,
  BikeRequestStatus,
  BikeRequestStatusCounts,
  BikeRequestSystem,
} from '@/services/bikeRequests/types';

export const BIKE_REQUEST_STATUS_LABELS: Record<BikeRequestStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

/** Etiquetas en plural para las pestañas. */
export const BIKE_REQUEST_STATUS_TAB_LABELS: Record<BikeRequestStatus, string> =
  {
    pending: 'Pendientes',
    in_progress: 'En progreso',
    completed: 'Completadas',
    cancelled: 'Canceladas',
  };

export const BIKE_REQUEST_STATUS_CLASSES: Record<BikeRequestStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 ring-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  cancelled: 'bg-gray-100 text-gray-600 ring-gray-200',
};

export const BIKE_REQUEST_STATUS_DOT_CLASSES: Record<
  BikeRequestStatus,
  string
> = {
  pending: 'bg-amber-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-gray-400',
};

/** Color de la barra de progreso, el mismo del estado. */
export const BIKE_REQUEST_PROGRESS_TONES: Record<
  BikeRequestStatus,
  'amber' | 'blue' | 'emerald' | 'gray'
> = {
  pending: 'amber',
  in_progress: 'blue',
  completed: 'emerald',
  cancelled: 'gray',
};

export const BIKE_REQUEST_SYSTEM_LABELS: Record<BikeRequestSystem, string> = {
  arranca: 'Arranca',
  moto_candela: 'Moto Candela',
};

/**
 * Los contadores llegan con las claves en camelCase (`inProgress`) aunque el
 * valor del estado sea `in_progress`.
 */
export function getBikeRequestStatusCount(
  counts: BikeRequestStatusCounts,
  status: BikeRequestStatus | 'all'
): number {
  if (status === 'in_progress') return counts.inProgress ?? 0;
  return counts[status] ?? 0;
}

/** Solo se despacha lo que sigue abierto. */
export function canDispatchBikeRequest(status: BikeRequestStatus): boolean {
  return status === 'pending' || status === 'in_progress';
}

/** "Luis Gómez (Arranca)". */
export function formatBikeRequestActor(
  actor: BikeRequestActor | null | undefined
): string {
  if (!actor) return '';
  const system = BIKE_REQUEST_SYSTEM_LABELS[actor.system] ?? actor.system;
  return `${actor.name || 'Sin nombre'} (${system})`;
}

/** Fecha y hora locales, como el resto de los módulos de Arranca. */
export function formatBikeRequestDateTime(
  value: string | null | undefined
): string {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : format(date, 'dd/MM/yyyy HH:mm');
}

/** Los decimales pueden llegar como string: se normalizan a número. */
export function toBikeRequestAmount(
  value: BikeRequestMoney | null | undefined
): number {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

/** "Keeway RKV 200" y, si aporta, la marca delante cuando el nombre no la trae. */
export function formatBikeRequestProduct(product: {
  name: string;
  brand?: string;
}): string {
  if (!product.brand) return product.name;
  return product.name.toLowerCase().includes(product.brand.toLowerCase())
    ? product.name
    : `${product.brand} ${product.name}`;
}

/** Mensaje del backend si lo hay; si no, el genérico. */
export function getBikeRequestErrorMessage(
  error: unknown,
  fallback: string
): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
}

/** Código HTTP de un error de axios, si lo hay. */
export function getBikeRequestErrorStatus(error: unknown): number | undefined {
  return (error as { response?: { status?: number } })?.response?.status;
}
