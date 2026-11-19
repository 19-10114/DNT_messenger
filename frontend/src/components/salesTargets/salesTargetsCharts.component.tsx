'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';

import { ReportPanel } from '@/components/arrancaMcReport/reportPanel.component';
import {
  SalesTargetOverview,
  SalesTargetReport,
} from '@/services/salesTargets/types';
import {
  cumulativeChartOption,
  dailyChartOption,
  overviewChartOption,
} from './salesTargets.utils';

const ReportChart = dynamic(
  () => import('@/components/ui/reportChart.component'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse rounded bg-gray-50" />
    ),
  }
);

/** Venta acumulada vs. meta acumulada, y el detalle diario hasta el corte. */
export function TargetDetailCharts({ report }: { report: SalesTargetReport }) {
  const cumulative = useMemo(() => cumulativeChartOption(report), [report]);
  const daily = useMemo(() => dailyChartOption(report), [report]);
  const hasPastDays = report.workingDays.elapsed > 0;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ReportPanel
        className="xl:col-span-2"
        title="Venta acumulada vs. meta acumulada"
        description="Línea discontinua: meta. Punteadas: proyecciones de cierre desde la fecha de corte."
      >
        <ReportChart
          option={cumulative}
          height={320}
          ariaLabel="Venta acumulada frente a la meta acumulada del mes"
        />
      </ReportPanel>
      <ReportPanel
        title="Meta del día vs. vendido"
        description="Días hábiles hasta el corte. En rojo, los días por debajo de su meta."
      >
        {hasPastDays ? (
          <ReportChart
            option={daily}
            height={320}
            ariaLabel="Meta y venta de cada día hábil hasta el corte"
          />
        ) : (
          <div className="flex h-[320px] items-center justify-center rounded-lg border border-dashed border-gray-200 text-sm text-gray-500">
            Todavía no hay días transcurridos.
          </div>
        )}
      </ReportPanel>
    </div>
  );
}

/** Cumplimiento de cada sucursal con meta. */
export function TargetsOverviewChart({
  overview,
}: {
  overview: SalesTargetOverview;
}) {
  const option = useMemo(() => overviewChartOption(overview), [overview]);
  const count = overview.rows.filter(
    (row) => row.hasTarget && row.compliancePct !== null
  ).length;
  if (!count) return null;
  return (
    <ReportPanel
      title="Cumplimiento por sucursal"
      description="Vendido sobre la meta acumulada a la fecha de corte. Referencias en 85 % y 100 %."
    >
      <ReportChart
        option={option}
        height={Math.max(160, count * 36 + 40)}
        ariaLabel="Cumplimiento de la meta por sucursal"
      />
    </ReportPanel>
  );
}
