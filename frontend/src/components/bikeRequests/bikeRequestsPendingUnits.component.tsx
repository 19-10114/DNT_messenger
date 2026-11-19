'use client';

import React, { useMemo } from 'react';
import { Bike, ClipboardList, DollarSign, RefreshCw } from 'lucide-react';

import { GpsKpiCard } from '@/components/gps/gpsKpiCard.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { ARRANCA_REQUEST_DETAIL } from '@/constants/routes';
import { useBikeRequestPendingUnits } from '@/hooks/bikeRequests';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BikeRequestPendingUnitRow,
  BikeRequestPendingUnitsByProduct,
} from '@/services/bikeRequests/types';
import { BikeRequestStatusBadge } from './bikeRequestStatusBadge.component';
import {
  formatBikeRequestDateTime,
  formatBikeRequestProduct,
  toBikeRequestAmount,
} from './bikeRequests.utils';

/**
 * "Motos por entregar": lo que Moto Candela le debe a Arranca en solicitudes
 * abiertas, acotado a la sucursal activa (`0` = todas). KPIs, resumen por
 * modelo y una fila por línea pendiente, de la solicitud más vieja a la más
 * nueva. El código lleva al detalle, que es donde se despacha.
 */
export function BikeRequestsPendingUnits() {
  const {
    isAllBranchesPendingUnitsView,
    pendingUnitRows,
    pendingUnitTotals,
    isLoadingPendingUnits,
    isFetchingPendingUnits,
    isErrorPendingUnits,
    refetchPendingUnits,
  } = useBikeRequestPendingUnits();

  const rowColumns: GenericTableColumn<BikeRequestPendingUnitRow>[] = useMemo(
    () => [
      {
        key: 'requestCode',
        header: 'Solicitud',
        sticky: true,
        className: 'whitespace-nowrap font-medium',
        href: (row) => ARRANCA_REQUEST_DETAIL(row.requestId),
      },
      {
        key: 'requestCreatedAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatBikeRequestDateTime(row.requestCreatedAt) || '-',
      },
      {
        key: 'requestStatus',
        header: 'Estado',
        render: (row) => <BikeRequestStatusBadge status={row.requestStatus} />,
      },
      {
        key: 'mcBranch',
        header: 'Sucursal',
        hidden: !isAllBranchesPendingUnitsView,
        className: 'whitespace-nowrap',
        render: (row) => row.mcBranch?.name || '-',
      },
      {
        key: 'product',
        header: 'Producto',
        className: 'whitespace-nowrap text-gray-900',
        render: (row) => formatBikeRequestProduct(row.product),
      },
      { key: 'color', header: 'Color' },
      {
        key: 'quantity',
        header: 'Pedidas',
        align: 'right',
        className: 'tabular-nums',
      },
      {
        key: 'deliveredQuantity',
        header: 'Entregadas',
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
        key: 'unitPrice',
        header: 'Precio Arranca',
        align: 'right',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatCurrency(toBikeRequestAmount(row.unitPrice)),
      },
      {
        key: 'remainingAmount',
        header: 'Monto',
        align: 'right',
        className: 'whitespace-nowrap font-medium tabular-nums',
        render: (row) =>
          formatCurrency(toBikeRequestAmount(row.remainingAmount)),
      },
    ],
    [isAllBranchesPendingUnitsView]
  );

  const productColumns: GenericTableColumn<BikeRequestPendingUnitsByProduct>[] =
    useMemo(
      () => [
        {
          key: 'product',
          header: 'Modelo',
          className: 'font-medium text-gray-900',
          render: (row) => formatBikeRequestProduct(row.product),
        },
        {
          key: 'remainingQuantity',
          header: 'Motos por entregar',
          align: 'right',
          className: 'tabular-nums font-semibold',
        },
        {
          key: 'remainingAmount',
          header: 'Monto',
          align: 'right',
          className: 'whitespace-nowrap tabular-nums',
          render: (row) =>
            formatCurrency(toBikeRequestAmount(row.remainingAmount)),
        },
      ],
      []
    );

  if (isErrorPendingUnits) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        No se pudieron cargar las motos por entregar.
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPendingUnits()}
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchPendingUnits()}
          disabled={isFetchingPendingUnits}
        >
          <RefreshCw
            className={cn(
              'mr-2 h-4 w-4',
              isFetchingPendingUnits && 'animate-spin'
            )}
          />
          Actualizar
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <GpsKpiCard
          label="Solicitudes abiertas"
          value={pendingUnitTotals?.requests ?? 0}
          hint="Pendientes o en progreso"
          icon={ClipboardList}
          isLoading={isLoadingPendingUnits}
        />
        <GpsKpiCard
          label="Motos por entregar"
          value={pendingUnitTotals?.remainingQuantity ?? 0}
          hint="Suma de lo que falta en cada línea"
          icon={Bike}
          tone="pending"
          isLoading={isLoadingPendingUnits}
        />
        <GpsKpiCard
          label="Monto pendiente"
          value={formatCurrency(
            toBikeRequestAmount(pendingUnitTotals?.remainingAmount)
          )}
          hint="A Precio Arranca"
          icon={DollarSign}
          isLoading={isLoadingPendingUnits}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,2.5fr)]">
        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">Por modelo</h3>
          </header>
          <div className="p-4">
            <GenericTable<BikeRequestPendingUnitsByProduct>
              columns={productColumns}
              data={pendingUnitTotals?.byProduct ?? []}
              getRowKey={(row) => row.product.id}
              isLoading={isLoadingPendingUnits}
              density="compact"
              emptyMessage="Nada por entregar."
            />
          </div>
        </section>

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          <header className="border-b border-gray-100 px-4 py-3">
            <h3 className="font-semibold text-gray-900">
              Detalle por solicitud
            </h3>
            <p className="text-xs text-gray-500">
              De la solicitud más antigua a la más nueva. Click en el código
              para despachar.
            </p>
          </header>
          <div className="p-4">
            <GenericTable<BikeRequestPendingUnitRow>
              columns={rowColumns}
              data={pendingUnitRows}
              getRowKey={(row) => `${row.requestId}-${row.lineId}`}
              isLoading={isLoadingPendingUnits}
              density="compact"
              emptyMessage="No hay motos por entregar a Arranca."
            />
          </div>
        </section>
      </div>
    </div>
  );
}
