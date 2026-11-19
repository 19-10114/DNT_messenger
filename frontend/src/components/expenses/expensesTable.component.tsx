'use client';

import {
  GenericTable,
  GenericTableColumn,
  GenericTablePagination,
} from '@/components/tables/genericTable.component';
import { Badge } from '@/components/ui/badge.component';
import { cn, usdFormatCurrency } from '@/lib/utils';
import {
  Expense,
  ExpenseRateSource,
} from '@/services/expenses/types/Expense.type';
import {
  KIND_LABELS,
  PAYMENT_METHOD_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  amountUsdAt,
  formatExpenseAmount,
  formatExpenseDate,
  formatExpenseDateTime,
  userDisplayName,
} from './expense.utils';

interface ExpensesTableProps {
  expenses: Expense[];
  isLoading?: boolean;
  showBranch?: boolean;
  /** Mostrar la columna USD a esta tasa del día en vez de la registrada. */
  rateSource?: ExpenseRateSource;
  pagination: GenericTablePagination;
  onView: (expense: Expense) => void;
}

export function ExpensesTable({
  expenses,
  isLoading,
  showBranch,
  rateSource,
  pagination,
  onView,
}: ExpensesTableProps) {
  const columns: GenericTableColumn<Expense>[] = [
    {
      key: 'displayCode',
      header: 'ID',
      width: '90px',
      onCellClick: (row) => onView(row),
    },
    {
      key: 'expenseDate',
      header: 'Fecha',
      render: (row) => formatExpenseDate(row.expenseDate),
      width: '100px',
    },
    {
      key: 'branch',
      header: 'Sucursal',
      render: (row) => row.branch.name,
      hidden: !showBranch,
    },
    {
      key: 'category',
      header: 'Categoría',
      render: (row) => (
        <div className="flex flex-col">
          <span>
            {row.category.name}
            {row.lines.length > 1 && (
              <span className="ml-1 text-xs text-muted-foreground">
                +{row.lines.length - 1} más
              </span>
            )}
          </span>
          {row.category.kind !== 'gasto' && (
            <span className="text-xs text-amber-700">
              {KIND_LABELS[row.category.kind]}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'concept',
      header: 'Concepto',
      onCellClick: (row) => onView(row),
    },
    {
      key: 'beneficiary',
      header: 'Beneficiario',
      render: (row) => row.beneficiary || '-',
    },
    {
      key: 'amount',
      header: 'Monto',
      align: 'right',
      render: (row) =>
        row.invoice?.retainedTotal ? (
          <div
            className="flex flex-col items-end"
            title="Lo retenido se le paga al SENIAT; el monto es lo que se le pagó al proveedor"
          >
            <span>{formatExpenseAmount(row.amount, row.currency)}</span>
            <span className="text-xs text-amber-700">
              Retenido{' '}
              {formatExpenseAmount(row.invoice.retainedTotal, row.currency)}
            </span>
          </div>
        ) : (
          formatExpenseAmount(row.amount, row.currency)
        ),
    },
    {
      key: 'amountUsd',
      header: rateSource ? 'USD (tasa del día)' : 'USD',
      align: 'right',
      render: (row) => {
        if (!rateSource) return usdFormatCurrency(row.amountUsd);
        const converted = amountUsdAt(row, row.amount, rateSource);
        return converted === null ? (
          <span title="Ese día no tiene esa tasa guardada">Sin tasa</span>
        ) : (
          usdFormatCurrency(converted)
        );
      },
    },
    {
      key: 'paymentMethod',
      header: 'Tipo de pago',
      render: (row) => (
        <div className="flex flex-col">
          <span>{PAYMENT_METHOD_LABELS[row.paymentMethod]}</span>
          {row.excludedFromCash && (
            <span className="text-xs text-amber-700">No descuenta caja</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (row) => (
        <Badge
          variant="outline"
          className={cn('whitespace-nowrap', STATUS_BADGE_CLASSES[row.status])}
        >
          {row.status === 'pending_approval'
            ? 'Pendiente'
            : STATUS_LABELS[row.status]}
        </Badge>
      ),
    },
    {
      key: 'createdBy',
      header: 'Registrado por',
      render: (row) => (
        <div className="flex flex-col">
          <span>{userDisplayName(row.createdBy)}</span>
          <span className="text-xs text-muted-foreground">
            {formatExpenseDateTime(row.createdAt)}
          </span>
        </div>
      ),
    },
  ];

  return (
    <GenericTable<Expense>
      columns={columns}
      data={expenses}
      isLoading={isLoading}
      emptyMessage="No hay gastos con estos filtros."
      actions={[{ label: 'Ver', icon: 'view', onClick: (row) => onView(row) }]}
      rowClassName={(row) =>
        row.status === 'cancelled' || row.status === 'rejected'
          ? 'opacity-60 line-through'
          : undefined
      }
      pagination={pagination}
    />
  );
}
