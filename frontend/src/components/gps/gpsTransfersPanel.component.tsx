'use client';

import React, { useMemo, useState } from 'react';
import { ArrowRightLeft } from 'lucide-react';

import {
  GenericTable,
  GenericTableAction,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import { useToast } from '@/components/ui/use-toast';
import { useGpsTransfers, useGpsUnitActions } from '@/hooks/gps';
import { formatDate } from '@/lib/utils';
import { GpsIncomingTransfer, GpsUnit } from '@/services/gps/types';
import { getGpsHardwareLabel, getGpsTransferRequesterName } from './gps.utils';
import { GpsStatusBadge } from './gpsStatusBadge.component';

type TransferTab = 'incoming' | 'outgoing';

/** Columnas comunes a las dos pestañas. */
function transferColumns<T extends GpsUnit>(): GenericTableColumn<T>[] {
  return [
    {
      key: 'imei',
      header: 'IMEI',
      className: 'font-medium text-gray-900 tabular-nums',
      render: (unit) => unit.imei || '-',
    },
    {
      key: 'hardware',
      header: 'Equipo',
      className: 'hidden md:table-cell',
      headerClassName: 'hidden md:table-cell',
      render: (unit) => getGpsHardwareLabel(unit) || '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (unit) => <GpsStatusBadge status={unit.status} />,
    },
    {
      key: 'from',
      header: 'Desde',
      render: (unit) => unit.transferFromBranch?.name || '-',
    },
    {
      key: 'to',
      header: 'Hacia',
      render: (unit) => unit.targetBranch?.name || '-',
    },
    {
      key: 'requestedBy',
      header: 'Enviado por',
      className: 'hidden lg:table-cell',
      headerClassName: 'hidden lg:table-cell',
      render: (unit) => getGpsTransferRequesterName(unit) || '-',
    },
    {
      key: 'requestedAt',
      header: 'Enviado',
      align: 'right',
      className: 'tabular-nums text-gray-500',
      render: (unit) => formatDate(unit.transferRequestedAt ?? '') || '-',
    },
  ];
}

/**
 * Traslados de GPS entre sucursales que esperan a la sucursal que recibe.
 *
 * Mover una unidad de una sucursal a otra cambia la sucursal en el acto, acá y
 * en Arranca, y la deja en traslado. "Por recibir" es lo que la sucursal
 * activa tiene que aceptar o rechazar; "Enviados" es lo que mandó y todavía
 * espera. Aceptar no cambia nada más; rechazar devuelve la unidad a la
 * sucursal que la envió, también en Arranca. Ninguna de las dos toca el estado.
 *
 * Solo se muestra cuando hay algo pendiente.
 */
export function GpsTransfersPanel() {
  const {
    incomingGpsTransfers,
    outgoingGpsTransfers,
    isAllBranchesGpsTransfersView,
    isLoadingGpsTransfers,
  } = useGpsTransfers();
  const { decideGpsTransfer, isDecidingGpsTransfer } = useGpsUnitActions();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<TransferTab>('incoming');
  /** Unidad esperando confirmación del rechazo; `null` = diálogo cerrado. */
  const [unitToDecline, setUnitToDecline] =
    useState<GpsIncomingTransfer | null>(null);

  const incomingColumns = useMemo(
    () => transferColumns<GpsIncomingTransfer>(),
    []
  );
  const outgoingColumns = useMemo(() => transferColumns<GpsUnit>(), []);

  const handleAccept = async (unit: GpsIncomingTransfer) => {
    try {
      await decideGpsTransfer({ gpsUnitId: unit.id, decision: 'accept' });
      toast({
        title: 'Traslado aceptado',
        description: `${unit.imei} quedó en ${unit.targetBranch?.name ?? 'esta sucursal'}.`,
      });
    } catch {
      toast({
        title: 'No se pudo aceptar el traslado',
        description: 'Actualizá la página y volvé a intentar.',
        variant: 'destructive',
      });
    }
  };

  const handleDecline = async () => {
    if (!unitToDecline) return;
    try {
      await decideGpsTransfer({
        gpsUnitId: unitToDecline.id,
        decision: 'decline',
      });
      toast({
        title: 'Traslado rechazado',
        description: `${unitToDecline.imei} volvió a ${unitToDecline.transferFromBranch?.name ?? 'la sucursal que la envió'}, también en Arranca.`,
      });
      setUnitToDecline(null);
    } catch {
      toast({
        title: 'No se pudo rechazar el traslado',
        description:
          'La unidad sigue en traslado. Si Arranca no respondió, volvé a intentar en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  const incomingActions: GenericTableAction<GpsIncomingTransfer>[] = [
    {
      label: 'Aceptar',
      icon: 'check',
      variant: 'ghost',
      className: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
      // Quien lo envió no puede decidir, ni nadie de otra sucursal: el
      // backend lo calcula por fila (`canDecide`).
      hidden: (unit) => !unit.canDecide,
      disabled: () => isDecidingGpsTransfer,
      onClick: handleAccept,
    },
    {
      label: 'Rechazar',
      icon: 'close',
      variant: 'ghost',
      className: 'text-red-600 hover:bg-red-50 hover:text-red-700',
      hidden: (unit) => !unit.canDecide,
      disabled: () => isDecidingGpsTransfer,
      onClick: setUnitToDecline,
    },
  ];

  if (
    isLoadingGpsTransfers ||
    (incomingGpsTransfers.length === 0 && outgoingGpsTransfers.length === 0)
  ) {
    return null;
  }

  const incomingLabel = isAllBranchesGpsTransfersView
    ? 'Pendientes'
    : 'Por recibir';

  return (
    <section className="rounded-xl border border-amber-200 bg-white shadow-sm">
      <header className="flex items-start gap-3 border-b border-gray-100 p-4">
        <ArrowRightLeft className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div>
          <h2 className="text-base font-semibold text-gray-900">
            Traslados entre sucursales
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            La sucursal que recibe acepta el traslado o lo rechaza. Si lo
            rechaza, la unidad vuelve a la sucursal que la envió, también en
            Arranca. El estado de la unidad no cambia.
          </p>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as TransferTab)}
      >
        <div className="px-4 pt-4">
          <TabsList className="h-auto gap-1 bg-gray-100 p-1">
            <TabsTrigger
              value="incoming"
              className="group gap-2 rounded-md px-3 py-1.5 text-sm text-gray-500 data-[state=active]:text-gray-900"
            >
              {incomingLabel}
              <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                {incomingGpsTransfers.length}
              </span>
            </TabsTrigger>
            {!isAllBranchesGpsTransfersView && (
              <TabsTrigger
                value="outgoing"
                className="group gap-2 rounded-md px-3 py-1.5 text-sm text-gray-500 data-[state=active]:text-gray-900"
              >
                Enviados
                <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                  {outgoingGpsTransfers.length}
                </span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="incoming" className="mt-0 p-4">
          <GenericTable<GpsIncomingTransfer>
            columns={incomingColumns}
            data={incomingGpsTransfers}
            actions={incomingActions}
            actionsHeader="Decisión"
            actionsAlign="center"
            density="compact"
            emptyMessage="No hay traslados por recibir."
          />
        </TabsContent>
        <TabsContent value="outgoing" className="mt-0 p-4">
          <GenericTable<GpsUnit>
            columns={outgoingColumns}
            data={outgoingGpsTransfers}
            density="compact"
            emptyMessage="No hay traslados enviados esperando respuesta."
          />
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={unitToDecline !== null}
        onOpenChange={(open) => !open && setUnitToDecline(null)}
        title="¿Rechazar este traslado?"
        description={
          <>
            La unidad {unitToDecline?.imei} vuelve a{' '}
            <strong>{unitToDecline?.transferFromBranch?.name}</strong>, acá y en
            Arranca. Su estado no cambia.
          </>
        }
        confirmLabel="Rechazar traslado"
        destructive
        isLoading={isDecidingGpsTransfer}
        onConfirm={handleDecline}
      />
    </section>
  );
}
