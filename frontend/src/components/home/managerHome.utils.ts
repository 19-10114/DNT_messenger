import { AxiosError } from 'axios';

const pad = (n: number) => String(n).padStart(2, '0');

/** `Date` local → `yyyy-mm-dd`, sin pasar por UTC. */
export const toDay = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/**
 * La semana en curso, de lunes a hoy: la misma que `FilterDate` aplica con
 * `initialPreset="7D"` (que no empieza antes del 1 de enero), para no pedir
 * primero sin fechas.
 */
export function currentWeek(today = new Date()): {
  start: string;
  finish: string;
} {
  const day = today.getDay(); // 0 dom .. 6 sáb
  const sinceMonday = day === 0 ? 6 : day - 1;
  let monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() - sinceMonday
  );
  const yearStart = new Date(today.getFullYear(), 0, 1);
  if (monday < yearStart) monday = yearStart;
  return { start: toDay(monday), finish: toDay(today) };
}

const intFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

/** `1234` → "1.234". */
export const formatCount = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : intFormatter.format(value);

/** `1234.5` → "$1,235": en el tablero no hacen falta los céntimos. */
export const formatUsd = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : usdFormatter.format(value);

/** `2026-10-13` → "13/10". */
export const formatDayShort = (day: string) =>
  `${day.slice(8, 10)}/${day.slice(5, 7)}`;

/** El mensaje del backend si lo hay; si no, uno genérico. */
export function dashboardErrorMessage(error: unknown) {
  const message = (error as AxiosError<{ message?: unknown }>)?.response?.data
    ?.message;
  return typeof message === 'string' && message
    ? message
    : 'No se pudo cargar el tablero.';
}

/** Colores de las series del taller. */
export const WORKSHOP_SERIES = [
  { key: 'activations', label: 'Activaciones', color: '#ec6200' },
  { key: 'gpsInstalls', label: 'GPS', color: '#2f64a8' },
  { key: 'oilChanges', label: 'Cambio de aceite', color: '#f6a46a' },
  { key: 'labor', label: 'Mano de obra', color: '#3f3f46' },
] as const;

export const CHART_TEXT = { color: '#6b7280', fontSize: 11 };
export const CHART_GRID_COLOR = '#e5e7eb';
