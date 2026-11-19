import { usdFormatCurrency } from '@/lib/utils';

/** Cantidades con separador de miles; los repuestos pueden traer decimales. */
export const formatUnits = (units: number) =>
  Number(units).toLocaleString('en-US', { maximumFractionDigits: 3 });

/** Valor monetario; `null` (sin permiso) se muestra como guion. */
export const formatValue = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : usdFormatCurrency(value);

/** El backend agrupa los productos sin modelo bajo `''`. */
export const modelLabel = (model: string | null | undefined) =>
  model && model.trim() ? model : 'Sin modelo';

/** Suma de una columna monetaria que puede venir en `null`. */
export const sumValues = (rows: { value: number | null }[]) =>
  rows.reduce((total, row) => total + (row.value ?? 0), 0);
