'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Info } from 'lucide-react';

import { ReportPanel } from '@/components/arrancaMcReport/reportPanel.component';
import { cn } from '@/lib/utils';
import { SalesTargetReport } from '@/services/salesTargets/types';
import {
  STATUS_CLASSES,
  dailyRangeLabel,
  formatDecimal,
  formatInt,
  formatLongDay,
  formatPace,
  formatPct,
  formatShortDate,
  projectionSummary,
  COMPLIANCE_CAPTION,
  statusGapLabel,
} from './salesTargets.utils';
import { TargetCalendar } from './targetCalendar.component';

const TargetDetailCharts = dynamic(
  () =>
    import('./salesTargetsCharts.component').then(
      (module) => module.TargetDetailCharts
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[380px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
    ),
  }
);

function HeadlineCard({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-gray-200 shadow-sm',
        className
      )}
    >
      <header className="bg-black py-2 text-center text-xs font-semibold uppercase tracking-wide text-white">
        {title}
      </header>
      <div className="flex flex-col items-center px-4 py-5 text-center">
        {children}
      </div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  valueClassName,
  lines,
}: {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  lines?: React.ReactNode[];
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border-b-4 border-secondary bg-gray-50 px-3 py-4 text-center">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-700">
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
      {lines?.map((line, index) => (
        <span key={index} className="mt-0.5 text-xs text-gray-500">
          {line}
        </span>
      ))}
    </div>
  );
}

/** Avance sobre la meta del mes, con el marcador de la meta al corte. */
function ProgressBar({ report }: { report: SalesTargetReport }) {
  if (!report.target) return null;
  const target = report.target.units;
  const clamp = (value: number) => Math.min(Math.max(value, 0), 100);
  const soldPct = clamp((report.sold.units / target) * 100);
  const markerPct = clamp(((report.targetToDate?.units ?? 0) / target) * 100);
  const day = Number(report.cutoff.slice(8, 10));

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <header className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold text-gray-900">
          Avance sobre la meta del mes
        </h2>
        <span className="text-xs text-gray-500">
          {formatPct(report.progressPct)} de la meta · día hábil{' '}
          {report.workingDays.elapsed} de {report.workingDays.total}
        </span>
      </header>
      <div className="relative h-9 rounded bg-gray-200">
        <div
          className="h-full rounded-l bg-secondary"
          style={{ width: `${soldPct}%` }}
        />
        {report.workingDays.elapsed > 0 && (
          <div
            className="absolute -top-6 bottom-0 flex flex-col items-center"
            style={{ left: `${markerPct}%`, transform: 'translateX(-50%)' }}
          >
            <span className="whitespace-nowrap text-xs font-semibold text-gray-900">
              Meta al día {day}: {formatInt(report.targetToDate?.units)}
            </span>
            <span className="w-0.5 flex-1 bg-gray-900" />
          </div>
        )}
      </div>
      <div className="mt-2 flex justify-between text-xs">
        <span className="font-semibold text-secondary">
          Vendido: {formatInt(report.sold.units)}
        </span>
        <span className="text-gray-600">Meta del mes: {formatInt(target)}</span>
      </div>
    </section>
  );
}

interface TargetDetailProps {
  report: SalesTargetReport;
  isAdmin: boolean;
  onConfigure: () => void;
}

/**
 * El detalle de una sucursal (o de la vista general), con la misma maqueta
 * que el PDF "Meta de ventas": tarjetas, avance, KPIs, gráficos y calendario.
 */
export function TargetDetail({
  report,
  isAdmin,
  onConfigure,
}: TargetDetailProps) {
  const statusClass = report.status ? STATUS_CLASSES[report.status] : null;
  const projection = projectionSummary(report);
  const hasTarget = report.target !== null;

  return (
    <div className="space-y-4">
      {!hasTarget && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>
            {report.branch
              ? `${report.branch.name} no tiene meta para ${report.monthLabel}.`
              : `Ninguna sucursal tiene meta para ${report.monthLabel}.`}{' '}
            Se muestra lo vendido.
          </span>
          {isAdmin && (
            <button
              type="button"
              onClick={onConfigure}
              className="font-semibold underline underline-offset-2"
            >
              Configurar metas
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <HeadlineCard title="Meta del mes" className="bg-gray-50">
          <span className="text-6xl font-bold leading-none text-secondary tabular-nums">
            {hasTarget ? formatInt(report.target?.units) : '—'}
          </span>
          <span className="mt-2 text-lg text-gray-800">motos</span>
          <span className="mt-1 text-xs text-gray-500">
            {report.workingDays.total} días hábiles
            {hasTarget && ` · ${dailyRangeLabel(report)}`}
          </span>
        </HeadlineCard>
        <HeadlineCard
          title={`Cumplimiento al ${formatLongDay(report.cutoff)}`}
          className={statusClass?.card ?? 'bg-gray-50'}
        >
          <span
            className={cn(
              'text-6xl font-bold leading-none tabular-nums',
              statusClass?.text ?? 'text-gray-400'
            )}
          >
            {formatPct(report.compliancePct)}
          </span>
          {hasTarget && (
            <span className="mt-1 text-xs text-gray-600">
              {COMPLIANCE_CAPTION}
            </span>
          )}
          <span
            className={cn(
              'mt-2 text-base font-semibold',
              statusClass?.text ?? 'text-gray-500'
            )}
          >
            {statusGapLabel(
              report.sold.units,
              report.targetToDate?.units,
              report.workingDays.elapsed
            )}
          </span>
          <span className="mt-1 text-xs text-gray-600">
            {formatInt(report.sold.units)} vendidas
            {report.targetToDate &&
              ` · la meta a esa fecha era ${formatInt(report.targetToDate.units)}`}
          </span>
        </HeadlineCard>
      </div>

      <ProgressBar report={report} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Faltan para la meta"
          value={formatInt(report.remainingUnits)}
          lines={['motos']}
        />
        <KpiCard
          label="Ritmo necesario"
          value={formatPace(report.requiredPace)}
          valueClassName="text-secondary"
          lines={[
            `motos por día · quedan ${report.workingDays.remaining} días`,
          ]}
        />
        <KpiCard
          label="Ritmo actual"
          value={formatPace(report.currentPace)}
          lines={['motos por día']}
        />
        <KpiCard
          label="Cierre proyectado"
          value={formatInt(projection.units)}
          valueClassName={
            projection.pct !== null && projection.pct < 100
              ? 'text-red-600'
              : 'text-gray-900'
          }
          lines={[
            projection.pct !== null
              ? `motos · ${formatPct(projection.pct)} de la meta`
              : 'motos',
            projection.label,
            ...(projection.other
              ? [
                  `${projection.other.label}: ${formatInt(projection.other.units)}`,
                ]
              : []),
          ]}
        />
      </div>

      {report.projection.historical === null &&
        report.workingDays.elapsed > 0 && (
          <p className="flex items-start gap-2 text-xs text-gray-500">
            <Info className="mt-px h-3.5 w-3.5 shrink-0" />
            Sin histórico suficiente (hacen falta 3 meses con al menos 10
            motos); la proyección es al ritmo actual, sobre{' '}
            {report.workingDays.elapsed} días hábiles.
          </p>
        )}

      <TargetDetailCharts report={report} />

      <ReportPanel
        title="Meta día a día"
        description="Cada casilla: meta del día · meta acumulada · lo vendido hasta el corte."
      >
        <TargetCalendar
          days={report.days}
          cutoff={report.cutoff}
          hasTarget={hasTarget}
        />
      </ReportPanel>

      <footer className="space-y-1 border-t border-gray-200 pt-3 text-xs text-gray-500">
        {report.target?.usd ? (
          <p className="text-sm text-gray-700">
            Referencia en USD: meta del mes {formatInt(report.target.usd)} ·
            vendido {formatInt(report.sold.usd)} ·{' '}
            {formatPct(report.usdCompliancePct)} de la meta en USD a la fecha de
            corte
          </p>
        ) : (
          <p className="text-sm text-gray-700">
            Vendido en USD: {formatInt(report.sold.usd)}
          </p>
        )}
        <p>
          Cumplimiento = motos vendidas ÷ meta acumulada a la fecha de corte.
          Verde: 100 % o más · amarillo: 85 a 99 % · rojo: menos de 85 %.
        </p>
        <p>
          Corte: {formatShortDate(report.cutoff)}. Días hábiles de lunes a
          sábado. Proyección de cierre {projection.label}.
        </p>
      </footer>
    </div>
  );
}
