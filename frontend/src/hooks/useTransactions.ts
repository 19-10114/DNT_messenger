import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import {
  TransactionDataPayload,
  DebtPayload,
  GetAllServiceQueryParametersType,
} from '@/services/transactions/types/GetAllTransactions';
import { useBranches, useCurrentBranchId } from '@/stores/branch/branch.store';
import { ClientBalanceOrdering } from '@/services/transactions/types/ClientBonus.type';

const transactionService = new TransactionService();

/**
 * Hook para obtener el balance de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param queryParameters - Parámetros de paginación (opcional)
 * @returns Objeto con datos y estados para el balance de sucursal
 */
export function useBranchBalance(
  token: string | undefined,
  branchId?: string | undefined,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchBalance', token, effectiveBranchId, queryParameters],
    queryFn: () =>
      transactionService.getBranchBalance(
        token,
        effectiveBranchId as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener la deuda de transacciones
 * @param token - Token de autenticación
 * @param payload - Datos para la consulta de deuda
 * @returns Objeto con datos y estados para la deuda de transacciones
 */
export function useTransactionsDebt(
  token: string | undefined,
  payload: DebtPayload | undefined,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transactionsDebt', token, payload, queryParameters],
    queryFn: () =>
      transactionService.fetchTransactionsDebt(
        token,
        payload as DebtPayload,
        queryParameters
      ),
    enabled: !!token && !!payload,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener el efectivo de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @returns Objeto con datos y estados para el efectivo de sucursal
 */
export function useBranchCash(
  token: string | undefined,
  branchId?: string | undefined
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchCash', token, effectiveBranchId],
    queryFn: () =>
      transactionService.getBranchCash(token, effectiveBranchId as string),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener el total de la deuda de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @returns Objeto con datos y estados para el total de la deuda de la sucursal
 */
export function useBranchTotalDebt(
  token: string | undefined,
  branchId?: string | undefined
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchTotalDebt', token, effectiveBranchId],
    queryFn: () =>
      transactionService.getBranchTotalDebt(token, effectiveBranchId as string),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener todas las transacciones de repuestos de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param queryParameters - Parámetros de paginación (opcional)
 * @returns Objeto con datos y estados para las transacciones de repuestos
 */
export function usePartTransactions(
  token: string | undefined,
  branchId?: string | undefined,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['partTransactions', token, effectiveBranchId, queryParameters],
    queryFn: () =>
      transactionService.getAllPartTransactions(
        token,
        effectiveBranchId as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener todas las transacciones de servicios de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param queryParameters - Parámetros de paginación (opcional)
 * @returns Objeto con datos y estados para las transacciones de servicios
 */
export function useServiceTransactions(
  token: string | undefined,
  branchId?: string | undefined,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'serviceTransactions',
      token,
      effectiveBranchId,
      queryParameters,
    ],
    queryFn: () =>
      transactionService.getAllServiceTransactions(
        token,
        effectiveBranchId as string,
        queryParameters
      ),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener el valor del inventario por sucursal
 * @param token - Token de autenticación
 * @returns Objeto con datos y estados para el valor del inventario
 */
export function useInventoryValue(token: string | undefined) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['inventoryValue', token],
    queryFn: () => transactionService.getInventoryValue(token),
    enabled: !!token,
  });

  return { data: data?.data, isLoading, isError, refetch };
}

/**
 * Hook para obtener una transacción por su id.
 *
 * El listado de una orden trae `Transaction` (la forma reducida que viene
 * anidada en la orden); la ficha necesita el `TransactionDataResult` completo,
 * así que se pide aparte cuando hay un id seleccionado.
 *
 * @param token - Token de autenticación
 * @param transactionId - Id a consultar; sin id la consulta queda en pausa
 */
export function useTransaction(
  token: string | undefined,
  transactionId?: number | string
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['transaction', token, transactionId],
    queryFn: () =>
      transactionService.getTransactionById(token, String(transactionId)),
    enabled: !!token && transactionId !== undefined,
    refetchOnWindowFocus: false,
  });

  return {
    transaction: data,
    isLoadingTransaction: isLoading,
    isErrorTransaction: isError,
    refetchTransaction: refetch,
  };
}

/**
 * Hook para manejar operaciones de transacciones
 * @param token - Token de autenticación
 * @param shouldFetchTransactions - Indica si se deben obtener todas las transacciones (por defecto false)
 * @returns Objeto con funciones y estados para manejar transacciones
 */
export function useTransactions(
  token: string | undefined,
  shouldFetchTransactions: boolean = false,
  branchId?: string,
  queryParameters: GetAllServiceQueryParametersType = {}
) {
  const queryClient = useQueryClient();

  // Obtener todas las transacciones (solo si shouldFetchTransactions es true)
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['transactions', token, branchId, queryParameters],
    queryFn: () =>
      transactionService.getAllTransactions(token, branchId, queryParameters),
    enabled: !!token && shouldFetchTransactions,
  });

  // Crear transacción
  const createTransactionMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.createTransaction(data, token as string),
    onSuccess: () => {
      // Invalidar consultas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Actualizar transacción
  const updateTransactionMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.updateTransaction(data, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Eliminar transacción
  const deleteTransactionMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.deleteTransaction(data, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Crear transacción en lote (batch)
  const createBatchTransactionsMutation = useMutation({
    mutationFn: (data: TransactionDataPayload[]) =>
      transactionService.createBatchTransactions(data, token as string),
    onSuccess: () => {
      // Invalidar consultas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  return {
    // Datos y estados de consulta
    transactions,
    isLoadingTransactions,
    isErrorTransactions,
    refetchTransactions,

    // Mutaciones
    createTransaction: createTransactionMutation.mutate,
    isCreatingTransaction: createTransactionMutation.isLoading,
    createTransactionError: createTransactionMutation.error,

    createBatchTransactions: createBatchTransactionsMutation.mutate,
    isCreatingBatchTransactions: createBatchTransactionsMutation.isLoading,
    createBatchTransactionsError: createBatchTransactionsMutation.error,

    updateTransaction: updateTransactionMutation.mutate,
    isUpdatingTransaction: updateTransactionMutation.isLoading,
    updateTransactionError: updateTransactionMutation.error,

    deleteTransaction: deleteTransactionMutation.mutate,
    isDeletingTransaction: deleteTransactionMutation.isLoading,
    deleteTransactionError: deleteTransactionMutation.error,
  };
}

/**
 * Hook para obtener los abonos de clientes (regulares o aliados)
 * @param token - Token de autenticación
 * @param queryParameters - Parámetros de paginación (opcional)
 * @param type - Tipo de cliente ('regular' | 'aliado')
 * @param enabled - Si el query debe ejecutarse
 * @returns Objeto con datos y estados para los abonos de clientes
 */
export function useClientBonus(
  token: string | undefined,
  queryParameters: GetAllServiceQueryParametersType = {},
  type: 'regular' | 'aliado' = 'regular',
  enabled: boolean = true
) {
  const branchId = useCurrentBranchId();
  const branchIdString =
    branchId !== undefined && branchId !== null
      ? branchId.toString()
      : undefined;
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientBonus', token, queryParameters, type, branchIdString],
    queryFn: () =>
      transactionService.getClientBonus(
        token,
        queryParameters,
        type,
        branchIdString
      ),
    enabled: !!token && enabled,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Saldo por cliente (a partir de sus abonos): busca por nombre/apellido/
 * cédula, sin acotar por sucursal ni por tipo de cliente (regular/aliado) --
 * a diferencia de useClientBonus, que lista todos los clientes de UNA
 * sucursal/tipo para el dashboard. Un cliente sin ningún movimiento de abono
 * hace que el backend responda 404 ("No client bonuses found"); eso no es
 * un error real acá, así que el componente que consuma este hook debe
 * tratar ese 404 como "saldo 0 / sin movimientos", no como una falla.
 */
export function useClientBalanceSearch(
  token: string | undefined,
  search: string
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['clientBalanceSearch', token, search],
    queryFn: () =>
      // branchId '0' = todas las sucursales -- el saldo de un cliente no
      // está acotado a una sucursal en particular.
      transactionService.getClientBonus(
        token,
        { search, pageSize: '20' },
        undefined,
        '0'
      ),
    enabled: !!token && search.trim().length >= 3,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    retry: false,
  });

  return { data, isLoading, isError, error, refetch };
}

/**
 * Tabla de todos los clientes con saldo de abono != 0 (más alto primero) +
 * KPIs globales de depositado/usado/saldo neto. Ver useClientBalanceSearch
 * para la búsqueda puntual de un cliente -- este hook es la tabla completa.
 */
export function useClientBalanceSummary(
  token: string | undefined,
  page: number = 1,
  pageSize: string = '20',
  direction: 'asc' | 'desc' = 'desc',
  ordering: ClientBalanceOrdering = 'balance',
  branchId?: string
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'clientBalanceSummary',
      token,
      page,
      pageSize,
      direction,
      ordering,
      branchId,
    ],
    queryFn: () =>
      transactionService.getClientBalanceSummary(
        token,
        { page: String(page), pageSize },
        direction,
        ordering,
        branchId
      ),
    enabled: !!token,
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Detalle de abono de UN cliente puntual (por id) -- mismo endpoint que
 * useClientBonus/useClientBalanceSearch, pero filtrado por `client` en vez
 * de por texto. Se usa al hacer click en una fila de la tabla de saldos
 * para ver en qué órdenes depositó y en cuáles pagó con abono.
 */
export function useClientBonusDetail(
  token: string | undefined,
  clientId: number | null
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clientBonusDetail', token, clientId],
    queryFn: () =>
      transactionService.getClientBonus(
        token,
        { pageSize: '1' },
        undefined,
        '0',
        String(clientId)
      ),
    enabled: !!token && clientId != null,
    refetchOnWindowFocus: false,
  });

  return { data, isLoading, isError, refetch };
}
