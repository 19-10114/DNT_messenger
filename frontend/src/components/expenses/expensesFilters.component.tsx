'use client';

import { FilterDate } from '@/components/ui/filterDate.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { GetAllExpensesQueryParams } from '@/services/expenses/types/Expense.type';
import { SupplierSelect } from '@/components/suppliers/supplierSelect.component';
import { KIND_LABELS, PAYMENT_METHOD_LABELS } from './expense.utils';
import { ExpenseCategorySelect } from './expenseCategorySelect.component';

export type ExpenseFilters = Omit<
  GetAllExpensesQueryParams,
  'page' | 'pageSize'
>;

interface ExpensesFiltersProps {
  filters: ExpenseFilters;
  onChange: (filters: ExpenseFilters) => void;
  /** Los estados que ofrece la página: Gastos y Pre Gastos listan distintos. */
  statusOptions: {
    value: NonNullable<ExpenseFilters['status']>;
    label: string;
  }[];
}

/** Radix Select no admite `value=""`: "Todos" viaja como `all`. */
const ALL = 'all';

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  onChange: (value: string | undefined) => void;
}) {
  return (
    <div className="flex min-w-[160px] flex-col gap-1">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>
      <Select
        value={value ?? ALL}
        onValueChange={(next) => onChange(next === ALL ? undefined : next)}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-80">
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ExpensesFilters({
  filters,
  onChange,
  statusOptions,
}: ExpensesFiltersProps) {
  const update = (patch: Partial<ExpenseFilters>) =>
    onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">
          Fecha
        </label>
        <FilterDate
          onChange={(startDate, endDate) => update({ startDate, endDate })}
          clean
        />
      </div>
      <div className="flex min-w-[200px] flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">
          Categoría
        </label>
        <ExpenseCategorySelect
          value={filters.category ?? ''}
          onChange={(category) => update({ category: category || undefined })}
          allLabel="Todas"
        />
      </div>
      <FilterSelect
        label="Tipo"
        value={filters.kind}
        options={Object.entries(KIND_LABELS).map(([value, label]) => ({
          value,
          label,
        }))}
        onChange={(kind) =>
          update({ kind: kind as ExpenseFilters['kind'] | undefined })
        }
      />
      <FilterSelect
        label="Tipo de pago"
        value={filters.paymentMethod}
        options={[
          { value: 'cash', label: 'Descuenta caja (efectivo USD)' },
          ...Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
            value,
            label,
          })),
        ]}
        onChange={(paymentMethod) =>
          update({
            paymentMethod: paymentMethod as
              | ExpenseFilters['paymentMethod']
              | undefined,
          })
        }
      />
      <div className="flex min-w-[200px] flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">
          Proveedor
        </label>
        <SupplierSelect
          value={filters.supplier ?? ''}
          onChange={(supplier) => update({ supplier: supplier || undefined })}
        />
      </div>
      <FilterSelect
        label="Retenciones"
        value={filters.withRetentions}
        options={[{ value: 'true', label: 'Solo con retenciones' }]}
        onChange={(value) =>
          update({ withRetentions: value === 'true' ? 'true' : undefined })
        }
      />
      <div className="flex min-w-[160px] flex-col gap-1">
        <label className="text-sm font-medium text-muted-foreground">
          Estado
        </label>
        <Select
          value={filters.status ?? statusOptions[0]?.value}
          onValueChange={(status) =>
            update({ status: status as ExpenseFilters['status'] })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SearchInput
        placeholder="Buscar concepto, beneficiario, referencia, RIF, factura o GRN-123"
        initialValue={filters.search}
        onSearch={(search) => update({ search: search || undefined })}
        className="min-w-[260px]"
      />
    </div>
  );
}
