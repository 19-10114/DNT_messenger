'use client';

import React from 'react';
import dynamic from 'next/dynamic';

import { cn } from '@/lib/utils';
import {
  SalesTargetOverview,
  SalesTargetOverviewRow,
  SalesTargetRowProjection,
  TargetStatus,
} from '@/services/salesTargets/types';
import {
  STATUS_CLASSES,
  formatDecimal,
  formatInt,
  formatLongDay,
  formatPace,
  formatPct,
  COMPLIANCE_CAPTION,
  statusGapLabel,
} from './salesTargets.utils';

const TargetsOverviewChart = dynamic(
  () =>
    import('./salesTargetsCharts.component').then(
      (module) => module.TargetsOverviewChart
    ),
  { ssr: false }
);

function StatusChip({
  status,
  pct,
}: {
  status: TargetStatus | null;
  pct: number | null;
}) {
  if (!status) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums',
        STATUS_CLASSES[status].chip
      )}
    >
      {formatPct(pct)}
    </span>
  );
}

const primaryClose = (projection: SalesTargetRowProjection) =>
  projection.primary === 'historical' ? projection.historical : projection.pace;

function SummaryTile({
  label,
  value,
  lines,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  lines?: string[];
  className?: string;
  valueClassName?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span
        className={cn(
          'mt-1 text-3xl font-bold tabular-nums',
          valueClassName ?? 'text-gray-900'
        )}
      >
        {value}
      </span>
      {lines?.map((line) => (
        <span key={line} className="mt-0.5 text-xs text-gray-500">
          {line}
        </span>
      ))}
    </div>
  );
}

interface TargetsOverviewProps {
  overview: SalesTargetOverview;
  onSelectBranch: (branchId: number) => void;
}

/**
 * Vista general: todas las sucursales con su cumplimiento y semáforo. Los
 * totales suman solo las sucursales que tienen meta este mes.
 */
export function TargetsOverview({
  overview,
  onSelectBranch,
}: TargetsOverviewProps) {
  const { totals } = overview;
  const status = totals.status ? STATUS_CLASSES[totals.status] : null;
  const close = primaryClose(totals.projection);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="Meta del mes"
          value={formatInt(totals.target)}
          valueClassName="text-secondary"
          lines={[
            `motos · ${totals.branchesWithTarget} de ${totals.branches} sucursales con meta`,
            `${overview.workingDays.total} días hábiles`,
          ]}
        />
        <SummaryTile
          label={`Cumplimiento al ${formatLongDay(overview.cutoff)}`}
          value={formatPct(totals.compliancePct)}
          className={status?.card}
          valueClassName={status?.text}
          lines={[
            COMPLIANCE_CAPTION,
            statusGapLabel(
              totals.sold,
              totals.targetToDate,
              overview.workingDays.elapsed
            ),
            `${formatInt(totals.sold)} vendidas · meta a la fecha ${formatInt(totals.targetToDate)}`,
          ]}
        />
        <SummaryTile
          label="Faltan para la meta"
          value={formatInt(totals.remainingUnits)}
          lines={[
            `ritmo necesario ${formatPace(totals.requiredPace)} por día`,
            `ritmo actual ${formatPace(totals.currentPace)} por día`,
          ]}
        />
        <SummaryTile
          label="Cierre proyectado"
          value={formatInt(close)}
          lines={[
            totals.projection.primary === 'historical'
              ? 'según histórico'
              : 'al ritmo actual',
            ...(totals.projection.primary === 'historical' &&
            totals.projection.pace !== null
              ? [`al ritmo actual: ${formatInt(totals.projection.pace)}`]
              : []),
          ]}
        />
      </div>

      <TargetsOverviewChart overview={overview} />

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-200 px-4 py-3">
          <h2 className="text-sm font-semibold text-gray-900">Sucursales</h2>
          <p className="text-xs text-gray-500">
            Pulsa una fila para ver el detalle día a día; también cambia la
            sucursal de la barra.
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-2 text-left">Sucursal</th>
                <th className="px-3 py-2 text-right">Meta</th>
                <th className="px-3 py-2 text-right">Vendido</th>
                <th className="px-3 py-2 text-right">Meta al corte</th>
                <th className="px-3 py-2 text-center">Cumplimiento</th>
                <th className="px-3 py-2 text-right">Faltan</th>
                <th className="px-3 py-2 text-right">Ritmo nec.</th>
                <th className="px-3 py-2 text-right">Ritmo actual</th>
                <th className="px-4 py-2 text-right">Cierre proy.</th>
              </tr>
            </thead>
            <tbody>
              {overview.rows.map((row: SalesTargetOverviewRow) => (
                <tr
                  key={row.branch.id}
                  onClick={() => onSelectBranch(row.branch.id)}
                  className={cn(
                    'cursor-pointer border-t border-gray-100 tabular-nums hover:bg-gray-50',
                    !row.hasTarget && 'text-gray-400'
                  )}
                >
                  <td className="px-4 py-2 font-medium text-gray-900">
                    {row.branch.name}
                    {!row.hasTarget && (
                      <span className="ml-2 text-xs font-normal text-gray-400">
                        Sin meta
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatInt(row.target)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-900">
                    {formatInt(row.sold)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatInt(row.targetToDate)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusChip status={row.status} pct={row.compliancePct} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatInt(row.remainingUnits)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPace(row.requiredPace)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPace(row.currentPace)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatInt(primaryClose(row.projection))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
