'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, Plus, RefreshCw } from 'lucide-react';

import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { APPROVALS_NEW, APPROVAL_DETAIL } from '@/constants/routes';
import { useApprovals } from '@/hooks/approvals';
import { cn } from '@/lib/utils';
import {
  APPROVAL_STATUSES,
  Approval,
  ApprovalStatus,
} from '@/services/approvals/types';
import { ApprovalProgress } from './approvalProgress.component';
import { ApprovalStatusBadge } from './approvalStatusBadge.component';
import {
  APPROVAL_STATUS_DOT_CLASSES,
  APPROVAL_STATUS_TAB_LABELS,
  formatApprovalDate,
  formatApprovalProduct,
  getApprovalStatusCount,
} from './approvals.utils';

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const ALL = 'all';
type StatusTab = ApprovalStatus | typeof ALL;
const STATUS_TABS: StatusTab[] = [ALL, ...APPROVAL_STATUSES];

/** "K-Light ×10, RK 150 ×4" para la celda de modelos. */
function summarizeLines(approval: Approval): string {
  const totals = new Map<number, { name: string; quantity: number }>();
  approval.lines.forEach((line) => {
    const entry = totals.get(line.product.id) ?? {
      name: formatApprovalProduct(line.product),
      quantity: 0,
    };
    entry.quantity += line.quantity;
    totals.set(line.product.id, entry);
  });
  const branches = new Set(approval.lines.map((line) => line.branch.id)).size;
  const models = Array.from(totals.values())
    .map((entry) => `${entry.name} ×${entry.quantity}`)
    .join(', ');
  return branches > 1 ? `${models} · ${branches} sucursales` : models;
}

/**
 * Listado de aprobaciones de Empire cargadas por la sucursal activa (`0` =
 * todas, y entonces aparece la columna "Sucursal"). Una pestaña por estado
 * más "Todas"; los contadores respetan la búsqueda. Click en una fila → detalle.
 */
export function ApprovalsList() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<StatusTab>(ALL);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE_OPTIONS[0]);

  const {
    approvalsBranchId,
    isAllBranchesApprovalsView,
    approvals,
    approvalStatusCounts,
    totalApprovals,
    totalApprovalPages,
    isLoadingApprovals,
    isFetchingApprovals,
    isErrorApprovals,
    refetchApprovals,
  } = useApprovals({
    page,
    pageSize,
    status: activeTab === ALL ? undefined : activeTab,
    search: search.trim() || undefined,
  });

  useEffect(() => {
    setPage(1);
  }, [approvalsBranchId]);

  useEffect(() => {
    if (!isFetchingApprovals && page > totalApprovalPages) {
      setPage(totalApprovalPages);
    }
  }, [isFetchingApprovals, page, totalApprovalPages]);

  const columns: GenericTableColumn<Approval>[] = useMemo(
    () => [
      {
        key: 'number',
        header: 'Aprobación',
        sticky: true,
        className: 'whitespace-nowrap font-mono font-semibold text-gray-900',
        render: (approval) => (
          <span className="inline-flex items-center gap-1.5">
            {approval.number}
            {approval.hasDocument && (
              <FileText
                className="h-3.5 w-3.5 text-gray-400"
                aria-label="Con documento"
              />
            )}
          </span>
        ),
      },
      {
        key: 'approvalDate',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (approval) => formatApprovalDate(approval.approvalDate) || '-',
      },
      {
        key: 'branch',
        header: 'Sucursal',
        hidden: !isAllBranchesApprovalsView,
        className: 'whitespace-nowrap',
        render: (approval) => approval.branch?.name || '-',
      },
      {
        key: 'lines',
        header: 'Modelos',
        className: 'max-w-[22rem] truncate text-gray-700',
        render: (approval) => (
          <span title={summarizeLines(approval)}>
            {summarizeLines(approval)}
          </span>
        ),
      },
      {
        key: 'progress',
        header: 'Recibidas',
        width: '180px',
        render: (approval) => (
          <ApprovalProgress
            received={approval.receivedQuantity}
            requested={approval.requestedQuantity}
            status={approval.status}
          />
        ),
      },
      {
        key: 'remainingQuantity',
        header: 'Faltan',
        align: 'right',
        className: 'tabular-nums font-semibold',
        cellClassName: (approval) =>
          approval.remainingQuantity > 0 ? 'text-amber-700' : 'text-gray-400',
      },
      {
        key: 'status',
        header: 'Estado',
        render: (approval) => <ApprovalStatusBadge status={approval.status} />,
      },
    ],
    [isAllBranchesApprovalsView]
  );

  const tabLabel = (tab: StatusTab) =>
    tab === ALL ? 'Todas' : APPROVAL_STATUS_TAB_LABELS[tab];

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-100 p-4 xl:flex-row xl:items-center xl:justify-between">
        <SearchInput
          placeholder="Buscar por número, modelo, placa o chasis..."
          initialValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="w-full sm:w-80"
        />
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchApprovals()}
            disabled={isFetchingApprovals}
          >
            <RefreshCw
              className={cn(
                'mr-2 h-4 w-4',
                isFetchingApprovals && 'animate-spin'
              )}
            />
            Actualizar
          </Button>
          <Button size="sm" asChild>
            <Link href={APPROVALS_NEW}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar aprobación
            </Link>
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
                      APPROVAL_STATUS_DOT_CLASSES[tab]
                    )}
                  />
                )}
                {tabLabel(tab)}
                {approvalStatusCounts && (
                  <span className="rounded-full bg-gray-200 px-1.5 text-[11px] font-semibold tabular-nums text-gray-600 group-data-[state=active]:bg-gray-900 group-data-[state=active]:text-white">
                    {getApprovalStatusCount(approvalStatusCounts, tab)}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>

      <div className="p-4">
        {isErrorApprovals ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            No se pudieron cargar las aprobaciones. Intente con
            &quot;Actualizar&quot;.
          </p>
        ) : (
          <GenericTable<Approval>
            columns={columns}
            data={approvals}
            isLoading={isLoadingApprovals}
            density="compact"
            onRowClick={(approval) => router.push(APPROVAL_DETAIL(approval.id))}
            emptyMessage="No hay aprobaciones de Empire con estos filtros."
            pagination={{
              currentPage: page,
              totalPages: totalApprovalPages,
              totalElements: totalApprovals,
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
