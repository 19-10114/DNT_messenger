import { usdFormatCurrency } from '@/lib/utils';

/**
 * Colores del reporte. ECharts pinta en un canvas y no lee clases de
 * Tailwind, así que los valores van escritos aquí.
 *
 * El color dice **a favor de quién** es una cifra, no si es buena o mala —por
 * eso no hay verde ni rojo—: **naranja (`secondary`) es a favor de Moto
 * Candela, azul a favor de Arranca**, gris lo que todavía no cuenta. Par
 * validado para daltonismo (ΔE ≥ 19 en protan/deutan/tritan).
 */
export const REPORT_COLORS = {
  motoCandela: '#ec6200',
  arranca: '#2f64a8',
  neutral: '#94a3b8',
  grid: '#e5e7eb',
  text: '#6b7280',
} as const;

/** Días de Caracas, que es como el backend lee `startDate` / `endDate`. */
const caracasDay = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Hoy en Caracas, `yyyy-mm-dd`. */
export const todayInCaracas = () => caracasDay.format(new Date());

/** El primer día del mes en curso, en Caracas. */
export const monthStartInCaracas = () => `${todayInCaracas().slice(0, 8)}01`;

const dateTimeFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'America/Caracas',
  dateStyle: 'short',
  timeStyle: 'short',
});

const shortDateFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'short',
});

const longDateFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const monthFormatter = new Intl.DateTimeFormat('es-VE', {
  timeZone: 'UTC',
  month: 'short',
  year: '2-digit',
});

export const formatDateTime = (value: string | null | undefined) =>
  value ? dateTimeFormatter.format(new Date(value)) : '';

/**
 * Un día `yyyy-mm-dd` tal cual, sin mover de zona: ya es un día de Caracas, y
 * `new Date('2026-09-01')` es medianoche UTC, que en Caracas sería el 31.
 */
export const formatDay = (value: string) =>
  shortDateFormatter.format(new Date(`${value}T00:00:00Z`));

export const formatLongDay = (value: string) =>
  longDateFormatter.format(new Date(`${value}T00:00:00Z`));

export const formatMonth = (value: string) => {
  const [year, month] = value.split('-');
  return monthFormatter.format(
    new Date(Date.UTC(Number(year), Number(month) - 1, 1))
  );
};

export const formatUsd = (value: number) => usdFormatCurrency(value);

/** Con signo explícito: `+$1,200.00` / `-$50.00`. */
export const formatSignedUsd = (value: number) =>
  value > 0 ? `+${usdFormatCurrency(value)}` : usdFormatCurrency(value);

/** A quién favorece una cifra con signo, en palabras. */
export const favourLabel = (value: number) => {
  if (value > 0) return 'A favor de Moto Candela';
  if (value < 0) return 'A favor de Arranca';
  return 'En cero';
};

/** Clase del texto de una cifra con signo: el mismo código de color que los gráficos. */
export const favourTextClass = (value: number) => {
  if (value > 0) return 'text-secondary';
  if (value < 0) return 'text-[#2f64a8]';
  return 'text-gray-500';
};

export const favourColor = (value: number) => {
  if (value > 0) return REPORT_COLORS.motoCandela;
  if (value < 0) return REPORT_COLORS.arranca;
  return REPORT_COLORS.neutral;
};

/** `1.5` → "1.5 h"; más de dos días, en días. */
export const formatHours = (hours: number | null) => {
  if (hours === null) return '—';
  if (hours >= 48) return `${(hours / 24).toFixed(1)} días`;
  return `${hours.toFixed(1)} h`;
};

/** Compacto para los ejes: `$12.5k`. */
export const formatAxisUsd = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
  return `$${value}`;
};
