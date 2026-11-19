'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';

import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { ARRANCA_REQUEST_DETAIL } from '@/constants/routes';
import { useBikeRequests } from '@/hooks/bikeRequests';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BIKE_REQUEST_STATUSES,
  BikeRequest,
  BikeRequestStatus,
} from '@/services/bikeRequests/types';
import { BikeRequestActorCell } from './bikeRequestActorCell.component';
import { BikeRequestProgress } from './bikeRequestProgress.component';
import { BikeRequestStatusBadge } from './bikeRequestStatusBadge.component';
import {
  BIKE_REQUEST_STATUS_DOT_CLASSES,
  BIKE_REQUEST_STATUS_TAB_LABELS,
  formatBikeRequestDateTime,
  getBikeRequestStatusCount,
  toBikeRequestAmount,
} from './bikeRequests.utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50];

/** Pestaña que significa "sin filtrar". */
const ALL = 'all';

type StatusTab = BikeRequestStatus | typeof ALL;

const STATUS_TABS: StatusTab[] = [ALL, ...BIKE_REQUEST_STATUSES];

/**
 * Listado de solicitudes de motos de Arranca, acotado a la sucursal activa
 * (`0` = todas, y entonces aparece la columna "Sucursal").
 *
 * Una pestaña por estado más "Todas", paginadas en el servidor; los
 * contadores respetan los demás filtros. Click en una fila → detalle, que es
 * donde se despacha.
 */
export function BikeRequestsList() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<StatusTab>(ALL);
  const [search, setSearch] = useState('');
  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>(
    {}
  );
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const {
    bikeRequestsBranchId,
    isAllBranchesBikeRequestsView,
    bikeRequests,
    bikeRequestStatusCounts,
    totalBikeRequests,
    totalBikeRequestPages,
    isLoadingBikeRequests,
    isFetchingBikeRequests,
    isErrorBikeRequests,
    refetchBikeRequests,
  } = useBikeRequests({
    page,
    pageSize,
    status: activeTab === ALL ? undefined : activeTab,
    search: search.trim() || undefined,
    startDate: dates.startDate,
    endDate: dates.endDate,
  });

  // Otra sucursal es otro universo: se vuelve a la página 1.
  useEffect(() => {
    setPage(1);
  }, [bikeRequestsBranchId]);

  // Si el universo se achica la página actual puede quedar fuera de rango.
  useEffect(() => {
    if (!isFetchingBikeRequests && page > totalBikeRequestPages) {
      setPage(totalBikeRequestPages);
    }
  }, [isFetchingBikeRequests, page, totalBikeRequestPages]);

  const columns: GenericTableColumn<BikeRequest>[] = useMemo(
    () => [
      {
        key: 'code',
        header: 'Código',
        sticky: true,
        className: 'whitespace-nowrap font-medium text-gray-900',
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (request) =>
          formatBikeRequestDateTime(request.createdAt) || '-',
      },
      {
        key: 'mcBranch',
        header: 'Sucursal',
        // Con una sucursal activa la columna repetiría el selector.
        hidden: !isAllBranchesBikeRequestsView,
        className: 'whitespace-nowrap',
        render: (request) => request.mcBranch?.name || '-',
      },
      {
        key: 'progress',
        header: 'Motos',
        width: '180px',
        render: (request) => (
          <BikeRequestProgress
            delivered={request.deliveredQuantity}
            requested={request.requestedQuantity}
            status={request.status}
          />
        ),
      },
      {
        key: 'totalAmount',
        header: 'Monto',
        align: 'right',
        className: 'whitespace-nowrap font-medium tabular-nums',
        render: (request) =>
          formatCurrency(toBikeRequestAmount(request.totalAmount)),
      },
      {
        key: 'status',
        header: 'Estado',
        render: (request) => <BikeRequestStatusBadge status={request.status} />,
      },
      {
        key: 'createdBy',
        header: 'Creada por',
        render: (request) => (
          <BikeRequestActorCell
            actor={request.createdBy}
            date={request.createdAt}
          />
        ),
      },
      {
        key: 'updatedBy',
        header: 'Última actualización',
        className: 'hidden md:table-cell',
        headerClassName: 'hidden md:table-cell',
        render: (request) => (
          <BikeRequestActorCell
            actor={request.updatedBy}
            date={request.lastModified}
          />
        ),
      },
    ],
    [isAllBranchesBikeRequestsView]
  );

  const tabLabel = (tab: StatusTab) =>
    tab === ALL ? 'Todas' : BIKE_REQUEST_STATUS_TAB_LABELS[tab];

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-100 p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <SearchInput
            placeholder="Buscar por código, modelo, placa o chasis..."
            initialValue={search}
            onSearch={(value) => {
              setSearch(value);
              setPage(1);
            }}
            className="w-full sm:w-80"
          />
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
            onClick={() => refetchBikeRequests()}
            disabled={isFetchingBikeRequests}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isFetchingBikeRequests && 'animate-spin'
              )}
            />
            Actualizar
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
                      BIKE_REQUEST_STATUS_DOT_CLASSES[tab]
                    )}
                  />
                )}
                {tabLabel(tab)}
                {bikeRequestStatusCounts && (
                  <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                    {getBikeRequestStatusCount(bikeRequestStatusCounts, tab)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="p-4">
        {isErrorBikeRequests ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar las solicitudes. Intente con
            &quot;Actualizar&quot;.
          </p>
        ) : (
          <GenericTable<BikeRequest>
            columns={columns}
            data={bikeRequests}
            isLoading={isLoadingBikeRequests}
            density="compact"
            onRowClick={(request) =>
              router.push(ARRANCA_REQUEST_DETAIL(request.id))
            }
            emptyMessage="No hay solicitudes de Arranca con estos filtros."
            pagination={{
              currentPage: page,
              totalPages: totalBikeRequestPages,
              totalElements: totalBikeRequests,
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
