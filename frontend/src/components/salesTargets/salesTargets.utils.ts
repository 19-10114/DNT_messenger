import type { EChartsOption } from 'echarts';

import {
  ProjectionKind,
  SalesTargetOverview,
  SalesTargetReport,
  TargetStatus,
} from '@/services/salesTargets/types';

/** Colores del módulo; los mismos en pantalla, en los gráficos y en el PDF. */
export const TARGET_COLORS = {
  brand: '#ec6200',
  brandLight: '#f6a46a',
  ink: '#111111',
  target: '#3f3f46',
  neutral: '#94a3b8',
  grid: '#e5e7eb',
  text: '#6b7280',
} as const;

export const STATUS_COLORS: Record<TargetStatus, { fg: string; bg: string }> = {
  green: { fg: '#15803d', bg: '#dcfce7' },
  yellow: { fg: '#a16207', bg: '#fef3c7' },
  red: { fg: '#d63c42', bg: '#f9d9dc' },
};

/** Clases de Tailwind por semáforo, para chips y fondos. */
export const STATUS_CLASSES: Record<
  TargetStatus,
  { chip: string; card: string; text: string }
> = {
  green: {
    chip: 'bg-green-100 text-green-800',
    card: 'bg-green-50',
    text: 'text-green-700',
  },
  yellow: {
    chip: 'bg-amber-100 text-amber-800',
    card: 'bg-amber-50',
    text: 'text-amber-700',
  },
  red: {
    chip: 'bg-red-100 text-red-700',
    card: 'bg-red-50',
    text: 'text-red-600',
  },
};

const integerFormatter = new Intl.NumberFormat('es-VE', {
  maximumFractionDigits: 0,
});
const decimalFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

/** `490860` → "490.860", como en el PDF de referencia. */
export const formatInt = (value: number | null | undefined) =>
  value === null || value === undefined
    ? '—'
    : integerFormatter.format(Math.round(value));

/** `12.5` → "12,5"; `6.25` → "6,3". */
export const formatDecimal = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : decimalFormatter.format(value);

const paceFormatter = new Intl.NumberFormat('es-VE', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Ritmos en motos por día, con hasta dos decimales: `6.25` → "6,25". */
export const formatPace = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : paceFormatter.format(value);

/** `54.3` → "54 %". */
export const formatPct = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : `${formatInt(value)} %`;

const MONTHS_LOWER = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

/** `2026-10-05` → "5 de octubre". */
export const formatLongDay = (date: string) => {
  const [, month, day] = date.split('-').map(Number);
  return `${day} de ${MONTHS_LOWER[month - 1]}`;
};

/** `2026-10-05` → "05/10/2026". */
export const formatShortDate = (date: string) => {
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
};

/** El día del mes de una fecha `YYYY-MM-DD`. */
export const dayOfMonth = (date: string) => Number(date.slice(8, 10));

/** Primer y último día del mes `YYYY-MM`. */
export const monthBounds = (month: string) => {
  const [year, m] = month.split('-').map(Number);
  const last = new Date(Date.UTC(year, m, 0)).getUTCDate();
  return {
    first: `${month}-01`,
    last: `${month}-${String(last).padStart(2, '0')}`,
  };
};

/** Subtítulo del porcentaje de cumplimiento, para que no se lea con el estado. */
export const COMPLIANCE_CAPTION = 'de la meta a la fecha';

/**
 * El estado en motos frente a la meta a la fecha de corte: "17 MOTOS POR
 * DEBAJO", "AL DÍA", "5 MOTOS POR ENCIMA". En motos y no en porcentaje: "0 %
 * por debajo de la meta" se leía como "a 0 % de la meta", es decir, cumplida.
 * El color del semáforo sigue diciendo si está cerca o lejos.
 */
export function statusGapLabel(
  sold: number,
  targetToDate: number | null | undefined,
  elapsedWorkingDays: number
) {
  if (targetToDate === null || targetToDate === undefined) return 'SIN META';
  if (elapsedWorkingDays === 0) return 'EL MES NO HA EMPEZADO';
  const gap = sold - targetToDate;
  if (gap === 0) return 'AL DÍA';
  const units = Math.abs(gap);
  return `${formatInt(units)} ${units === 1 ? 'MOTO' : 'MOTOS'} POR ${
    gap < 0 ? 'DEBAJO' : 'ENCIMA'
  }`;
}

/** "entre 11 y 12 motos por día" a partir de la meta y los días hábiles. */
export const dailyRangeLabel = (report: SalesTargetReport) => {
  const daily = report.days
    .filter((day) => day.working && day.dailyTarget !== null)
    .map((day) => day.dailyTarget as number);
  if (!daily.length) return '';
  const min = Math.min(...daily);
  const max = Math.max(...daily);
  return min === max
    ? `${min} motos por día`
    : `entre ${min} y ${max} motos por día`;
};

export interface ProjectionSummary {
  kind: ProjectionKind;
  units: number | null;
  pct: number | null;
  label: string;
  other: { kind: ProjectionKind; units: number; label: string } | null;
}

const PROJECTION_LABEL: Record<ProjectionKind, string> = {
  historical: 'según histórico',
  pace: 'al ritmo actual',
};

/** La proyección principal con su subtítulo, y la otra para mostrarla debajo. */
export function projectionSummary(
  report: SalesTargetReport
): ProjectionSummary {
  const { projection } = report;
  const main =
    projection.primary === 'historical'
      ? projection.historical
      : projection.pace;
  const otherKind: ProjectionKind =
    projection.primary === 'historical' ? 'pace' : 'historical';
  const other =
    otherKind === 'historical' ? projection.historical : projection.pace;
  const label =
    projection.primary === 'historical' && projection.historical
      ? `según histórico de ${projection.historical.monthsUsed} meses`
      : 'al ritmo actual';
  return {
    kind: projection.primary,
    units: main?.units ?? null,
    pct: main?.pct ?? null,
    label,
    other: other
      ? {
          kind: otherKind,
          units: other.units,
          label: PROJECTION_LABEL[otherKind],
        }
      : null,
  };
}

/** Nombre del archivo: `Meta_Octubre2026_Guarenas_corte05.pdf`. */
export const pdfFileName = (report: SalesTargetReport) => {
  const scope = (report.branch?.name ?? 'General').replace(/\s+/g, '');
  const month = report.monthLabel.replace(/\s+/g, '');
  const day = report.cutoff.slice(8, 10);
  return `Meta_${month}_${scope}_corte${day}.pdf`;
};

// ------------------------------------------------------------------ charts

const baseText = { color: TARGET_COLORS.text, fontSize: 11 };

/** Los días que se dibujan en el eje: los hábiles, como en el PDF. */
export const chartDays = (report: SalesTargetReport) =>
  report.days.filter((day) => day.working);

/** El último día hábil hasta el corte, donde arrancan las proyecciones. */
export const cutoffDay = (report: SalesTargetReport) => {
  const past = chartDays(report).filter((day) => day.date <= report.cutoff);
  return past.length ? past[past.length - 1] : null;
};

/** Venta acumulada vs. meta acumulada, con las dos proyecciones de cierre. */
export function cumulativeChartOption(
  report: SalesTargetReport
): EChartsOption {
  const days = chartDays(report);
  const labels = days.map((day) =>
    String(dayOfMonth(day.date)).padStart(2, '0')
  );
  const pivot = cutoffDay(report);
  const pivotIndex = pivot ? days.indexOf(pivot) : -1;
  const soldAtPivot = pivot?.cumulativeSold ?? 0;
  const primary = report.projection.primary;

  const projectionData = (key: 'projectedPace' | 'projectedHistorical') =>
    days.map((day, index) => {
      if (pivotIndex < 0 || index < pivotIndex) return null;
      if (index === pivotIndex) return soldAtPivot;
      return day[key];
    });

  const hasHistorical = report.projection.historical !== null;
  const hasPace = report.projection.pace !== null;

  const series: EChartsOption['series'] = [];
  if (report.target) {
    series.push({
      name: 'Meta acumulada',
      type: 'line',
      data: days.map((day) => day.cumulativeTarget),
      symbol: 'none',
      lineStyle: { color: TARGET_COLORS.target, type: 'dashed', width: 2 },
      itemStyle: { color: TARGET_COLORS.target },
      endLabel: {
        show: true,
        formatter: ({ value }) => formatInt(Number(value)),
        color: TARGET_COLORS.ink,
        fontWeight: 'bold',
      },
      markPoint:
        pivotIndex >= 0 && report.targetToDate
          ? {
              symbol: 'diamond',
              symbolSize: 12,
              itemStyle: { color: TARGET_COLORS.ink },
              label: {
                position: 'top',
                color: TARGET_COLORS.ink,
                fontWeight: 'bold',
                formatter: `Meta ${formatInt(report.targetToDate.units)}`,
              },
              data: [
                {
                  name: 'Meta al corte',
                  coord: [pivotIndex, report.targetToDate.units],
                },
              ],
            }
          : undefined,
    });
  }
  if (hasHistorical) {
    series.push({
      name: 'Proyección según histórico',
      type: 'line',
      data: projectionData('projectedHistorical'),
      symbol: 'none',
      connectNulls: false,
      lineStyle: { color: TARGET_COLORS.brandLight, type: 'dotted', width: 2 },
      itemStyle: { color: TARGET_COLORS.brandLight },
      endLabel: {
        show: true,
        formatter: ({ value }) => formatInt(Number(value)),
        color: TARGET_COLORS.brand,
        fontWeight: 'bold',
      },
    });
  }
  if (hasPace) {
    series.push({
      name: 'Proyección al ritmo actual',
      type: 'line',
      data: projectionData('projectedPace'),
      symbol: 'none',
      lineStyle: {
        color:
          primary === 'pace' ? TARGET_COLORS.brandLight : TARGET_COLORS.neutral,
        type: 'dotted',
        width: 2,
      },
      itemStyle: {
        color:
          primary === 'pace' ? TARGET_COLORS.brandLight : TARGET_COLORS.neutral,
      },
      endLabel: {
        show: true,
        formatter: ({ value }) => formatInt(Number(value)),
        color: primary === 'pace' ? TARGET_COLORS.brand : TARGET_COLORS.text,
      },
    });
  }
  series.push({
    name: 'Venta acumulada',
    type: 'line',
    data: days.map((day) => day.cumulativeSold),
    symbol: 'circle',
    symbolSize: 7,
    lineStyle: { color: TARGET_COLORS.brand, width: 4 },
    itemStyle: { color: TARGET_COLORS.brand },
    z: 5,
    markPoint:
      pivotIndex >= 0
        ? {
            symbol: 'circle',
            symbolSize: 1,
            label: {
              position: 'bottom',
              distance: 10,
              color: TARGET_COLORS.brand,
              fontWeight: 'bold',
              formatter: `Vendido ${formatInt(report.sold.units)}`,
            },
            data: [
              { name: 'Vendido al corte', coord: [pivotIndex, soldAtPivot] },
            ],
          }
        : undefined,
  });

  return {
    grid: { left: 44, right: 48, top: 24, bottom: 56 },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) =>
        value === null || value === undefined
          ? '—'
          : formatDecimal(Number(value)),
    },
    legend: { bottom: 0, textStyle: baseText, icon: 'roundRect' },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLabel: baseText,
      axisLine: { lineStyle: { color: TARGET_COLORS.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      min: 0,
      axisLabel: baseText,
      splitLine: { lineStyle: { color: TARGET_COLORS.grid } },
    },
    series,
  };
}

/** Meta del día vs. vendido del día, hasta el corte. */
export function dailyChartOption(report: SalesTargetReport): EChartsOption {
  const days = chartDays(report).filter((day) => day.date <= report.cutoff);
  return {
    grid: { left: 36, right: 12, top: 16, bottom: 48 },
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, textStyle: baseText, icon: 'roundRect' },
    xAxis: {
      type: 'category',
      data: days.map((day) => String(dayOfMonth(day.date)).padStart(2, '0')),
      axisLabel: baseText,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: TARGET_COLORS.grid } },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLabel: baseText,
      splitLine: { lineStyle: { color: TARGET_COLORS.grid } },
    },
    series: [
      ...(report.target
        ? [
            {
              name: 'Meta del día',
              type: 'bar' as const,
              data: days.map((day) => day.dailyTarget),
              itemStyle: { color: '#d4d4d8' },
              barGap: '10%',
            },
          ]
        : []),
      {
        name: 'Vendido',
        type: 'bar',
        itemStyle: { color: TARGET_COLORS.brand },
        data: days.map((day) => ({
          value: day.sold ?? 0,
          itemStyle: {
            color:
              report.target && (day.sold ?? 0) < (day.dailyTarget ?? 0)
                ? STATUS_COLORS.red.fg
                : TARGET_COLORS.brand,
          },
        })),
      },
    ],
  };
}

/** Cumplimiento por sucursal, con referencias en 85 % y 100 %. */
export function overviewChartOption(
  overview: SalesTargetOverview
): EChartsOption {
  const rows = overview.rows
    .filter((row) => row.hasTarget && row.compliancePct !== null)
    .slice()
    .reverse();
  return {
    grid: { left: 110, right: 48, top: 28, bottom: 24 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => formatPct(Number(value)),
    },
    xAxis: {
      type: 'value',
      min: 0,
      // Siempre hasta 110 % como mínimo, para que se vean las referencias.
      max: ({ max }) => Math.max(110, Math.ceil(max / 10) * 10),
      axisLabel: { ...baseText, formatter: '{value} %' },
      splitLine: { lineStyle: { color: TARGET_COLORS.grid } },
    },
    yAxis: {
      type: 'category',
      data: rows.map((row) => row.branch.name),
      axisLabel: baseText,
      axisTick: { show: false },
      axisLine: { lineStyle: { color: TARGET_COLORS.grid } },
    },
    series: [
      {
        name: 'Cumplimiento',
        type: 'bar',
        barMaxWidth: 22,
        data: rows.map((row) => ({
          value: row.compliancePct,
          itemStyle: {
            color: row.status
              ? STATUS_COLORS[row.status].fg
              : TARGET_COLORS.neutral,
            borderRadius: [0, 4, 4, 0],
          },
        })),
        label: {
          show: true,
          position: 'right',
          color: TARGET_COLORS.ink,
          formatter: ({ value }) => formatPct(Number(value)),
        },
        markLine: {
          symbol: 'none',
          silent: true,
          label: { formatter: '{c} %', color: TARGET_COLORS.text },
          data: [
            {
              xAxis: 85,
              lineStyle: { color: STATUS_COLORS.yellow.fg, type: 'dashed' },
            },
            {
              xAxis: 100,
              lineStyle: { color: STATUS_COLORS.green.fg, type: 'dashed' },
            },
          ],
        },
      },
    ],
  };
}

// ------------------------------------------------------------------ errors

/** El backend responde en inglés; aquí se traducen sus mensajes conocidos. */
const BACKEND_MESSAGES: Record<string, string> = {
  'Only an administrator can change sales targets':
    'Solo un administrador puede cambiar las metas.',
  'Unknown or excluded branch': 'Sucursal desconocida o excluida.',
  'Target must be a whole number of at least 1':
    'La meta debe ser un número entero mayor que 0.',
  'USD target must be a positive number':
    'La meta en USD debe ser un monto positivo.',
  'Sundays are never working days': 'Los domingos nunca son hábiles.',
  'That day is already marked as non-working':
    'Ese día ya está marcado como no hábil.',
  'date must be YYYY-MM-DD': 'Fecha inválida.',
  'Non-working day not found': 'Ese día no hábil ya no existe.',
  'This branch is excluded from reports':
    'Esta sucursal está excluida de los reportes.',
  'Branch not found': 'La sucursal no existe.',
};

/** Mensaje legible de un error de la API de metas. */
export function salesTargetsErrorMessage(error: unknown, fallback: string) {
  const data = (
    error as {
      response?: { data?: { message?: string; errors?: unknown } };
    }
  )?.response?.data;
  const collect = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.flatMap(collect);
    if (value && typeof value === 'object')
      return Object.values(value).flatMap(collect);
    return value === undefined || value === null ? [] : [String(value)];
  };
  const details = collect(data?.errors).map(
    (message) => BACKEND_MESSAGES[message] ?? message
  );
  if (details.length) return Array.from(new Set(details)).join(' ');
  if (data?.message) return BACKEND_MESSAGES[data.message] ?? data.message;
  return fallback;
}
