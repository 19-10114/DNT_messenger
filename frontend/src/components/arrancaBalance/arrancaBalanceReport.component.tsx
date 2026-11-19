'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import {
  GenericTable,
  GenericTableAction,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useArrancaBalanceActions,
  useArrancaBalances,
} from '@/hooks/arrancaBalance';
import { cn, formatCurrency } from '@/lib/utils';
import {
  ARRANCA_BALANCE_DIRECTIONS,
  ARRANCA_BALANCE_STATUSES,
  ArrancaBalance,
  ArrancaBalanceDecision,
  ArrancaBalanceDirection,
  ArrancaBalancePayload,
  ArrancaBalanceStatus,
} from '@/services/arrancaBalance/types';
import {
  ARRANCA_BALANCE_DIRECTION_LABELS,
  ARRANCA_BALANCE_ORIGIN_LABELS,
  ARRANCA_BALANCE_STATUS_DOT_CLASSES,
  ARRANCA_BALANCE_STATUS_TAB_LABELS,
  canDecideArrancaBalance,
  canEditArrancaBalance,
  isLedgerArrancaBalance,
  formatArrancaBalanceDateTime,
  getArrancaBalanceResponsibleName,
} from './arrancaBalance.utils';
import { ArrancaBalanceFormModal } from './arrancaBalanceFormModal.component';
import { ArrancaBalanceStatusBadge } from './arrancaBalanceStatusBadge.component';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Pestaña / filtro que significa "sin filtrar". */
const ALL = 'all';

type StatusTab = ArrancaBalanceStatus | typeof ALL;

const STATUS_TABS: StatusTab[] = [ALL, ...ARRANCA_BALANCE_STATUSES];

/** Mensaje del backend si lo hay; si no, el genérico. */
function getErrorMessage(error: unknown, fallback: string): string {
  const message = (error as { response?: { data?: { message?: string } } })
    ?.response?.data?.message;
  return message || fallback;
}

interface PendingDecision {
  balance: ArrancaBalance;
  decision: ArrancaBalanceDecision;
}

/**
 * Reporte de movimientos de dinero entre Moto Candela y Arranca, acotado a la
 * sucursal activa.
 *
 * Una pestaña por estado más "Todos", paginadas en el servidor y ordenadas del
 * más reciente al más antiguo; los contadores respetan los demás filtros.
 *
 * Cada movimiento existe también en Arranca. Lo que crea Moto Candela se edita
 * acá mientras está pendiente y lo decide Arranca; lo que crea Arranca se
 * aprueba o rechaza acá. Cualquier escritura se replica en Arranca en el acto.
 */
export function ArrancaBalanceReport() {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<StatusTab>(ALL);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState<ArrancaBalanceDirection | 'all'>(
    ALL
  );
  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>(
    {}
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  /** `undefined` = modal cerrado, `null` = creando, un movimiento = editándolo. */
  const [formBalance, setFormBalance] = useState<
    ArrancaBalance | null | undefined
  >(undefined);
  const [pendingDecision, setPendingDecision] =
    useState<PendingDecision | null>(null);

  const {
    arrancaBalanceBranchId,
    isAllBranchesArrancaBalanceView,
    arrancaBalances,
    arrancaBalanceStatusCounts,
    totalArrancaBalances,
    totalArrancaBalancePages,
    isLoadingArrancaBalances,
    isFetchingArrancaBalances,
    isErrorArrancaBalances,
    refetchArrancaBalances,
  } = useArrancaBalances({
    page,
    pageSize,
    status: activeTab === ALL ? undefined : activeTab,
    direction: direction === ALL ? undefined : direction,
    search: search.trim() || undefined,
    startDate: dates.startDate,
    endDate: dates.endDate,
  });

  // Cambiar de sucursal en el selector cambia el universo: se vuelve a la página 1.
  useEffect(() => {
    setPage(1);
  }, [arrancaBalanceBranchId]);

  // Si el universo se achica (otra sucursal, una decisión que saca la fila de
  // la pestaña), la página actual puede quedar fuera de rango y verse vacía.
  useEffect(() => {
    if (!isFetchingArrancaBalances && page > totalArrancaBalancePages) {
      setPage(totalArrancaBalancePages);
    }
  }, [isFetchingArrancaBalances, page, totalArrancaBalancePages]);

  const {
    createArrancaBalance,
    updateArrancaBalance,
    decideArrancaBalance,
    isSavingArrancaBalance,
    isDecidingArrancaBalance,
  } = useArrancaBalanceActions();

  const handleSubmit = async (payload: ArrancaBalancePayload) => {
    try {
      if (formBalance) {
        await updateArrancaBalance({
          arrancaBalanceId: formBalance.id,
          payload,
        });
        toast({
          title: 'Movimiento actualizado',
          description: `El movimiento #${formBalance.id} se guardó también en Arranca.`,
        });
      } else {
        await createArrancaBalance(payload);
        // El nuevo es el más reciente: queda primero en la página 1.
        setPage(1);
        toast({
          title: 'Movimiento creado',
          description: 'Quedó pendiente de aprobación en Arranca.',
        });
      }
      setFormBalance(undefined);
    } catch (error) {
      toast({
        title: 'No se pudo guardar el movimiento',
        description: getErrorMessage(
          error,
          'No se guardó nada. Si Arranca no respondió, volvé a intentar en unos segundos.'
        ),
        variant: 'destructive',
      });
    }
  };

  const handleDecision = async () => {
    if (!pendingDecision) return;
    const { balance, decision } = pendingDecision;
    try {
      await decideArrancaBalance({ arrancaBalanceId: balance.id, decision });
      toast({
        title:
          decision === 'approved'
            ? 'Movimiento aprobado'
            : 'Movimiento rechazado',
        description: `El movimiento #${balance.id} se actualizó también en Arranca.`,
      });
      setPendingDecision(null);
    } catch (error) {
      toast({
        title: 'No se pudo registrar la decisión',
        description: getErrorMessage(
          error,
          'El movimiento sigue pendiente. Si Arranca no respondió, volvé a intentar en unos segundos.'
        ),
        variant: 'destructive',
      });
    }
  };

  const columns: GenericTableColumn<ArrancaBalance>[] = useMemo(
    () => [
      {
        key: 'id',
        header: 'ID',
        sticky: true,
        width: '72px',
        className: 'tabular-nums text-gray-500',
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (balance) =>
          formatArrancaBalanceDateTime(balance.createdAt) || '-',
      },
      {
        key: 'branch',
        header: 'Sucursal',
        // Con una sucursal activa la columna repetiría el selector.
        hidden: !isAllBranchesArrancaBalanceView,
        className: 'whitespace-nowrap',
        render: (balance) => balance.branch?.name || 'Sin sucursal',
      },
      {
        key: 'concept',
        header: 'Concepto',
        className: 'font-medium text-gray-900',
        render: (balance) => balance.concept || '-',
      },
      {
        key: 'direction',
        header: 'Sentido',
        className: 'whitespace-nowrap',
        render: (balance) =>
          ARRANCA_BALANCE_DIRECTION_LABELS[balance.direction],
      },
      {
        key: 'amount',
        header: 'Monto',
        align: 'right',
        className: 'whitespace-nowrap font-medium tabular-nums',
        render: (balance) => formatCurrency(balance.amount),
      },
      {
        key: 'status',
        header: 'Estado',
        // En una pestaña de estado la columna repetiría lo que dice la pestaña.
        hidden: activeTab !== ALL,
        render: (balance) => (
          <ArrancaBalanceStatusBadge status={balance.status} />
        ),
      },
      {
        key: 'origin',
        header: 'Creado en',
        className: 'whitespace-nowrap',
        render: (balance) => (
          <span className="flex items-center gap-1.5">
            {ARRANCA_BALANCE_ORIGIN_LABELS[balance.origin]}
            {isLedgerArrancaBalance(balance) && (
              <span
                className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500"
                title="Generado por una venta de moto: no se edita a mano, se revierte cancelando la venta."
              >
                automático
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'responsible',
        header: 'Responsable',
        render: (balance) => getArrancaBalanceResponsibleName(balance) || '-',
      },
      {
        key: 'observations',
        header: 'Observaciones',
        className: 'hidden lg:table-cell max-w-[16rem] text-gray-500',
        headerClassName: 'hidden lg:table-cell',
        render: (balance) =>
          balance.observations ? (
            <span className="line-clamp-2" title={balance.observations}>
              {balance.observations}
            </span>
          ) : (
            '-'
          ),
      },
      {
        key: 'lastModified',
        header: 'Modificado',
        align: 'right',
        className:
          'hidden md:table-cell whitespace-nowrap tabular-nums text-gray-500',
        headerClassName: 'hidden md:table-cell',
        render: (balance) =>
          formatArrancaBalanceDateTime(balance.lastModified) || '-',
      },
    ],
    [activeTab, isAllBranchesArrancaBalanceView]
  );

  const actions: GenericTableAction<ArrancaBalance>[] = [
    {
      label: 'Editar',
      icon: 'edit',
      variant: 'ghost',
      hidden: (balance) => !canEditArrancaBalance(balance),
      disabled: () => isDecidingArrancaBalance,
      onClick: (balance) => setFormBalance(balance),
    },
    {
      label: 'Aprobar',
      icon: 'check',
      variant: 'ghost',
      className: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
      hidden: (balance) => !canDecideArrancaBalance(balance),
      disabled: () => isDecidingArrancaBalance,
      onClick: (balance) =>
        setPendingDecision({ balance, decision: 'approved' }),
    },
    {
      label: 'Rechazar',
      icon: 'close',
      variant: 'ghost',
      className: 'text-red-600 hover:bg-red-50 hover:text-red-700',
      hidden: (balance) => !canDecideArrancaBalance(balance),
      disabled: () => isDecidingArrancaBalance,
      onClick: (balance) =>
        setPendingDecision({ balance, decision: 'declined' }),
    },
  ];

  const tabLabel = (tab: StatusTab) =>
    tab === ALL ? 'Todos' : ARRANCA_BALANCE_STATUS_TAB_LABELS[tab];

  const isApproving = pendingDecision?.decision === 'approved';

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-100 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            placeholder="Buscar por concepto..."
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-64"
          />
          <Select
            value={direction}
            onValueChange={(value) => {
              setDirection(value as ArrancaBalanceDirection | 'all');
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[230px]">
              <SelectValue placeholder="Sentido" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los sentidos</SelectItem>
              {ARRANCA_BALANCE_DIRECTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {ARRANCA_BALANCE_DIRECTION_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FilterDate
            onChange={(startDate, endDate) => {
              setDates({ startDate, endDate });
              setPage(1);
            }}
          />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchArrancaBalances()}
            disabled={isFetchingArrancaBalances}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isFetchingArrancaBalances && 'animate-spin'
              )}
            />
            Actualizar
          </Button>
          <Button size="sm" onClick={() => setFormBalance(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo movimiento
          </Button>
        </div>
      </header>

      <Tabs
        value={activeTab}
        onValueChange={(value) => {
          setActiveTab(value as StatusTab);
          setPage(1);
        }}
      >
        <div className="overflow-x-auto px-4 pt-4">
          <TabsList className="h-auto gap-1 bg-gray-100 p-1">
            {STATUS_TABS.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="group gap-2 rounded-md px-3 py-1.5 text-sm text-gray-500 data-[state=active]:text-gray-900"
              >
                {tab !== ALL && (
                  <span
                    aria-hidden
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      ARRANCA_BALANCE_STATUS_DOT_CLASSES[tab]
                    )}
                  />
                )}
                {tabLabel(tab)}
                {arrancaBalanceStatusCounts && (
                  <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                    {arrancaBalanceStatusCounts[tab]}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="p-4">
        {isErrorArrancaBalances ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar los movimientos. Probá con
            &quot;Actualizar&quot;.
          </p>
        ) : (
          <GenericTable<ArrancaBalance>
            columns={columns}
            data={arrancaBalances}
            actions={actions}
            actionsHeader="Acciones"
            actionsAlign="center"
            isLoading={isLoadingArrancaBalances}
            density="compact"
            emptyMessage="No hay movimientos con estos filtros."
            pagination={{
              currentPage: page,
              totalPages: totalArrancaBalancePages,
              totalElements: totalArrancaBalances,
              pageSize,
              pageSizeOptions: PAGE_SIZE_OPTIONS,
              onPageChange: setPage,
              onPageSizeChange: (nextPageSize) => {
                setPageSize(nextPageSize);
                setPage(1);
              },
            }}
          />
        )}
      </div>

      <ArrancaBalanceFormModal
        isOpen={formBalance !== undefined}
        arrancaBalance={formBalance}
        defaultBranchId={arrancaBalanceBranchId}
        isSubmitting={isSavingArrancaBalance}
        onClose={() => setFormBalance(undefined)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!pendingDecision}
        title={isApproving ? 'Aprobar movimiento' : 'Rechazar movimiento'}
        description={
          pendingDecision
            ? `${isApproving ? 'Se aprobará' : 'Se rechazará'} el movimiento #${pendingDecision.balance.id} (${pendingDecision.balance.concept}, ${formatCurrency(pendingDecision.balance.amount)}) en Moto Candela y en Arranca. La decisión es definitiva.`
            : ''
        }
        confirmLabel={isApproving ? 'Aprobar' : 'Rechazar'}
        destructive={!isApproving}
        isLoading={isDecidingArrancaBalance}
        onConfirm={handleDecision}
        onOpenChange={(open) => {
          if (!open && !isDecidingArrancaBalance) setPendingDecision(null);
        }}
      />
    </section>
  );
}
