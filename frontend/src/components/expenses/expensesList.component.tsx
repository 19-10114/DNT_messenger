'use client';

import { useState } from 'react';
import { FileSpreadsheet, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { PaymentMethodsSection } from '@/components/tables/PaymentMethodsSection.component';
import { useToast } from '@/components/ui/use-toast';
import { useAllBranches } from '@/hooks';
import {
  useAllExpenses,
  useExpenseCategories,
  useExpensesExport,
} from '@/hooks/expenses';
import { formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import {
  Expense,
  ExpenseRateSource,
} from '@/services/expenses/types/Expense.type';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { ExpenseDetailModal } from './expenseDetailModal.component';
import { ExpenseFormModal } from './expenseFormModal.component';
import { ExpenseFilters, ExpensesFilters } from './expensesFilters.component';
import { ExpensesTable } from './expensesTable.component';
import { exportExpensesToXLSX } from './exportExpenses';
import {
  RATE_SOURCE_LABELS,
  canApproveExpenses,
  completePaymentMethodTotals,
} from './expense.utils';

const BOOKED = 'booked';

/**
 * Gastos: lo aprobado y lo anulado, que es lo que mueve caja. Pre Gastos: las
 * solicitudes pendientes de aprobación y las rechazadas. Es la misma tabla
 * `Expense`, como Ordenes y Pre Ordenes son la misma `Order`; al aprobarse, el
 * gasto pasa de una página a la otra con el mismo código.
 */
export type ExpensesListMode = 'expenses' | 'requests';

const STATUS_OPTIONS: Record<
  ExpensesListMode,
  { value: NonNullable<ExpenseFilters['status']>; label: string }[]
> = {
  expenses: [
    { value: 'registered', label: 'Registrados' },
    { value: 'cancelled', label: 'Anulados' },
  ],
  requests: [
    { value: 'requests', label: 'Pendientes y rechazados' },
    { value: 'pending_approval', label: 'Pendientes' },
    { value: 'rejected', label: 'Rechazados' },
  ],
};

/**
 * Listado de gastos de la sucursal activa (selector global; "Todas" = 0 solo
 * para administradores), con totales del conjunto filtrado. Registrar y editar
 * abren `ExpenseFormModal` encima del listado, sin cambiar de página.
 *
 * Como en Ordenes / Pre Ordenes, la página decide qué se crea: en Pre Gastos
 * cualquiera registra un pre-gasto (queda pendiente, también si es admin); en
 * Gastos solo un admin registra un gasto, y nace aprobado. Quien no aprueba
 * solo ve sus propias solicitudes (lo filtra el backend).
 */
export function ExpensesList({ mode }: { mode: ExpensesListMode }) {
  const currentBranchId = useCurrentBranchId();
  const branchId =
    currentBranchId !== undefined && currentBranchId !== null
      ? String(currentBranchId)
      : undefined;

  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const isAdmin = canApproveExpenses(roles, isSuperuser, isStaff);

  const isRequests = mode === 'requests';
  // Pre Gastos: todos. Gastos: solo quien lo deja aprobado.
  const canRegister = isRequests || isAdmin;

  const [filters, setFilters] = useState<ExpenseFilters>({
    status: STATUS_OPTIONS[mode][0].value,
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedId, setSelectedId] = useState<number>();
  // A qué tasa ver los montos (SAL-163): la registrada en cada gasto, o una
  // tasa del día. Solo cambia cómo se MUESTRAN; lo guardado no se toca.
  const [rateSource, setRateSource] = useState<ExpenseRateSource>();
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense>();

  const { expenses, staticData, pagination, isLoading, isFetching, isError } =
    useAllExpenses(branchId, {
      ...filters,
      rate: rateSource,
      page: String(page),
      pageSize: String(pageSize),
    });

  const { toast } = useToast();
  const { data: branches = [] } = useAllBranches();
  const { categories } = useExpenseCategories();
  const { fetchForExport, isExporting } = useExpensesExport(branchId, filters);

  // Exporta lo mismo que muestra el listado: los filtros aplicados, todas las
  // páginas.
  const handleExport = async () => {
    try {
      const all = await fetchForExport();
      if (all.length === 0) {
        toast({ title: 'No hay gastos para exportar con estos filtros' });
        return;
      }
      const branchName =
        branchId === '0'
          ? 'Todas las sucursales'
          : (branches.find((branch) => String(branch.id) === branchId)?.name ??
            `Sucursal ${branchId}`);
      exportExpensesToXLSX(all, filters, branchName, categories);
    } catch {
      toast({
        title: 'No se pudo exportar',
        description: 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const changeFilters = (next: ExpenseFilters) => {
    setFilters(next);
    setPage(1);
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={isExporting || !pagination.totalElements}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          {isExporting ? 'Exportando...' : 'Exportar a Excel'}
        </Button>
        {canRegister && (
          <Button onClick={() => setIsNewOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {isRequests ? 'Registrar pre-gasto' : 'Registrar gasto'}
          </Button>
        )}
      </div>

      {!isRequests && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <label className="text-sm text-muted-foreground">
              Ver montos a
            </label>
            <Select
              value={rateSource ?? BOOKED}
              onValueChange={(value) =>
                setRateSource(
                  value === BOOKED ? undefined : (value as ExpenseRateSource)
                )
              }
            >
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={BOOKED}>
                  Tasa registrada en cada gasto
                </SelectItem>
                {(Object.keys(RATE_SOURCE_LABELS) as ExpenseRateSource[]).map(
                  (source) => (
                    <SelectItem key={source} value={source}>
                      {RATE_SOURCE_LABELS[source]}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCardMain
              label={
                rateSource
                  ? 'Total gastos (USD, tasa del día)'
                  : 'Total gastos (USD)'
              }
              value={usdFormatCurrency(
                (rateSource
                  ? staticData?.converted?.totalUsd
                  : staticData?.totalUsd) ?? 0
              )}
              subtitle={
                rateSource
                  ? staticData?.converted?.missingRateCount
                    ? `${RATE_SOURCE_LABELS[rateSource]}. ${staticData.converted.missingRateCount} sin tasa ese día, fuera del total`
                    : RATE_SOURCE_LABELS[rateSource]
                  : undefined
              }
              tone="red"
            />
            <KpiCardMain
              label="Pagado en efectivo (USD)"
              value={usdFormatCurrency(staticData?.totalCashUsd ?? 0)}
              subtitle="Lo que descuenta la caja de la sucursal"
              tone="brown"
            />
            <KpiCardMain
              label={rateSource ? 'Todo en Bs (tasa del día)' : 'Pagado en Bs'}
              value={formatCurrencyBolivares(
                (rateSource
                  ? staticData?.converted?.totalBs
                  : staticData?.totalBs) ?? 0
              )}
              subtitle={
                rateSource
                  ? 'Los gastos en USD convertidos a Bs con la tasa del día'
                  : 'En bolívares, por cualquier medio. No descuenta la caja'
              }
            />
            <KpiCardMain
              label="Cantidad"
              value={String(staticData?.count ?? 0)}
            />
          </div>

          <PaymentMethodsSection
            paymentKpis={completePaymentMethodTotals(
              staticData?.paymentMethodTotals
            )}
            storageKey="expensesPaymentMethodsExpanded"
          />
        </>
      )}

      <ExpensesFilters
        filters={filters}
        onChange={changeFilters}
        statusOptions={STATUS_OPTIONS[mode]}
      />

      {isError ? (
        <p className="text-sm text-destructive">
          No se pudieron cargar los gastos.
        </p>
      ) : (
        <ExpensesTable
          expenses={expenses}
          isLoading={isLoading || (isFetching && expenses.length === 0)}
          showBranch={branchId === '0'}
          rateSource={isRequests ? undefined : rateSource}
          onView={(expense: Expense) => setSelectedId(expense.id)}
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
        expenseId={selectedId}
        open={selectedId !== undefined}
        onOpenChange={(open) => !open && setSelectedId(undefined)}
        onEdit={(expense) => {
          setSelectedId(undefined);
          setEditingExpense(expense);
        }}
      />

      <ExpenseFormModal
        open={isNewOpen}
        onOpenChange={setIsNewOpen}
        asRequest={isRequests}
      />

      <ExpenseFormModal
        open={editingExpense !== undefined}
        onOpenChange={(open) => !open && setEditingExpense(undefined)}
        editExpense={editingExpense}
      />
    </section>
  );
}
