'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { Download, Info, RefreshCw } from 'lucide-react';

import { ArrancaBalanceStatusBadge } from '@/components/arrancaBalance/arrancaBalanceStatusBadge.component';
import { GpsStatusBadge } from '@/components/gps/gpsStatusBadge.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import {
  arrancaMcReportService,
  useArrancaMcSummary,
} from '@/hooks/arrancaMcReport';
import { useAllBranches } from '@/hooks/useAllBranches';
import { cn } from '@/lib/utils';
import {
  ArrancaMcCashCloseBranch,
  ArrancaMcGpsAging,
  ArrancaMcSummary,
} from '@/services/arrancaMcReport/types';
import { useToken } from '@/stores/auth/auth.store';
import { ArrancaMcFeed } from './arrancaMcFeed.component';
import {
  favourLabel,
  favourTextClass,
  formatDateTime,
  formatHours,
  formatLongDay,
  formatSignedUsd,
  formatUsd,
  monthStartInCaracas,
  todayInCaracas,
} from './arrancaMcReport.utils';
import { ReportPanel } from './reportPanel.component';

const ArrancaMcCharts = dynamic(() => import('./arrancaMcCharts.component'), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] animate-pulse rounded-xl border border-gray-200 bg-gray-50" />
  ),
});

/** `0` es "todas las sucursales". */
const ALL_BRANCHES = 0;

const branchLabel = (branch: number | null, branchName: string) =>
  branchName || (branch === null ? 'Sin sucursal' : `Sucursal #${branch}`);

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  lines?: React.ReactNode[];
  emphasis?: boolean;
}

/** Una cifra del resumen. La principal —el balance neto— va más grande. */
function StatTile({
  label,
  value,
  valueClassName,
  lines,
  emphasis = false,
}: StatTileProps) {
  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </span>
      <span
        className={cn(
          'mt-1 font-semibold tabular-nums',
          emphasis ? 'text-3xl' : 'text-2xl',
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

function StatTiles({ summary }: { summary: ArrancaMcSummary }) {
  const { balance, cashCloses, bikes, gps } = summary;
  const installed =
    (gps.withPartner.byStatus.installed ?? 0) +
    (gps.withPartner.byStatus.on_street ?? 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      <StatTile
        emphasis
        label="Balance neto"
        value={formatUsd(Math.abs(balance.net))}
        valueClassName={favourTextClass(balance.net)}
        lines={[
          <span
            key="favour"
            className={cn('font-medium', favourTextClass(balance.net))}
          >
            {favourLabel(balance.net)}
          </span>,
          `Con lo pendiente quedaría en ${formatSignedUsd(balance.projectedNet)}`,
        ]}
      />
      <StatTile
        label="Neto del período"
        value={formatSignedUsd(balance.periodNet)}
        valueClassName={favourTextClass(balance.periodNet)}
        lines={[
          `A favor de MC ${formatUsd(balance.sent)} · de Arranca ${formatUsd(balance.received)}`,
          `Al inicio del período: ${formatSignedUsd(balance.opening)}`,
        ]}
      />
      <StatTile
        label="Pendiente por aprobar"
        value={balance.pending.count}
        valueClassName={
          balance.pending.count ? 'text-secondary' : 'text-gray-900'
        }
        lines={[
          `Decide Moto Candela: ${balance.pending.awaitingUs.count} (${formatUsd(balance.pending.awaitingUs.amount)})`,
          `Decide Arranca: ${balance.pending.awaitingPartner.count} (${formatUsd(balance.pending.awaitingPartner.amount)})`,
          balance.pending.oldestCreatedAt
            ? `El más antiguo: ${formatDateTime(balance.pending.oldestCreatedAt)}`
            : 'Nada pendiente',
        ]}
      />
      <StatTile
        label="Cierres de caja"
        value={formatUsd(cashCloses.total)}
        lines={[
          `${cashCloses.count} cierre(s) · promedio ${formatUsd(cashCloses.average)}`,
          cashCloses.pendingCount
            ? `${cashCloses.pendingCount} por aprobar (${formatUsd(cashCloses.pendingTotal)})`
            : 'Ninguno pendiente',
        ]}
      />
      <StatTile
        label="Motos a Arranca"
        value={bikes.netCount}
        lines={[
          `Entregadas ${bikes.sales.count} · devueltas ${bikes.returns.count}`,
          `Valor aprobado ${formatUsd(bikes.sales.approvedAmount - bikes.returns.approvedAmount)}`,
          `${bikes.units.total} entregadas en total · ${bikes.units.withGps} con GPS`,
        ]}
      />
      <StatTile
        label="GPS de Arranca"
        value={gps.withPartner.total}
        valueClassName={gps.stale.count ? 'text-secondary' : 'text-gray-900'}
        lines={[
          `Instalados ${installed} de ${gps.withPartner.total}`,
          gps.stale.count
            ? `${gps.stale.count} sin instalar hace ${gps.stale.days}+ días`
            : `Ninguno lleva ${gps.stale.days}+ días sin instalar`,
        ]}
      />
    </div>
  );
}

function DetailPanels({ summary }: { summary: ArrancaMcSummary }) {
  const closeColumns: GenericTableColumn<ArrancaMcCashCloseBranch>[] = [
    {
      key: 'branch',
      header: 'Sucursal',
      render: (row) => branchLabel(row.branch, row.branchName),
    },
    {
      key: 'count',
      header: 'Cierres',
      align: 'center',
      className: 'tabular-nums',
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      className: 'tabular-nums whitespace-nowrap',
      render: (row) => formatUsd(row.total),
    },
    {
      key: 'lastBusinessDate',
      header: 'Último día',
      className: 'whitespace-nowrap',
      render: (row) =>
        row.lastBusinessDate && /^\d{4}-\d{2}-\d{2}$/.test(row.lastBusinessDate)
          ? formatLongDay(row.lastBusinessDate)
          : row.lastBusinessDate || '—',
    },
    {
      key: 'lastStatus',
      header: 'Estado',
      render: (row) => <ArrancaBalanceStatusBadge status={row.lastStatus} />,
    },
  ];

  const agingColumns: GenericTableColumn<ArrancaMcGpsAging>[] = [
    { key: 'imei', header: 'IMEI', className: 'tabular-nums' },
    {
      key: 'branch',
      header: 'Sucursal',
      render: (unit) => branchLabel(unit.branch, unit.branchName),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (unit) => <GpsStatusBadge status={unit.status} />,
    },
    {
      key: 'days',
      header: 'Días',
      align: 'right',
      className: 'tabular-nums',
      cellClassName: (unit) =>
        unit.days >= summary.gps.stale.days
          ? 'font-semibold text-secondary'
          : undefined,
    },
  ];

  const byModel = summary.bikes.units.byModel;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <ReportPanel
        title="Cierres de caja por sucursal"
        description="En el período, sin contar los rechazados."
      >
        <GenericTable<ArrancaMcCashCloseBranch>
          columns={closeColumns}
          data={summary.cashCloses.byBranch}
          density="compact"
          emptyMessage="No hubo cierres de caja en el período."
        />
      </ReportPanel>

      <ReportPanel
        title="GPS esperando instalación"
        description="Recibidos de Arranca y todavía sin instalar, los más antiguos primero."
      >
        <GenericTable<ArrancaMcGpsAging>
          columns={agingColumns}
          data={summary.gps.aging}
          density="compact"
          emptyMessage="No hay GPS de Arranca sin instalar."
        />
      </ReportPanel>

      <ReportPanel
        title="Motos entregadas por modelo"
        description={`Las ${summary.bikes.units.total} motos que Moto Candela le entregó a Arranca, de toda la empresa.`}
      >
        {byModel.length ? (
          <ul className="space-y-2">
            {byModel.map((row) => (
              <li key={row.product} className="text-sm">
                <div className="flex justify-between gap-2">
                  <span className="truncate text-gray-700">{row.product}</span>
                  <span className="font-medium tabular-nums text-gray-900">
                    {row.count}
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                  <div
                    className="h-1.5 rounded-full bg-secondary"
                    style={{
                      width: `${(row.count / byModel[0].count) * 100}%`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
            Todavía no se entregaron motos a Arranca.
          </p>
        )}
      </ReportPanel>
    </div>
  );
}

/**
 * Reporte "Arranca - MC": lo que Moto Candela comparte con Arranca —balance,
 * motos y GPS— desde el punto de vista de Moto Candela. Positivo es a favor de
 * MC; sólo lo aprobado mueve el balance.
 *
 * Arranca tiene la misma pantalla con los signos al revés: para el mismo rango
 * y sucursal, los dos balances netos deben ser iguales y opuestos.
 */
export function ArrancaMcReport() {
  const { toast } = useToast();
  const token = useToken();

  const [branchId, setBranchId] = useState(ALL_BRANCHES);
  const [startDate, setStartDate] = useState(monthStartInCaracas);
  const [endDate, setEndDate] = useState(todayInCaracas);
  const [isExporting, setIsExporting] = useState(false);

  const {
    arrancaMcSummary: summary,
    isLoadingArrancaMcSummary,
    isErrorArrancaMcSummary,
    isFetchingArrancaMcSummary,
    refetchArrancaMcSummary,
  } = useArrancaMcSummary({ branchId, startDate, endDate });
  const { data: branches, isLoading: isLoadingBranches } = useAllBranches();

  const scopeName =
    branchId === ALL_BRANCHES
      ? 'Todas las sucursales'
      : (branches?.find((branch) => branch.id === branchId)?.name ??
        `Sucursal #${branchId}`);

  const exportReport = async () => {
    if (!summary || !token) return;
    setIsExporting(true);
    try {
      const feed = await arrancaMcReportService.getWholeFeed(token, {
        branchId,
        startDate,
        endDate,
      });
      const { exportArrancaMcReport } = await import('./exportArrancaMcReport');
      await exportArrancaMcReport(summary, feed, scopeName);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo exportar el reporte',
        description: (error as Error)?.message || 'Intentá de nuevo.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-row lg:flex-wrap lg:items-end">
        <label className="grid gap-1 text-xs font-medium text-gray-500">
          Sucursal
          <Select
            value={String(branchId)}
            onValueChange={(value) => setBranchId(Number(value))}
            disabled={isLoadingBranches}
          >
            <SelectTrigger className="w-full lg:w-56" aria-label="Sucursal">
              <SelectValue placeholder="Sucursal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={String(ALL_BRANCHES)}>
                Todas las sucursales
              </SelectItem>
              {branches?.map((branch) => (
                <SelectItem key={branch.id} value={String(branch.id)}>
                  {branch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        <label className="grid gap-1 text-xs font-medium text-gray-500">
          Desde
          <Input
            type="date"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) =>
              event.target.value && setStartDate(event.target.value)
            }
            className="w-full lg:w-40"
          />
        </label>
        <label className="grid gap-1 text-xs font-medium text-gray-500">
          Hasta
          <Input
            type="date"
            value={endDate}
            min={startDate || undefined}
            max={todayInCaracas()}
            onChange={(event) =>
              event.target.value && setEndDate(event.target.value)
            }
            className="w-full lg:w-40"
          />
        </label>

        <div className="flex gap-2 lg:ml-auto">
          <Button
            variant="outline"
            onClick={() => refetchArrancaMcSummary()}
            disabled={isFetchingArrancaMcSummary}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isFetchingArrancaMcSummary && 'animate-spin'
              )}
            />
            Actualizar
          </Button>
          <Button onClick={exportReport} disabled={!summary || isExporting}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exportando…' : 'Exportar'}
          </Button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-gray-500">
        <Info className="mt-px h-3.5 w-3.5 shrink-0" />
        <span>
          Positivo es a favor de Moto Candela y negativo a favor de Arranca.
          Sólo lo aprobado mueve el balance; lo pendiente se muestra aparte.
          {summary && (
            <>
              {' '}
              Tiempo medio de aprobación:{' '}
              {formatHours(summary.balance.decisions.averageHours)}. Actualizado{' '}
              {formatDateTime(summary.generatedAt)}.
            </>
          )}
        </span>
      </p>

      {isErrorArrancaMcSummary && !summary ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          No se pudo cargar el reporte. Probá con &quot;Actualizar&quot;.
        </p>
      ) : isLoadingArrancaMcSummary || !summary ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      ) : (
        <>
          <StatTiles summary={summary} />
          <ArrancaMcCharts
            summary={summary}
            showBranchChart={branchId === ALL_BRANCHES}
          />
          <DetailPanels summary={summary} />
        </>
      )}

      <ArrancaMcFeed
        branchId={branchId}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}
