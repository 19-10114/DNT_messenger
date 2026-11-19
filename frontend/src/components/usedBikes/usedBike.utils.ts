import {
  UsedBikeStatus,
  UsedBikeUser,
} from '@/services/products/types/UsedBike.type';

/** Nombre completo de un usuario anidado */
export function fullName(user: UsedBikeUser | null | undefined): string {
  if (!user) return '-';
  const name = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim();
  return name || user.username || '-';
}

/** `askedPrice`, `cost` y `price` son nullable */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Rango de justiprecio, ya listo para graficar */
export interface OfferRange {
  min: number;
  max: number;
}

/**
 * Justiprecio en el formato que persiste el backend: `min-max`.
 *
 * Devuelve `undefined` cuando el rango no es representable —caso 2 con las
 * reparaciones por encima del valor de la unidad—: un extremo negativo dejaría
 * dos guiones seguidos y el valor no se podría volver a leer.
 */
export function formatOfferRange(
  strategy: { minPrice: number; maxPrice: number } | null | undefined
): string | undefined {
  if (!strategy) return undefined;
  if (strategy.minPrice < 0 || strategy.maxPrice < 0) return undefined;
  return `${strategy.minPrice.toFixed(2)}-${strategy.maxPrice.toFixed(2)}`;
}

/** Lee un justiprecio guardado; `null` si no tiene la forma `min-max` */
export function parseOfferRange(
  value: string | null | undefined
): OfferRange | null {
  if (!value) return null;

  const match = value.trim().match(/^(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?)$/);
  if (!match) return null;

  return { min: Number(match[1]), max: Number(match[2]) };
}

export function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function statusVariant(status: UsedBikeStatus) {
  if (status === 'approved' || status === 'sold') return 'default' as const;
  if (status === 'in_review') return 'secondary' as const;
  if (status === 'rejected' || status === 'cancelled') {
    return 'destructive' as const;
  }
  return 'outline' as const;
}

/**
 * Margen de reventa que deja el precio de compra acordado, medido contra el
 * valor neto de la **estrategia A** (por condición): `100 * (1 - cost/netBase)`.
 *
 * Devuelve `null` cuando todavía no hay con qué calcularlo —sin precio
 * ofrecido, o sin haber corrido la calculadora— y también con un `netBase` no
 * positivo, donde la división no significa nada.
 */
export function profitMargin(
  cost: number | null | undefined,
  netBase: number | null | undefined
): number | null {
  if (cost === null || cost === undefined) return null;
  if (netBase === null || netBase === undefined || netBase <= 0) return null;

  const margin = 100 * (1 - cost / netBase);
  return Number.isFinite(margin) ? margin : null;
}

/**
 * El margen tal como lo espera el endpoint de aprobación: con dos decimales,
 * la misma precisión que se muestra en el modal (`18.18%` viaja como `18.18`).
 * Fuera de `[0, 100)` se omite y el backend aplica el suyo.
 */
export function approvalMargin(margin: number | null): number | undefined {
  if (margin === null) return undefined;
  const rounded = Math.round(margin * 100) / 100;
  return rounded >= 0 && rounded < 100 ? rounded : undefined;
}
