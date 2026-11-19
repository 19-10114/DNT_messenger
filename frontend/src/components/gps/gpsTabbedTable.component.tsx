'use client';

import React, { useEffect, useMemo, useState } from 'react';

import {
  GenericTable,
  GenericTableAction,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import { cn, formatDate } from '@/lib/utils';
import { BranchItem } from '@/services/branches/types/Branch.type';
import { GpsUnit } from '@/services/gps/types';
import {
  getGpsHardwareLabel,
  getGpsResponsibleName,
  isGpsUnitInTransfer,
  isGpsUnitPending,
} from './gps.utils';
import { GpsBranchCell } from './gpsBranchCell.component';
import { GpsStatusBadge } from './gpsStatusBadge.component';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

export interface GpsTableTab {
  /** Id de la pestaña; también la clave de React. */
  key: string;
  label: string;
  /** Filas ya filtradas que muestra la pestaña. */
  units: GpsUnit[];
  /** Punto de color a la izquierda de la etiqueta (mismo código que la pastilla). */
  dotClassName?: string;
  emptyMessage?: string;
}

interface GpsTabbedTableProps {
  title: string;
  description?: string;
  tabs: GpsTableTab[];
  isLoading?: boolean;
  /** Oculta la columna "Estado" cuando la pestaña activa ya lo dice. */
  hideStatusColumn?: boolean;
  /** Lado derecho de la cabecera de la tarjeta (búsqueda, filtros, acciones). */
  toolbar?: React.ReactNode;
  /** Aprobar la unidad: la deja `available` en MC y `on_branch` en Arranca. */
  onApprove?: (unit: GpsUnit) => void;
  /** Rechazar la unidad: la borra. Quien lo reciba debe pedir confirmación. */
  onReject?: (unit: GpsUnit) => void;
  /** Sucursales MC a las que se puede mover una unidad desde la celda "Sucursal". */
  branches?: BranchItem[];
  /** Cambiar la sucursal de una unidad. Sin esto la celda es solo texto. */
  onBranchChange?: (unit: GpsUnit, targetBranch: number) => void;
  /** Unidad cuyo cambio de sucursal está viajando ahora mismo. */
  savingBranchUnitId?: number | null;
  /** Bloquea las acciones de fila mientras una está viajando. */
  isReviewing?: boolean;
}

/**
 * Tarjeta de tabla con pestañas para las unidades GPS.
 *
 * Las pestañas son cortes del mismo universo (disponibilidad en una tabla,
 * estado en la otra), así que cambiar de pestaña solo reparte filas que ya
 * están en memoria: no hay request ni salto de la tabla. La paginación es de
 * cliente y vuelve a la página 1 cada vez que cambia la pestaña o el filtro.
 */
export function GpsTabbedTable({
  title,
  description,
  tabs,
  isLoading = false,
  hideStatusColumn = false,
  toolbar,
  onApprove,
  onReject,
  branches,
  onBranchChange,
  savingBranchUnitId = null,
  isReviewing = false,
}: GpsTabbedTableProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? '');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const currentTab = tabs.find((tab) => tab.key === activeTab) ?? tabs[0];
  const units = useMemo(() => currentTab?.units ?? [], [currentTab]);
  const totalPages = Math.max(Math.ceil(units.length / pageSize), 1);

  // Filtrar por fuera puede dejar la página actual más allá del final; en ese
  // caso la tabla se vería vacía con datos disponibles.
  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  const visibleUnits = useMemo(
    () => units.slice((page - 1) * pageSize, page * pageSize),
    [units, page, pageSize]
  );

  const columns: GenericTableColumn<GpsUnit>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'ID',
        // La única columna fija: `GenericTable` ancla las sticky en `left-0`,
        // así que solo la primera puede serlo.
        sticky: true,
        width: '72px',
        className: 'tabular-nums text-gray-500',
      },
      {
        key: 'imei',
        header: 'IMEI',
        className: 'font-medium text-gray-900 tabular-nums',
        render: (unit) => unit.imei || '-',
      },
      {
        key: 'number',
        header: 'Línea',
        className: 'tabular-nums',
        render: (unit) => unit.number || '-',
      },
      {
        key: 'hardware',
        header: 'Equipo',
        render: (unit) => getGpsHardwareLabel(unit) || '-',
      },
      {
        key: 'status',
        header: 'Estado',
        hidden: hideStatusColumn,
        render: (unit) => <GpsStatusBadge status={unit.status} />,
      },
      {
        key: 'responsible',
        header: 'Responsable',
        render: (unit) => getGpsResponsibleName(unit) || '-',
      },
      {
        key: 'targetBranch',
        header: 'Sucursal',
        width: '11rem',
        render: (unit) =>
          onBranchChange ? (
            <GpsBranchCell
              unit={unit}
              branches={branches ?? []}
              onChange={onBranchChange}
              isSaving={savingBranchUnitId === unit.id}
              disabled={isReviewing && savingBranchUnitId !== unit.id}
            />
          ) : (
            unit.targetBranch?.name || '-'
          ),
      },
      {
        key: 'originBranch',
        header: 'Origen',
        className: 'hidden lg:table-cell',
        headerClassName: 'hidden lg:table-cell',
        render: (unit) => unit.originBranch || '-',
      },
      {
        key: 'lastUpdated',
        header: 'Actualizado',
        align: 'right',
        className: 'hidden md:table-cell tabular-nums text-gray-500',
        headerClassName: 'hidden md:table-cell',
        render: (unit) => formatDate(unit.lastUpdated) || '-',
      },
    ],
    [
      hideStatusColumn,
      branches,
      onBranchChange,
      savingBranchUnitId,
      isReviewing,
    ]
  );

  const actions: GenericTableAction<GpsUnit>[] | undefined =
    onApprove && onReject
      ? [
          {
            // Solo las unidades `pending` se revisan, y no es solo una regla de
            // pantalla: `pending` -> `available` es la única transición que el
            // backend replica en Arranca como `on_branch`. Aprobar cualquier
            // otro estado dejaría MC en `available` sin avisarle a Arranca, y
            // los dos registros quedarían diciendo cosas distintas.
            label: 'Aprobar',
            icon: 'check',
            variant: 'ghost',
            className:
              'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
            hidden: (unit) => !isGpsUnitPending(unit),
            disabled: () => isReviewing,
            onClick: onApprove,
          },
          {
            // Rechazar borra la unidad; una en traslado espera primero la
            // decisión de la sucursal que recibe (el backend responde 409).
            label: 'Rechazar',
            icon: 'close',
            variant: 'ghost',
            className: 'text-red-600 hover:bg-red-50 hover:text-red-700',
            hidden: (unit) =>
              !isGpsUnitPending(unit) || isGpsUnitInTransfer(unit),
            disabled: () => isReviewing,
            onClick: onReject,
          },
        ]
      : undefined;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-gray-100 p-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && (
            <p className="mt-0.5 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {toolbar && <div className="shrink-0">{toolbar}</div>}
      </header>

      <Tabs
        value={currentTab?.key ?? ''}
        onValueChange={(value) => {
          setActiveTab(value);
          setPage(1);
        }}
      >
        <div className="overflow-x-auto px-4 pt-4">
          <TabsList className="h-auto gap-1 bg-gray-100 p-1">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.key}
                value={tab.key}
                className="group gap-2 rounded-md px-3 py-1.5 text-sm text-gray-500 data-[state=active]:text-gray-900"
              >
                {tab.dotClassName && (
                  <span
                    aria-hidden
                    className={cn('h-1.5 w-1.5 rounded-full', tab.dotClassName)}
                  />
                )}
                {tab.label}
                <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                  {tab.units.length}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key} className="mt-0 p-4">
            <GenericTable<GpsUnit>
              columns={columns}
              data={tab.key === currentTab?.key ? visibleUnits : []}
              actions={actions}
              actionsHeader="Revisión"
              actionsAlign="center"
              isLoading={isLoading}
              density="compact"
              emptyMessage={
                tab.emptyMessage ?? 'No hay unidades en esta vista.'
              }
              pagination={{
                currentPage: page,
                totalPages,
                totalElements: tab.units.length,
                pageSize,
                pageSizeOptions: PAGE_SIZE_OPTIONS,
                onPageChange: setPage,
                onPageSizeChange: (nextPageSize) => {
                  setPageSize(nextPageSize);
                  setPage(1);
                },
              }}
            />
          </TabsContent>
        ))}
      </Tabs>
    </section>
  );
}
