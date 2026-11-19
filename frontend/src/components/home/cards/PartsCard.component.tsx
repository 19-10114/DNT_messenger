'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

import { PARTS_REPORT } from '@/constants/routes';
import { ManagerDashboardParts } from '@/services/dashboard/types';
import {
  CHART_GRID_COLOR,
  CHART_TEXT,
  formatCount,
  formatUsd,
} from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

const ReportChart = dynamic(
  () => import('@/components/ui/reportChart.component'),
  {
    ssr: false,
    loading: () => <div className="h-32 animate-pulse rounded bg-gray-50" />,
  }
);

const capitalize = (text: string) =>
  text ? text[0].toUpperCase() + text.slice(1) : 'Sin categoría';

/** Venta de repuestos del período por categoría, total y top productos. */
export function PartsCard({ parts }: { parts: ManagerDashboardParts | null }) {
  const option = useMemo<EChartsOption | null>(() => {
    if (!parts || parts.byCategory.length === 0) return null;
    const rows = [...parts.byCategory].reverse();
    return {
      grid: { left: 8, right: 16, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => formatUsd(Number(value)),
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          ...CHART_TEXT,
          formatter: (value: number) => formatUsd(value),
        },
        splitLine: { lineStyle: { color: CHART_GRID_COLOR } },
      },
      yAxis: {
        type: 'category',
        data: rows.map((row) => capitalize(row.name)),
        axisLabel: CHART_TEXT,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_GRID_COLOR } },
      },
      series: [
        {
          type: 'bar',
          name: 'Venta',
          data: rows.map((row) => row.revenue),
          itemStyle: { color: '#ec6200', borderRadius: [0, 4, 4, 0] },
          barMaxWidth: 22,
        },
      ],
    };
  }, [parts]);

  return (
    <DashboardCard
      title="Venta de repuestos"
      href={PARTS_REPORT}
      unavailable={!parts}
      className="md:col-span-2"
    >
      {parts && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Total"
                value={formatUsd(parts.totalRevenue)}
                emphasis
              />
              <Stat label="Utilidad" value={formatUsd(parts.totalUtility)} />
              <Stat label="Unidades" value={formatCount(parts.units)} />
            </div>
            {option ? (
              <ReportChart
                option={option}
                height={Math.max(96, parts.byCategory.length * 44)}
                ariaLabel="Venta de repuestos por categoría"
              />
            ) : (
              <p className="text-sm text-gray-500">
                Sin ventas de repuestos en el período.
              </p>
            )}
          </div>
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">
              Más vendidos
            </p>
            <ol className="space-y-1.5">
              {parts.topProducts.map((product, index) => (
                <li
                  key={product.productId}
                  className="flex items-baseline justify-between gap-2 text-sm"
                >
                  <span className="min-w-0 truncate text-gray-800">
                    <span className="mr-1 text-gray-400">{index + 1}.</span>
                    {product.name}
                  </span>
                  <span className="shrink-0 tabular-nums text-gray-600">
                    {formatCount(product.units)} · {formatUsd(product.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </DashboardCard>
  );
}
