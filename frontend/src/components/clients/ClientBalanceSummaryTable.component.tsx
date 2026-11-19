'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useClientBalanceSummary } from '@/hooks/useTransactions';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useToken } from '@/stores/auth/auth.store';
import { cn, formatDate, usdFormatCurrency } from '@/lib/utils';
import {
  ClientBalanceOrdering,
  ClientBalanceSummaryResult,
} from '@/services/transactions/types/ClientBonus.type';
import { ClientBalanceDetailModal } from './ClientBalanceDetailModal.component';

const ALL_BRANCHES = 'all';

/**
 * Tabla de todos los clientes con saldo de abono != 0, ordenable por
 * cualquier columna (asc/desc, resuelto en el backend -- no solo en la
 * página visible), con KPIs globales arriba (mismo modelo que Reporte de
 * Repuestos/Dashboard Gerencial: KpiCardMain + GenericTable). Click en una
 * fila abre el detalle de en qué órdenes depositó/usó su abono ese cliente.
 */
export function ClientBalanceSummaryTable() {
  const token = useToken();
  const { data: branches } = useAllBranches();
  const [page, setPage] = useState(1);
  const [ordering, setOrdering] = useState<ClientBalanceOrdering>('balance');
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc');
  const [branchId, setBranchId] = useState<string>(ALL_BRANCHES);
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);

  const { data, isLoading } = useClientBalanceSummary(
    token,
    page,
    '20',
    direction,
    ordering,
    branchId === ALL_BRANCHES ? undefined : branchId
  );

  const results = data?.results ?? [];
  const summary = data?.staticData;
  const totalPages = data?.totalPages ?? 1;

  const handleSort = (column: ClientBalanceOrdering) => {
    if (column === ordering) {
      setDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setOrdering(column);
      setDirection('desc');
    }
    setPage(1);
  };

  const sortableHeader = (
    column: ClientBalanceOrdering,
    label: string,
    align: 'left' | 'right' = 'left'
  ): Pick<
    GenericTableColumn<ClientBalanceSummaryResult>,
    'header' | 'headerClassName'
  > => {
    const isActive = ordering === column;
    return {
      header: (
        <button
          type="button"
          onClick={() => handleSort(column)}
          className={cn(
            'inline-flex items-center gap-1',
            align === 'right' && 'flex-row-reverse'
          )}
        >
          {label}
          {isActive ? (
            direction === 'desc' ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronUp className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
        </button>
      ),
      headerClassName: cn(
        'cursor-pointer select-none transition-colors hover:bg-gray-200',
        isActive && 'bg-blue-500/10'
      ),
    };
  };

  const columns: GenericTableColumn<ClientBalanceSummaryResult>[] = [
    {
      key: 'client',
      ...sortableHeader('client_name', 'Cliente'),
      render: (row) => (
        <div>
          <p className="font-medium">
            {row.client.firstName} {row.client.lastName}
          </p>
          <p className="text-xs text-gray-500">
            Cédula: {row.client.countryId}
          </p>
        </div>
      ),
    },
    {
      key: 'balance',
      ...sortableHeader('balance', 'Saldo Actual', 'right'),
      align: 'right',
      render: (row) => (
        <span
          className={
            row.balance >= 0
              ? 'text-green-600 font-semibold'
              : 'text-red-600 font-semibold'
          }
        >
          {usdFormatCurrency(row.balance)}
        </span>
      ),
    },
    {
      key: 'ordersCount',
      ...sortableHeader('orders_count', 'Número de Órdenes de Venta', 'right'),
      align: 'right',
      render: (row) => row.ordersCount,
    },
    {
      key: 'totalSpent',
      ...sortableHeader('total_spent', 'Gastado en la Empresa', 'right'),
      align: 'right',
      render: (row) => usdFormatCurrency(row.totalSpent),
    },
    {
      key: 'lastOrderDate',
      ...sortableHeader('last_order_date', 'Fecha de Última Orden', 'right'),
      align: 'right',
      render: (row) =>
        row.lastOrderDate ? formatDate(row.lastOrderDate) : '-',
    },
    {
      key: 'lastOrderBranch',
      ...sortableHeader('last_order_branch', 'Sede', 'right'),
      align: 'right',
      render: (row) => row.lastOrderBranch?.name ?? '-',
    },
  ];

  return (
    <div className="space-y-4">
      {summary && (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
          <KpiCardMain
            label="Total Abonado (entró)"
            value={usdFormatCurrency(summary.totalDeposited)}
            tone="green"
          />
          <KpiCardMain
            label="Total Usado (salió)"
            value={usdFormatCurrency(summary.totalUsed)}
            tone="red"
          />
          <KpiCardMain
            label="Saldo Global"
            value={usdFormatCurrency(summary.netBalance)}
            tone={summary.netBalance >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={branchId}
          onValueChange={(value) => {
            setBranchId(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Sede" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_BRANCHES}>Todas las sedes</SelectItem>
            {(branches || []).map((branch) => (
              <SelectItem key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <GenericTable<ClientBalanceSummaryResult>
        columns={columns}
        data={results}
        getRowKey={(row) => row.client.id}
        isLoading={isLoading}
        emptyMessage="No hay clientes con saldo de abono."
        onRowClick={(row) => setSelectedClientId(row.client.id)}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage,
        }}
      />

      <ClientBalanceDetailModal
        clientId={selectedClientId}
        onClose={() => setSelectedClientId(null)}
      />
    </div>
  );
}
