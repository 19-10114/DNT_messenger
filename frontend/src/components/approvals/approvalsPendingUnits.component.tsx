'use client';

import React, { useMemo } from 'react';
import {
  Bike,
  CalendarClock,
  ClipboardList,
  Layers,
  RefreshCw,
} from 'lucide-react';

import { GpsKpiCard } from '@/components/gps/gpsKpiCard.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { APPROVAL_DETAIL } from '@/constants/routes';
import { useApprovalPendingUnits } from '@/hooks/approvals';
import { cn } from '@/lib/utils';
import {
  ApprovalPendingByProduct,
  ApprovalPendingRow,
} from '@/services/approvals/types';
import { ApprovalPendingMatrix } from './approvalPendingMatrix.component';
import { ApprovalStatusBadge } from './approvalStatusBadge.component';
import { formatApprovalDate, formatApprovalProduct } from './approvals.utils';

/**
 * "Motos por recibir": lo que Empire aprobó y todavía no llegó. Con una
 * sucursal activa son las aprobaciones que esa sucursal pidió (las motos
 * pueden llegar a otra); con `0`, todas.
 *
 * "En preórdenes" son motos ya cargadas en una preorden de compra que aún no
 * se aprobó: van en camino al inventario pero todavía no cuentan.
 */
export function ApprovalsPendingUnits() {
  const {
    isAllBranchesPendingView,
    pendingRows,
    pendingByProduct,
    pendingMatrix,
    pendingTotals,
    isLoadingPending,
    isFetchingPending,
    isErrorPending,
    refetchPending,
  } = useApprovalPendingUnits();

  const rowColumns: GenericTableColumn<ApprovalPendingRow>[] = useMemo(
    () => [
      {
        key: 'approvalNumber',
        header: 'Aprobación',
        sticky: true,
        className: 'whitespace-nowrap font-mono font-semibold',
        href: (row) => APPROVAL_DETAIL(row.approvalId),
      },
      {
        key: 'approvalDate',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatApprovalDate(row.approvalDate),
      },
      {
        key: 'daysOpen',
        header: 'Días',
        align: 'right',
        className: 'tabular-nums',
        cellClassName: (row) =>
          row.daysOpen > 60
            ? 'text-red-700 font-semibold'
            : row.daysOpen > 30
              ? 'text-amber-700'
              : '',
      },
      {
        key: 'approvalStatus',
        header: 'Estado',
        render: (row) => <ApprovalStatusBadge status={row.approvalStatus} />,
      },
      {
        key: 'branch',
        header: 'Va a',
        hidden: !isAllBranchesPendingView,
        className: 'whitespace-nowrap font-medium',
        render: (row) => row.branch?.name || '-',
      },
      {
        key: 'requestedBy',
        header: 'Pedida por',
        className: 'hidden whitespace-nowrap text-gray-500 lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
        render: (row) => row.requestedBy?.name || '-',
      },
      {
        key: 'product',
        header: 'Modelo',
        className: 'whitespace-nowrap text-gray-900',
        render: (row) => formatApprovalProduct(row.product),
      },
      {
        key: 'quantity',
        header: 'Aprobadas',
        align: 'right',
        className: 'tabular-nums',
      },
      {
        key: 'receivedQuantity',
        header: 'Recibidas',
        align: 'right',
        className: 'tabular-nums',
      },
      {
        key: 'remainingQuantity',
        header: 'Faltan',
        align: 'right',
        className: 'tabular-nums font-semibold text-amber-700',
      },
      {
        key: 'inPreorders',
        header: 'En preórdenes',
        align: 'right',
        className: 'tabular-nums',
        cellClassName: (row) =>
          row.inPreorders ? 'text-blue-700' : 'text-gray-400',
      },
    ],
    [isAllBranchesPendingView]
  );

  const productColumns: GenericTableColumn<ApprovalPendingByProduct>[] =
    useMemo(
      () => [
        {
          key: 'product',
          header: 'Modelo',
          className: 'font-medium text-gray-900',
          render: (row) => formatApprovalProduct(row.product),
        },
        {
          key: 'remainingQuantity',
          header: 'Por recibir',
          align: 'right',
          className: 'tabular-nums font-semibold',
        },
        {
          key: 'inPreorders',
          header: 'En preórdenes',
          align: 'right',
          className: 'tabular-nums',
        },
        {
          key: 'approvals',
          header: 'Aprobaciones',
          align: 'right',
          className: 'tabular-nums text-gray-500',
        },
      ],
      []
    );

  if (isErrorPending) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudieron cargar las motos por recibir.
        <Button variant="outline" size="sm" onClick={() => refetchPending()}>
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {isAllBranchesPendingView
            ? 'Todas las sucursales.'
            : 'Lo que Empire aprobó enviar a esta sucursal y todavía no llegó.'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPending()}
          disabled={isFetchingPending}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isFetchingPending && 'animate-spin')}
          />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <GpsKpiCard
          label="Motos por recibir"
          value={pendingTotals?.bikes ?? 0}
          hint="Aprobadas por Empire y aún no registradas"
          icon={Bike}
          tone="pending"
          isLoading={isLoadingPending}
        />
        <GpsKpiCard
          label="Aprobaciones abiertas"
          value={pendingTotals?.approvals ?? 0}
          hint="Pendientes o en curso"
          icon={ClipboardList}
          isLoading={isLoadingPending}
        />
        <GpsKpiCard
          label="Modelos"
          value={pendingTotals?.models ?? 0}
          hint="Con motos por recibir"
          icon={Layers}
          isLoading={isLoadingPending}
        />
        <GpsKpiCard
          label="La más antigua"
          value={`${pendingTotals?.oldestDaysOpen ?? 0} días`}
          hint="Desde la fecha de la aprobación"
          icon={CalendarClock}
          isLoading={isLoadingPending}
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Por sucursal y modelo</h3>
          <p className="text-xs text-gray-500">
            Solo sucursales y modelos con motos por recibir.
          </p>
        </header>
        <div className="p-4">
          <ApprovalPendingMatrix
            matrix={pendingMatrix}
            isLoading={isLoadingPending}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Por modelo</h3>
          </header>
          <div className="p-4">
            <GenericTable<ApprovalPendingByProduct>
              columns={productColumns}
              data={pendingByProduct}
              getRowKey={(row) => row.product.id}
              isLoading={isLoadingPending}
              density="compact"
              emptyMessage="Nada por recibir."
            />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">
              Detalle por aprobación
            </h3>
            <p className="text-xs text-gray-500">
              De la aprobación más antigua a la más nueva. Click en el número
              para ver el detalle.
            </p>
          </header>
          <div className="p-4">
            <GenericTable<ApprovalPendingRow>
              columns={rowColumns}
              data={pendingRows}
              getRowKey={(row) => `${row.approvalId}-${row.lineId}`}
              isLoading={isLoadingPending}
              density="compact"
              emptyMessage="No hay motos por recibir de Empire."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
