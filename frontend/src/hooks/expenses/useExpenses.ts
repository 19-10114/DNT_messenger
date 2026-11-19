import { useMemo, useState } from 'react';
import {
  QueryClient,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { applyQueryConfig } from '@/config/queryOptimization.config';
import { ExpensesService } from '@/services/expenses/expenses.service';
import {
  CreateExpensePayload,
  ExpenseCategory,
  ExpenseCategoryPayload,
  GetAllExpensesQueryParams,
  GetRetentionsQueryParams,
  UpdateExpensePayload,
} from '@/services/expenses/types/Expense.type';
import { useToken } from '@/stores/auth/auth.store';

const expensesService = new ExpensesService();

/**
 * Un gasto mueve el efectivo de la sucursal, así que al crearlo, editarlo o
 * anularlo se invalidan también las vistas de caja y el reporte diario.
 */
function invalidateExpenseViews(queryClient: QueryClient) {
  [
    'expenses',
    'expense',
    'expenseSummary',
    'cashObjects',
    'branchCash',
    'branchBalance',
    'dailyReport',
    // Un nombre nuevo queda guardado como beneficiario.
    'expenseSavedBeneficiaries',
    // Aprobar o anular cambia lo retenido.
    'expenseRetentions',
    // El conteo de gastos de cada proveedor.
    'suppliers',
  ].forEach((key) => queryClient.invalidateQueries({ queryKey: [key] }));
}

/** Listado paginado de gastos de una sucursal (`'0'` = todas, solo admin). */
export function useAllExpenses(
  branchId: string | undefined,
  queryParameters: GetAllExpensesQueryParams = {}
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['expenses', token, branchId, queryParameters],
    queryFn: () =>
      expensesService.getAllExpenses(
        token,
        branchId as string,
        queryParameters
      ),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    ...applyQueryConfig('INVENTORY'),
  });

  return {
    expenses: data?.results ?? [],
    staticData: data?.staticData,
    pagination: {
      currentPage: data?.currentPage ?? 1,
      totalPages: data?.totalPages ?? 1,
      totalElements: data?.totalElements ?? 0,
      pageSize: data?.pageSize ?? 10,
    },
    isLoading,
    isFetching,
    isError,
    refetch,
  };
}

/**
 * Un gasto. Sin caché (`staleTime: 0`): la URL del comprobante vence a los
 * 5 minutos, así que se pide de nuevo cada vez que se abre.
 */
export function useExpense(id: number | undefined, enabled: boolean = true) {
  const token = useToken();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['expense', token, id],
    queryFn: () => expensesService.getExpense(token, id as number),
    enabled: !!token && !!id && enabled,
    staleTime: 0,
    cacheTime: 0,
  });

  return { expense: data, isLoading, isError, refetch };
}

export interface ExpenseCategoryGroup {
  groupCode: string;
  groupName: string;
  categories: ExpenseCategory[];
}

/**
 * Usuarios de Moto Candela para el selector de beneficiario, filtrados por el
 * backend con `search`. Solo se pide mientras el selector está abierto.
 */
export function useExpenseBeneficiaries(search: string, enabled: boolean) {
  const token = useToken();

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['expenseBeneficiaries', token, search],
    queryFn: () => expensesService.getBeneficiaries(token, search),
    enabled: !!token && enabled,
    keepPreviousData: true,
  });

  return {
    beneficiaries: data ?? [],
    isLoading: isLoading && enabled,
    isFetching,
    isError,
  };
}

/**
 * Beneficiarios guardados (nombres escritos en gastos anteriores) para el
 * selector, filtrados por el backend con `search`. Solo mientras está abierto.
 */
export function useSavedBeneficiaries(search: string, enabled: boolean) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['expenseSavedBeneficiaries', token, search],
    queryFn: () => expensesService.getSavedBeneficiaries(token, search),
    enabled: !!token && enabled,
    keepPreviousData: true,
  });

  return {
    savedBeneficiaries: data ?? [],
    isLoading: isLoading && enabled,
    isError,
  };
}

/**
 * Exportación a Excel del listado: trae todos los gastos que cumplen los
 * filtros, sin paginar. **Returns:** `{ fetchForExport, isExporting }`.
 */
export function useExpensesExport(
  branchId: string | undefined,
  filters: Omit<GetAllExpensesQueryParams, 'page' | 'pageSize'>
) {
  const token = useToken();
  const [isExporting, setIsExporting] = useState(false);

  const fetchForExport = async () => {
    if (branchId === undefined) return [];
    setIsExporting(true);
    try {
      return await expensesService.getAllExpensesForExport(
        token,
        branchId,
        filters
      );
    } finally {
      setIsExporting(false);
    }
  };

  return { fetchForExport, isExporting };
}

/** Categorías, y las mismas agrupadas por cuenta (nivel 3) para el selector. */
export function useExpenseCategories(includeInactive: boolean = false) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['expenseCategories', token, includeInactive],
    queryFn: () => expensesService.getCategories(token, includeInactive),
    enabled: !!token,
    ...applyQueryConfig('BRANCHES'),
  });

  const categoriesByGroup = useMemo<ExpenseCategoryGroup[]>(() => {
    const groups = new Map<string, ExpenseCategoryGroup>();
    (data ?? []).forEach((category) => {
      const group = groups.get(category.groupCode) ?? {
        groupCode: category.groupCode,
        groupName: category.groupName,
        categories: [],
      };
      group.categories.push(category);
      groups.set(category.groupCode, group);
    });
    return Array.from(groups.values());
  }, [data]);

  return { categories: data ?? [], categoriesByGroup, isLoading, isError };
}

export function useExpenseSummary(
  branchId: string | undefined,
  queryParameters: Omit<GetAllExpensesQueryParams, 'page' | 'pageSize'> = {}
) {
  const token = useToken();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['expenseSummary', token, branchId, queryParameters],
    queryFn: () =>
      expensesService.getSummary(token, branchId as string, queryParameters),
    enabled: !!token && branchId !== undefined,
    ...applyQueryConfig('INVENTORY'),
  });

  return { summary: data, isLoading, isError };
}

export function useCreateExpense() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExpensePayload) =>
      expensesService.createExpense(token, payload),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

export function useUpdateExpense(id: number) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateExpensePayload) =>
      expensesService.updateExpense(token, id, payload),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

export function useCancelExpense() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      expensesService.cancelExpense(token, id, reason),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

/** Admin: aprobar un pendiente. Mueve la caja, así que invalida lo mismo que crear. */
export function useApproveExpense() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expensesService.approveExpense(token, id),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

/** Admin: rechazar un pendiente con motivo. */
export function useRejectExpense() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      expensesService.rejectExpense(token, id, reason),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

/** Quien lo registró retira su pendiente. */
export function useWithdrawExpense() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => expensesService.withdrawExpense(token, id),
    onSuccess: () => invalidateExpenseViews(queryClient),
  });
}

export function useSaveExpenseCategory() {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id?: number;
      payload: ExpenseCategoryPayload;
    }) =>
      id
        ? expensesService.updateCategory(token, id, payload)
        : expensesService.createCategory(token, payload),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['expenseCategories'] }),
  });
}

/** Página Retenciones: las retenciones de los gastos aprobados, paginadas. */
export function useRetentions(
  branchId: string | undefined,
  queryParameters: GetRetentionsQueryParams = {}
) {
  const token = useToken();

  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: ['expenseRetentions', token, branchId, queryParameters],
    queryFn: () =>
      expensesService.getRetentions(token, branchId as string, queryParameters),
    enabled: !!token && branchId !== undefined,
    keepPreviousData: true,
    ...applyQueryConfig('INVENTORY'),
  });

  return {
    retentions: data?.results ?? [],
    totals: data?.staticData,
    pagination: {
      currentPage: data?.currentPage ?? 1,
      totalPages: data?.totalPages ?? 1,
      totalElements: data?.totalElements ?? 0,
      pageSize: data?.pageSize ?? 10,
    },
    isLoading,
    isFetching,
    isError,
  };
}

/** Exportación de Retenciones: todas las filas con los filtros, sin paginar. */
export function useRetentionsExport(
  branchId: string | undefined,
  filters: Omit<GetRetentionsQueryParams, 'page' | 'pageSize'>
) {
  const token = useToken();
  const [isExporting, setIsExporting] = useState(false);

  const fetchForExport = async () => {
    if (branchId === undefined) return [];
    setIsExporting(true);
    try {
      return await expensesService.getRetentionsForExport(
        token,
        branchId,
        filters
      );
    } finally {
      setIsExporting(false);
    }
  };

  return { fetchForExport, isExporting };
}

/** Tasas de IVA (16 %, 8 %) y de retención de IVA que ofrece el formulario. */
export function useExpenseTaxOptions() {
  const token = useToken();

  const { data } = useQuery({
    queryKey: ['expenseTaxOptions', token],
    queryFn: () => expensesService.getTaxOptions(token),
    enabled: !!token,
    ...applyQueryConfig('BRANCHES'),
  });

  return {
    ivaRates: data?.ivaRates ?? [16, 8],
    ivaRetentionRates: data?.ivaRetentionRates ?? [0, 75, 100],
  };
}
