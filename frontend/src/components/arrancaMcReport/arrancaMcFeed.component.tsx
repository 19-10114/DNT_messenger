'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

import { ArrancaBalanceStatusBadge } from '@/components/arrancaBalance/arrancaBalanceStatusBadge.component';
import {
  ARRANCA_BALANCE_KIND_LABELS,
  ARRANCA_BALANCE_ORIGIN_LABELS,
  ARRANCA_BALANCE_STATUS_LABELS,
  getArrancaBalanceResponsibleName,
} from '@/components/arrancaBalance/arrancaBalance.utils';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useArrancaMcFeed } from '@/hooks/arrancaMcReport';
import { cn } from '@/lib/utils';
import {
  ARRANCA_BALANCE_KINDS,
  ARRANCA_BALANCE_STATUSES,
  ArrancaBalanceKind,
  ArrancaBalanceStatus,
} from '@/services/arrancaBalance/types';
import { ArrancaMcFeedRow } from '@/services/arrancaMcReport/types';
import {
  favourTextClass,
  formatDateTime,
  formatLongDay,
  formatSignedUsd,
} from './arrancaMcReport.utils';

const PAGE_SIZE_OPTIONS = [20, 50, 100];
/** Radix `Select` no admite `''` como valor de un elemento. */
const ANY = 'all';

const EMPTY = <span className="text-gray-400">—</span>;

/** Clases escritas enteras: Tailwind no emite las interpoladas. */
const KIND_CLASSES: Record<ArrancaBalanceKind, string> = {
  manual: 'border-gray-300 bg-white text-gray-700',
  cash_close: 'border-gray-900 bg-gray-50 text-gray-900',
  bike_sale: 'border-secondary bg-white text-secondary',
  bike_return: 'border-gray-400 bg-gray-50 text-gray-600',
};

function KindBadge({ kind }: { kind: ArrancaBalanceKind }) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium',
        KIND_CLASSES[kind] ?? KIND_CLASSES.manual
      )}
    >
      {ARRANCA_BALANCE_KIND_LABELS[kind] ?? kind}
    </span>
  );
}

/** Lo que identifica al movimiento más allá del concepto: el día cerrado, la moto. */
function detailLine(row: ArrancaMcFeedRow): string {
  if (row.kind === 'cash_close' && /^\d{4}-\d{2}-\d{2}$/.test(row.reference)) {
    return `Día ${formatLongDay(row.reference)}`;
  }
  // Una moto se lee por placa y modelo, no por el chasis que guarda `reference`.
  if (row.bikeLabel) return row.bikeLabel;
  if (row.reference) return row.reference;
  return row.observations || '';
}

interface ArrancaMcFeedProps {
  branchId: number;
  startDate: string;
  endDate: string;
}

/**
 * Los movimientos que afectan el balance, del más reciente al más antiguo:
 * cierres de caja, motos entregadas o devueltas, y los manuales.
 *
 * El saldo acumulado de cada fila es el balance justo después de ella, sobre
 * toda la historia de la sucursal: filtrar por tipo o estado no lo cambia.
 */
export function ArrancaMcFeed({
  branchId,
  startDate,
  endDate,
}: ArrancaMcFeedProps) {
  const [kind, setKind] = useState<string>(ANY);
  const [status, setStatus] = useState<string>(ANY);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  // Otra sucursal u otro rango es otro universo: se vuelve a la página 1.
  useEffect(() => {
    setPage(1);
  }, [branchId, startDate, endDate]);

  const {
    arrancaMcFeedRows,
    totalArrancaMcFeedRows,
    totalArrancaMcFeedPages,
    isLoadingArrancaMcFeed,
    isErrorArrancaMcFeed,
  } = useArrancaMcFeed({
    branchId,
    startDate,
    endDate,
    page,
    pageSize,
    kind: kind === ANY ? undefined : (kind as ArrancaBalanceKind),
    status: status === ANY ? undefined : (status as ArrancaBalanceStatus),
    search: search.trim() || undefined,
  });

  const columns: GenericTableColumn<ArrancaMcFeedRow>[] = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) => formatDateTime(row.createdAt),
      },
      {
        key: 'kind',
        header: 'Tipo',
        render: (row) => <KindBadge kind={row.kind} />,
      },
      {
        key: 'concept',
        header: 'Concepto',
        className: 'min-w-[14rem]',
        render: (row) => {
          const detail = detailLine(row);
          return (
            <div>
              <span className="font-medium text-gray-900">{row.concept}</span>
              {detail && (
                <p className="text-xs text-gray-500" title={detail}>
                  {detail}
                </p>
              )}
            </div>
          );
        },
      },
      {
        key: 'branch',
        header: 'Sucursal',
        // Con una sucursal elegida la columna repetiría el selector.
        hidden: branchId !== 0,
        className: 'whitespace-nowrap',
        render: (row) => row.branch?.name || 'Sin sucursal',
      },
      {
        key: 'direction',
        header: 'Sentido',
        render: (row) => (
          <span
            className="inline-flex items-center gap-1 whitespace-nowrap"
            title={
              row.direction === 'mc_to_arranca'
                ? 'Moto Candela → Arranca'
                : 'Arranca → Moto Candela'
            }
          >
            MC
            {row.direction === 'mc_to_arranca' ? (
              <ArrowRight className="h-3.5 w-3.5" />
            ) : (
              <ArrowLeft className="h-3.5 w-3.5" />
            )}
            Arranca
          </span>
        ),
      },
      {
        key: 'signedAmount',
        header: 'Monto',
        align: 'right',
        render: (row) => (
          <span
            className={cn(
              'whitespace-nowrap font-medium tabular-nums',
              row.status === 'approved'
                ? favourTextClass(row.signedAmount)
                : 'text-gray-400'
            )}
            title={
              row.status === 'approved'
                ? undefined
                : 'No mueve el balance mientras no esté aprobado'
            }
          >
            {formatSignedUsd(row.signedAmount)}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (row) => <ArrancaBalanceStatusBadge status={row.status} />,
      },
      {
        key: 'runningBalance',
        header: 'Saldo acumulado',
        align: 'right',
        render: (row) =>
          row.runningBalance === null ? (
            EMPTY
          ) : (
            <span
              className={cn(
                'whitespace-nowrap font-semibold tabular-nums',
                favourTextClass(row.runningBalance)
              )}
            >
              {formatSignedUsd(row.runningBalance)}
            </span>
          ),
      },
      {
        key: 'origin',
        header: 'Creado en',
        className: 'whitespace-nowrap',
        render: (row) => ARRANCA_BALANCE_ORIGIN_LABELS[row.origin],
      },
      {
        key: 'responsible',
        header: 'Responsable',
        render: (row) => getArrancaBalanceResponsibleName(row) || EMPTY,
      },
      {
        key: 'decidedAt',
        header: 'Decidido',
        className: 'whitespace-nowrap tabular-nums',
        render: (row) =>
          row.decidedAt ? formatDateTime(row.decidedAt) : EMPTY,
      },
    ],
    [branchId]
  );

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-100 p-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Movimientos que afectan el balance
          </h2>
          <p className="text-xs text-gray-500">
            Del más reciente al más antiguo. El saldo acumulado es el balance
            aprobado justo después de cada movimiento.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            placeholder="Concepto, placa, chasis..."
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-60"
          />
          <Select
            value={kind}
            onValueChange={(value) => {
              setKind(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-48" aria-label="Tipo">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todos los tipos</SelectItem>
              {ARRANCA_BALANCE_KINDS.map((value) => (
                <SelectItem key={value} value={value}>
                  {ARRANCA_BALANCE_KIND_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-44" aria-label="Estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Todos los estados</SelectItem>
              {ARRANCA_BALANCE_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ARRANCA_BALANCE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      <div className="p-4">
        {isErrorArrancaMcFeed ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar los movimientos.
          </p>
        ) : (
          <GenericTable<ArrancaMcFeedRow>
            columns={columns}
            data={arrancaMcFeedRows}
            isLoading={isLoadingArrancaMcFeed}
            density="compact"
            emptyMessage="No hay movimientos con estos filtros."
            pagination={{
              currentPage: page,
              totalPages: totalArrancaMcFeedPages,
              totalElements: totalArrancaMcFeedRows,
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
    </section>
  );
}
