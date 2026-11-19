'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

import { ARRANCA_BALANCE_KIND_LABELS } from '@/components/arrancaBalance/arrancaBalance.utils';
import {
  GPS_STATUS_LABELS,
  GPS_STATUS_ORDER,
} from '@/components/gps/gps.utils';
import { ArrancaMcSummary } from '@/services/arrancaMcReport/types';
import {
  REPORT_COLORS,
  favourColor,
  formatAxisUsd,
  formatDay,
  formatMonth,
  formatSignedUsd,
  formatUsd,
} from './arrancaMcReport.utils';
import { ReportPanel } from './reportPanel.component';

const ReportChart = dynamic(
  () => import('@/components/ui/reportChart.component'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse rounded bg-gray-50" />
    ),
  }
);

/** Por encima de esto la serie diaria se hace ilegible sin zoom. */
const ZOOM_AFTER_POINTS = 62;

const baseTextStyle = { color: REPORT_COLORS.text, fontSize: 11 };

const valueAxis = (formatter: (value: number) => string = formatAxisUsd) => ({
  type: 'value' as const,
  axisLabel: { ...baseTextStyle, formatter },
  splitLine: { lineStyle: { color: REPORT_COLORS.grid } },
});

const categoryAxis = (data: string[]) => ({
  type: 'category' as const,
  data,
  axisLabel: baseTextStyle,
  axisLine: { lineStyle: { color: REPORT_COLORS.grid } },
  axisTick: { show: false },
});

const legend = { bottom: 0, textStyle: baseTextStyle, icon: 'roundRect' };

/** Separación de 1px entre barras apiladas o vecinas, del color del fondo. */
const barGap = { borderColor: '#ffffff', borderWidth: 1 };

const branchLabel = (branch: number | null, branchName: string) =>
  branchName || (branch === null ? 'Sin sucursal' : `Sucursal #${branch}`);

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
      {message}
    </div>
  );
}

/** Balance acumulado día a día, con lo aprobado a favor de cada empresa debajo. */
function BalanceEvolutionChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo<EChartsOption>(() => {
    const days = summary.series.map((point) => formatDay(point.date));
    const zoom = summary.series.length > ZOOM_AFTER_POINTS;
    return {
      grid: { left: 64, right: 16, top: 16, bottom: zoom ? 80 : 48 },
      tooltip: {
        trigger: 'axis',
        valueFormatter: (value) => formatSignedUsd(Number(value)),
      },
      legend,
      xAxis: categoryAxis(days),
      yAxis: valueAxis(),
      dataZoom: zoom
        ? [{ type: 'slider', bottom: 28, height: 18 }, { type: 'inside' }]
        : undefined,
      series: [
        {
          name: 'A favor de Moto Candela',
          type: 'bar',
          stack: 'flow',
          itemStyle: {
            color: REPORT_COLORS.motoCandela,
            opacity: 0.45,
            ...barGap,
          },
          data: summary.series.map((point) => point.sent),
        },
        {
          name: 'A favor de Arranca',
          type: 'bar',
          stack: 'flow',
          itemStyle: { color: REPORT_COLORS.arranca, opacity: 0.4, ...barGap },
          data: summary.series.map((point) => -point.received),
        },
        {
          name: 'Balance acumulado',
          type: 'line',
          symbol: 'none',
          lineStyle: { width: 2, color: '#111827' },
          itemStyle: { color: '#111827' },
          data: summary.series.map((point) => point.runningBalance),
        },
      ],
    };
  }, [summary.series]);

  return (
    <ReportChart
      option={option}
      height={320}
      ariaLabel="Evolución diaria del balance entre Moto Candela y Arranca"
    />
  );
}

/** Barras horizontales con signo: a la derecha a favor de MC, a la izquierda de Arranca. */
function divergingOption(
  labels: string[],
  values: number[],
  pending: number[]
): EChartsOption {
  return {
    grid: { left: 8, right: 24, top: 8, bottom: 40, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) => formatSignedUsd(Number(value)),
    },
    legend,
    xAxis: valueAxis(),
    yAxis: { ...categoryAxis(labels), inverse: true },
    series: [
      {
        name: 'Aprobado',
        type: 'bar',
        barMaxWidth: 20,
        itemStyle: { borderRadius: 4 },
        data: values.map((value) => ({
          value,
          itemStyle: { color: favourColor(value) },
        })),
      },
      {
        name: 'Pendiente',
        type: 'bar',
        barMaxWidth: 20,
        itemStyle: {
          color: REPORT_COLORS.neutral,
          opacity: 0.7,
          borderRadius: 4,
        },
        data: pending,
      },
    ],
  };
}

function KindChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo(() => {
    const rows = summary.byKind;
    return divergingOption(
      rows.map((row) => ARRANCA_BALANCE_KIND_LABELS[row.kind] ?? row.kind),
      rows.map((row) => row.net),
      // Lo pendiente de cada tipo, con el signo que tendría al aprobarse.
      rows.map((row) => row.pendingNet)
    );
  }, [summary.byKind]);

  return (
    <ReportChart
      option={option}
      height={240}
      ariaLabel="Balance aprobado del período por tipo de movimiento"
    />
  );
}

function BranchChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo(
    () =>
      divergingOption(
        summary.byBranch.map((row) => branchLabel(row.branch, row.branchName)),
        summary.byBranch.map((row) => row.net),
        summary.byBranch.map((row) => row.pendingNet)
      ),
    [summary.byBranch]
  );

  if (!summary.byBranch.length) {
    return (
      <EmptyChart message="Todavía no hay movimientos en ninguna sucursal." />
    );
  }
  return (
    <ReportChart
      option={option}
      height={Math.max(200, summary.byBranch.length * 40 + 60)}
      ariaLabel="Balance acumulado por sucursal"
    />
  );
}

function BikesChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo<EChartsOption>(() => {
    const months = summary.bikes.monthly;
    return {
      grid: { left: 40, right: 16, top: 16, bottom: 48 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend,
      xAxis: categoryAxis(months.map((month) => formatMonth(month.month))),
      yAxis: valueAxis((value: number) => String(value)),
      series: [
        {
          name: 'Motos entregadas',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: REPORT_COLORS.motoCandela,
            borderRadius: [4, 4, 0, 0],
          },
          data: months.map((month) => month.salesCount),
        },
        {
          name: 'Devoluciones',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: REPORT_COLORS.arranca,
            borderRadius: [4, 4, 0, 0],
          },
          data: months.map((month) => month.returnsCount),
        },
      ],
    };
  }, [summary.bikes.monthly]);

  if (!summary.bikes.monthly.length) {
    return (
      <EmptyChart message="No se entregaron ni devolvieron motos en este período." />
    );
  }
  return (
    <ReportChart
      option={option}
      height={240}
      ariaLabel="Motos entregadas a Arranca y devueltas, por mes"
    />
  );
}

function GpsStatusChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo<EChartsOption>(() => {
    const statuses = GPS_STATUS_ORDER;
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 40, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend,
      xAxis: valueAxis((value: number) => String(value)),
      yAxis: {
        ...categoryAxis(statuses.map((status) => GPS_STATUS_LABELS[status])),
        inverse: true,
      },
      series: [
        {
          name: 'Propios',
          type: 'bar',
          stack: 'gps',
          barMaxWidth: 20,
          itemStyle: { color: REPORT_COLORS.motoCandela, ...barGap },
          data: statuses.map(
            (status) =>
              (summary.gps.byStatus[status] ?? 0) -
              (summary.gps.withPartner.byStatus[status] ?? 0)
          ),
        },
        {
          name: 'De Arranca',
          type: 'bar',
          stack: 'gps',
          barMaxWidth: 20,
          itemStyle: { color: REPORT_COLORS.arranca, ...barGap },
          data: statuses.map(
            (status) => summary.gps.withPartner.byStatus[status] ?? 0
          ),
        },
      ],
    };
  }, [summary.gps]);

  return (
    <ReportChart
      option={option}
      height={240}
      ariaLabel="Unidades GPS por estado, propias y recibidas de Arranca"
    />
  );
}

function GpsWeeklyChart({ summary }: { summary: ArrancaMcSummary }) {
  const option = useMemo<EChartsOption>(() => {
    const weeks = summary.gps.weekly;
    return {
      grid: { left: 40, right: 16, top: 16, bottom: 48 },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend,
      xAxis: categoryAxis(
        weeks.map((week) => `Sem. ${formatDay(week.weekStart)}`)
      ),
      yAxis: valueAxis((value: number) => String(value)),
      series: [
        {
          name: 'Recibidos de Arranca',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: REPORT_COLORS.arranca,
            borderRadius: [4, 4, 0, 0],
          },
          data: weeks.map((week) => week.sent),
        },
        {
          name: 'Devueltos',
          type: 'bar',
          barMaxWidth: 28,
          itemStyle: {
            color: REPORT_COLORS.neutral,
            borderRadius: [4, 4, 0, 0],
          },
          data: weeks.map((week) => week.returned),
        },
      ],
    };
  }, [summary.gps.weekly]);

  if (!summary.gps.weekly.length) {
    return (
      <EmptyChart message="No se recibieron ni devolvieron GPS en este período." />
    );
  }
  return (
    <ReportChart
      option={option}
      height={240}
      ariaLabel="GPS recibidos de Arranca y devueltos, por semana"
    />
  );
}

interface ArrancaMcChartsProps {
  summary: ArrancaMcSummary;
  showBranchChart: boolean;
}

/** Los gráficos del reporte, en el orden en que se leen: dinero, motos, GPS. */
export default function ArrancaMcCharts({
  summary,
  showBranchChart,
}: ArrancaMcChartsProps) {
  const gpsStatusPanel = (className?: string) => (
    <ReportPanel
      title="GPS por estado"
      description="Todo el parque de Moto Candela, separando lo recibido de Arranca."
      className={className}
    >
      <GpsStatusChart summary={summary} />
    </ReportPanel>
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <ReportPanel
        title="Evolución del balance"
        description="Balance aprobado acumulado al cierre de cada día, y lo aprobado cada día a favor de cada empresa."
        className="lg:col-span-2"
      >
        <BalanceEvolutionChart summary={summary} />
      </ReportPanel>

      <ReportPanel
        title="Por tipo de movimiento"
        description="Neto aprobado en el período. En gris, lo pendiente de aprobar."
      >
        <KindChart summary={summary} />
      </ReportPanel>

      {showBranchChart ? (
        <ReportPanel
          title="Balance por sucursal"
          description="Balance aprobado acumulado de cada sucursal. En gris, lo pendiente."
        >
          <BranchChart summary={summary} />
        </ReportPanel>
      ) : (
        gpsStatusPanel()
      )}

      <ReportPanel
        title="Motos por mes"
        description="Motos entregadas a Arranca y devueltas (movimientos no rechazados)."
      >
        <BikesChart summary={summary} />
      </ReportPanel>

      <ReportPanel
        title="GPS recibidos y devueltos"
        description="Por semana, dentro del período."
      >
        <GpsWeeklyChart summary={summary} />
      </ReportPanel>

      {showBranchChart && gpsStatusPanel('lg:col-span-2')}
    </div>
  );
}
