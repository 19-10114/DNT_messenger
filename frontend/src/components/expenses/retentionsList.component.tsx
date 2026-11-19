'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { Button } from '@/components/ui/button.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { SupplierSelect } from '@/components/suppliers/supplierSelect.component';
import { useAllBranches } from '@/hooks';
import { useRetentions, useRetentionsExport } from '@/hooks/expenses';
import { formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import {
  GetRetentionsQueryParams,
  RetentionLine,
  RetentionLineType,
} from '@/services/expenses/types/Expense.type';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { ExpenseDetailModal } from './expenseDetailModal.component';
import { exportRetentionsToXLSX } from './exportRetentions';
import {
  LINE_TYPE_LABELS,
  formatExpenseAmount,
  formatExpenseDate,
} from './expense.utils';
import { currentFortnight } from './retention.utils';

const ALL = 'all';

/**
 * Retenciones: lo que se le retuvo a cada proveedor (IVA e ISLR) en los gastos
 * aprobados de la sucursal activa. Fechas con el mismo filtro que el resto de
 * pantallas, más el preset quincenal (así se declara), y empieza en la
 * quincena en curso. Es deuda
 * con el SENIAT: el Excel trae las columnas de la declaración. Lee las mismas
 * líneas de los gastos; un gasto anulado o pendiente no retuvo nada.
 */
export function RetentionsList() {
  const { toast } = useToast();
  const currentBranchId = useCurrentBranchId();
  const branchId =
    currentBranchId !== undefined && currentBranchId !== null
      ? String(currentBranchId)
      : undefined;
  const { data: branches = [] } = useAllBranches();

  // La quincena en curso: la misma que FilterDate aplica al montar con
  // `initialPreset="15D"`, para no pedir primero sin fechas.
  const [dates, setDates] = useState<{ startDate?: string; endDate?: string }>(
    currentFortnight
  );
  const [type, setType] = useState<RetentionLineType>();
  const [supplier, setSupplier] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedExpenseId, setSelectedExpenseId] = useState<number>();

  const filters: Omit<GetRetentionsQueryParams, 'page' | 'pageSize'> = {
    startDate: dates.startDate,
    endDate: dates.endDate,
    type,
    supplier: supplier || undefined,
    search: search || undefined,
  };
  const { retentions, totals, pagination, isLoading, isFetching, isError } =
    useRetentions(branchId, {
      ...filters,
      page: String(page),
      pageSize: String(pageSize),
    });
  const { fetchForExport, isExporting } = useRetentionsExport(
    branchId,
    filters
  );

  const branchName =
    branchId === '0'
      ? 'Todas las sucursales'
      : (branches.find((branch) => String(branch.id) === branchId)?.name ??
        `Sucursal ${branchId}`);

  const handleExport = async () => {
    try {
      const all = await fetchForExport();
      if (all.length === 0) {
        toast({ title: 'No hay retenciones para exportar con estos filtros' });
        return;
      }
      exportRetentionsToXLSX(all, branchName, filters);
    } catch {
      toast({
        title: 'No se pudo exportar',
        description: 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const columns: GenericTableColumn<RetentionLine>[] = [
    {
      key: 'expenseDate',
      header: 'Fecha',
      width: '100px',
      render: (row) => formatExpenseDate(row.expense.expenseDate),
    },
    {
      key: 'expense',
      header: 'Gasto',
      width: '90px',
      render: (row) => row.expense.displayCode,
      onCellClick: (row) => setSelectedExpenseId(row.expense.id),
    },
    {
      key: 'branch',
      header: 'Sucursal',
      render: (row) => row.expense.branch.name,
      hidden: branchId !== '0',
    },
    {
      key: 'supplier',
      header: 'Proveedor',
      render: (row) => (
        <div className="flex flex-col">
          <span>{row.supplier?.name ?? '-'}</span>
          <span className="text-xs text-muted-foreground">
            {row.supplier?.rif}
          </span>
        </div>
      ),
    },
    {
      key: 'invoice',
      header: 'Factura',
      render: (row) => (
        <div className="flex flex-col">
          <span>{row.expense.invoiceNumber || '-'}</span>
          {row.expense.controlNumber && (
            <span className="text-xs text-muted-foreground">
              Control {row.expense.controlNumber}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'lineType',
      header: 'Tipo',
      render: (row) => LINE_TYPE_LABELS[row.lineType],
    },
    {
      key: 'baseAmount',
      header: 'Sobre',
      align: 'right',
      render: (row) => (
        <div className="flex flex-col items-end">
          <span>
            {formatExpenseAmount(row.baseAmount, row.expense.currency)}
          </span>
          <span className="text-xs text-muted-foreground">
            {row.lineType === 'ret_iva'
              ? 'IVA de la factura'
              : 'Base imponible'}
          </span>
        </div>
      ),
    },
    {
      key: 'rateApplied',
      header: '%',
      align: 'right',
      width: '70px',
      render: (row) => `${row.rateApplied} %`,
    },
    {
      key: 'amount',
      header: 'Retenido',
      align: 'right',
      render: (row) => formatExpenseAmount(row.amount, row.expense.currency),
    },
    {
      key: 'amountBs',
      header: 'Retenido Bs',
      align: 'right',
      render: (row) => formatCurrencyBolivares(row.amountBs),
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || !pagination.totalElements}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar a Excel'}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCardMain
          label="Retenido IVA (Bs)"
          value={formatCurrencyBolivares(totals?.retainedIvaBs ?? 0)}
          subtitle={`≈ ${usdFormatCurrency(totals?.retainedIvaUsd ?? 0)}`}
          tone="brown"
        />
        <KpiCardMain
          label="Retenido ISLR (Bs)"
          value={formatCurrencyBolivares(totals?.retainedIslrBs ?? 0)}
          subtitle={`≈ ${usdFormatCurrency(totals?.retainedIslrUsd ?? 0)}`}
          tone="brown"
        />
        <KpiCardMain
          label="Total a enterar al SENIAT (Bs)"
          value={formatCurrencyBolivares(totals?.retainedTotalBs ?? 0)}
          subtitle={`≈ ${usdFormatCurrency(totals?.retainedTotalUsd ?? 0)}`}
          tone="red"
        />
        <KpiCardMain
          label="Retenciones"
          value={String(totals?.count ?? 0)}
          subtitle="Con los filtros aplicados"
        />
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Fecha
          </label>
          <FilterDate
            fortnightly
            initialPreset="15D"
            clean
            onChange={(startDate, endDate) => {
              setDates({ startDate, endDate });
              setPage(1);
            }}
          />
        </div>
        <div className="flex min-w-[160px] flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Tipo
          </label>
          <Select
            value={type ?? ALL}
            onValueChange={(value) => {
              setType(value === ALL ? undefined : (value as RetentionLineType));
              setPage(1);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>IVA e ISLR</SelectItem>
              <SelectItem value="ret_iva">Retención IVA</SelectItem>
              <SelectItem value="ret_islr">Retención ISLR</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex min-w-[220px] flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">
            Proveedor
          </label>
          <SupplierSelect
            value={supplier}
            onChange={(value) => {
              setSupplier(value);
              setPage(1);
            }}
          />
        </div>
        <SearchInput
          placeholder="Buscar proveedor, RIF, factura o GRN-123"
          initialValue={search}
          onSearch={(value) => {
            setSearch(value);
            setPage(1);
          }}
          className="min-w-[260px]"
        />
      </div>

      {isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar las retenciones.
        </p>
      ) : (
        <GenericTable<RetentionLine>
          columns={columns}
          data={retentions}
          isLoading={isLoading || (isFetching && retentions.length === 0)}
          emptyMessage="No hay retenciones en estas fechas."
          actions={[
            {
              label: 'Ver gasto',
              icon: 'view',
              onClick: (row) => setSelectedExpenseId(row.expense.id),
            },
          ]}
          pagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalElements: pagination.totalElements,
            pageSize,
            onPageChange: setPage,
            onPageSizeChange: (size) => {
              setPageSize(size);
              setPage(1);
            },
          }}
        />
      )}

      <ExpenseDetailModal
        expenseId={selectedExpenseId}
        open={selectedExpenseId !== undefined}
        onOpenChange={(open) => !open && setSelectedExpenseId(undefined)}
      />
    </section>
  );
}
