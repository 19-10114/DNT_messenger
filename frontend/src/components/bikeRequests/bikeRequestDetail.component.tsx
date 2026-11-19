'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  MapPin,
  RefreshCw,
  Truck,
} from 'lucide-react';

import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { ARRANCA_REQUESTS } from '@/constants/routes';
import { useBikeRequest } from '@/hooks/bikeRequests';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BikeRequestDelivery,
  BikeRequestLine,
} from '@/services/bikeRequests/types';
import { BikeRequestActorCell } from './bikeRequestActorCell.component';
import { BikeRequestDispatchDialog } from './bikeRequestDispatchDialog.component';
import { BikeRequestProgress } from './bikeRequestProgress.component';
import { BikeRequestStatusBadge } from './bikeRequestStatusBadge.component';
import {
  canDispatchBikeRequest,
  formatBikeRequestDateTime,
  formatBikeRequestProduct,
  getBikeRequestErrorStatus,
  toBikeRequestAmount,
} from './bikeRequests.utils';

interface BikeRequestDetailProps {
  bikeRequestId: number;
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums text-gray-900">
        {value}
      </dd>
    </div>
  );
}

/**
 * Ficha de una solicitud de Arranca: cabecera con estado, avance, montos y
 * actores; líneas pedidas; y entregas (las anuladas quedan como historia,
 * atenuadas). Si la solicitud sigue abierta, "Despachar motos" abre el
 * diálogo de despacho.
 */
export function BikeRequestDetail({ bikeRequestId }: BikeRequestDetailProps) {
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);

  const {
    bikeRequest,
    isLoadingBikeRequest,
    isFetchingBikeRequest,
    isErrorBikeRequest,
    bikeRequestError,
    refetchBikeRequest,
  } = useBikeRequest(bikeRequestId);

  const productByLineId = useMemo(() => {
    const map: Record<number, string> = {};
    bikeRequest?.lines.forEach((line) => {
      map[line.id] = formatBikeRequestProduct(line.product);
    });
    return map;
  }, [bikeRequest]);

  const lineColumns: GenericTableColumn<BikeRequestLine>[] = useMemo(
    () => [
      {
        key: 'product',
        header: 'Producto',
        className: 'font-medium text-gray-900',
        render: (line) => formatBikeRequestProduct(line.product),
      },
      { key: 'color', header: 'Color pedido' },
      {
        key: 'quantity',
        header: 'Cantidad',
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
        className: 'tabular-nums font-semibold',
        cellClassName: (line) =>
          line.remainingQuantity > 0 ? 'text-amber-700' : 'text-gray-400',
      },
      {
        key: 'unitPrice',
        header: 'Precio Arranca',
        align: 'right',
        className: 'whitespace-nowrap tabular-nums',
        render: (line) => formatCurrency(toBikeRequestAmount(line.unitPrice)),
      },
      {
        key: 'lineTotal',
        header: 'Total',
        align: 'right',
        className: 'whitespace-nowrap font-medium tabular-nums',
        render: (line) => formatCurrency(toBikeRequestAmount(line.lineTotal)),
      },
    ],
    []
  );

  const deliveryColumns: GenericTableColumn<BikeRequestDelivery>[] = useMemo(
    () => [
      {
        key: 'plate',
        header: 'Placa',
        className: 'whitespace-nowrap font-semibold text-gray-900',
        render: (delivery) => (
          <span className="flex items-center gap-1.5">
            <span className={cn(delivery.undoneAt && 'line-through')}>
              {delivery.plate || 'Sin placa'}
            </span>
            {delivery.undoneAt && (
              <span
                className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 no-underline"
                title={`Anulada el ${formatBikeRequestDateTime(delivery.undoneAt)}: se revirtió la venta y no cuenta como entregada.`}
              >
                Anulada
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'product',
        header: 'Modelo',
        className: 'whitespace-nowrap',
        render: (delivery) => productByLineId[delivery.lineId] || '-',
      },
      { key: 'color', header: 'Color' },
      {
        key: 'chassis',
        header: 'Chasis',
        className: 'font-mono text-xs',
      },
      {
        key: 'mcBranch',
        header: 'Ubicación',
        className: 'whitespace-nowrap',
        render: (delivery) => delivery.mcBranch?.name || '-',
      },
      {
        key: 'deliveredAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (delivery) =>
          formatBikeRequestDateTime(delivery.deliveredAt) || '-',
      },
      {
        key: 'deliveredBy',
        header: 'Entregada por',
        render: (delivery) => delivery.deliveredBy || '-',
      },
    ],
    [productByLineId]
  );

  if (isLoadingBikeRequest) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (isErrorBikeRequest || !bikeRequest) {
    const isNotFound =
      getBikeRequestErrorStatus(bikeRequestError) === 404 || !bikeRequestError;
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>
          {isNotFound
            ? 'No se encontró esta solicitud.'
            : 'No se pudo cargar la solicitud.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={ARRANCA_REQUESTS}>Volver a solicitudes</Link>
          </Button>
          {!isNotFound && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchBikeRequest()}
            >
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const deliveries = bikeRequest.deliveries ?? [];
  const activeDeliveries = deliveries.filter((delivery) => !delivery.undoneAt);
  const canDispatch = canDispatchBikeRequest(bikeRequest.status);
  const remaining = Math.max(
    bikeRequest.requestedQuantity - bikeRequest.deliveredQuantity,
    0
  );
  const percentage = Math.round((bikeRequest.progress || 0) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={ARRANCA_REQUESTS}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a solicitudes
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchBikeRequest()}
          disabled={isFetchingBikeRequest}
        >
          <RefreshCw
            className={cn(
              'mr-2 h-4 w-4',
              isFetchingBikeRequest && 'animate-spin'
            )}
          />
          Actualizar
        </Button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight text-gray-900">
                {bikeRequest.code}
              </h2>
              <BikeRequestStatusBadge status={bikeRequest.status} />
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-4 w-4" aria-hidden />
              {bikeRequest.mcBranch?.name || 'Sin sucursal'}
            </p>
          </div>

          {canDispatch && (
            <Button
              size="lg"
              className="w-full gap-2 px-6 text-base lg:w-auto"
              onClick={() => setIsDispatchOpen(true)}
            >
              <Truck className="h-5 w-5" aria-hidden />
              Despachar motos
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-sm tabular-nums">
                faltan {remaining}
              </span>
            </Button>
          )}
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-gray-700">
              {bikeRequest.deliveredQuantity} de {bikeRequest.requestedQuantity}{' '}
              motos entregadas
            </span>
            <span className="tabular-nums text-gray-500">{percentage}%</span>
          </div>
          <BikeRequestProgress
            delivered={bikeRequest.deliveredQuantity}
            requested={bikeRequest.requestedQuantity}
            status={bikeRequest.status}
            size="lg"
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Motos pedidas" value={bikeRequest.requestedQuantity} />
          <Stat
            label="Motos entregadas"
            value={bikeRequest.deliveredQuantity}
          />
          <Stat
            label="Monto total"
            value={formatCurrency(toBikeRequestAmount(bikeRequest.totalAmount))}
          />
          <Stat
            label="Monto entregado"
            value={formatCurrency(
              toBikeRequestAmount(bikeRequest.deliveredAmount)
            )}
          />
        </dl>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="mb-1 text-xs text-gray-500">Creada por</dt>
            <dd>
              <BikeRequestActorCell
                actor={bikeRequest.createdBy}
                date={bikeRequest.createdAt}
              />
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-gray-500">Última actualización</dt>
            <dd>
              <BikeRequestActorCell
                actor={bikeRequest.updatedBy}
                date={bikeRequest.lastModified}
              />
            </dd>
          </div>
          {bikeRequest.completedAt && (
            <div>
              <dt className="mb-1 text-xs text-gray-500">Completada</dt>
              <dd className="tabular-nums text-gray-900">
                {formatBikeRequestDateTime(bikeRequest.completedAt)}
              </dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="mb-1 text-xs text-gray-500">Observaciones</dt>
            <dd className="whitespace-pre-line text-gray-900">
              {bikeRequest.observations || (
                <span className="text-gray-400">Sin observaciones</span>
              )}
            </dd>
          </div>
        </dl>

        {bikeRequest.status === 'cancelled' && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <Ban
              className="mt-0.5 h-4 w-4 shrink-0 text-gray-500"
              aria-hidden
            />
            <div>
              <p className="font-medium">
                Arranca canceló esta solicitud
                {bikeRequest.cancelledAt &&
                  ` el ${formatBikeRequestDateTime(bikeRequest.cancelledAt)}`}
                .
              </p>
              <p className="mt-0.5 text-gray-600">
                {bikeRequest.cancelReason
                  ? `Motivo: ${bikeRequest.cancelReason}`
                  : 'Sin motivo indicado.'}{' '}
                Las motos ya entregadas siguen entregadas; lo que faltaba no se
                despacha.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Motos pedidas</h3>
        </header>
        <div className="p-4">
          <GenericTable<BikeRequestLine>
            columns={lineColumns}
            data={bikeRequest.lines}
            density="compact"
            emptyMessage="La solicitud no tiene líneas."
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Motos entregadas</h3>
          <span className="text-xs text-gray-500">
            {activeDeliveries.length}{' '}
            {activeDeliveries.length === 1 ? 'entrega' : 'entregas'}
            {deliveries.length > activeDeliveries.length &&
              ` · ${deliveries.length - activeDeliveries.length} anulada(s)`}
          </span>
        </header>
        <div className="p-4">
          {deliveries.length === 0 && canDispatch ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center text-sm text-gray-500">
              <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden />
              Todavía no se entregó ninguna moto de esta solicitud.
              <Button size="sm" onClick={() => setIsDispatchOpen(true)}>
                <Truck className="mr-2 h-4 w-4" aria-hidden />
                Despachar motos
              </Button>
            </div>
          ) : (
            <GenericTable<BikeRequestDelivery>
              columns={deliveryColumns}
              data={deliveries}
              density="compact"
              rowClassName={(delivery) =>
                delivery.undoneAt ? 'text-gray-400 opacity-60' : undefined
              }
              emptyMessage="No se entregó ninguna moto."
            />
          )}
        </div>
      </section>

      {canDispatch && (
        <BikeRequestDispatchDialog
          open={isDispatchOpen}
          onOpenChange={setIsDispatchOpen}
          bikeRequest={bikeRequest}
        />
      )}
    </div>
  );
}
