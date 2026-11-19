'use client';

import { useMemo } from 'react';
import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';

import { MECHANICS_REPORT } from '@/constants/routes';
import { ManagerDashboardWorkshop } from '@/services/dashboard/types';
import {
  CHART_GRID_COLOR,
  CHART_TEXT,
  WORKSHOP_SERIES,
  formatCount,
  formatDayShort,
  formatUsd,
} from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

const ReportChart = dynamic(
  () => import('@/components/ui/reportChart.component'),
  {
    ssr: false,
    loading: () => <div className="h-44 animate-pulse rounded bg-gray-50" />,
  }
);

/** Taller: activaciones, GPS, cambios de aceite y mano de obra por día. */
export function WorkshopCard({
  workshop,
}: {
  workshop: ManagerDashboardWorkshop | null;
}) {
  const option = useMemo<EChartsOption | null>(() => {
    if (!workshop) return null;
    return {
      grid: { left: 8, right: 8, top: 44, bottom: 8, containLabel: true },
      legend: {
        top: 0,
        textStyle: CHART_TEXT,
        icon: 'roundRect',
        itemWidth: 10,
        itemHeight: 10,
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: workshop.byDay.map((row) => formatDayShort(row.day)),
        axisLabel: CHART_TEXT,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: CHART_GRID_COLOR } },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: CHART_TEXT,
        splitLine: { lineStyle: { color: CHART_GRID_COLOR } },
      },
      series: WORKSHOP_SERIES.map((serie) => ({
        type: 'bar' as const,
        name: serie.label,
        stack: 'workshop',
        data: workshop.byDay.map((row) => row[serie.key]),
        itemStyle: {
          color: serie.color,
          borderColor: '#ffffff',
          borderWidth: 1,
        },
        barMaxWidth: 28,
      })),
    };
  }, [workshop]);

  return (
    <DashboardCard
      title="Taller"
      href={MECHANICS_REPORT}
      unavailable={!workshop}
      className="md:col-span-2"
    >
      {workshop && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {WORKSHOP_SERIES.map((serie) => (
              <Stat
                key={serie.key}
                label={serie.label}
                value={formatCount(workshop[serie.key].count)}
                hint={formatUsd(workshop[serie.key].usd)}
              />
            ))}
          </div>
          {option && (
            <ReportChart
              option={option}
              height={200}
              ariaLabel="Servicios del taller por día"
            />
          )}
        </div>
      )}
    </DashboardCard>
  );
}
