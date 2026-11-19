import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import {
  OrderService,
  OrderPayload,
  BillingData,
} from '@/services/orders/orders.service';
import {
  TransactionDataPayload,
  DebtPayload,
  GetAllServiceQueryParametersType,
  GetDeliveryNotesQueryParams,
} from '@/services/transactions/types/GetAllTransactions';
import {
  useCurrentBranchId,
  useBranchStore,
} from '@/stores/branch/branch.store';
import { Pagination } from '@/models/pagination.model';
import { OrderData } from '@/services/orders/types/Order.type';
import { useToken } from '@/stores/auth/auth.store';
import { GetOrderByIdResponse } from '@/services/orders/types/GetOrderById.type';

const transactionService = new TransactionService(); // Para consultas de transacciones
const orderService = new OrderService(); // Para creación de órdenes

/**
 * Hook para obtener el balance de órdenes de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param queryParameters - Parámetros de paginación (opcional)
 * @returns Objeto con datos y estados para el balance de órdenes de sucursal
 */
export function useBranchOrderBalance(
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
    queryKey: ['branchOrderBalance', token, effectiveBranchId, queryParameters],
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
 * Hook para obtener la deuda de órdenes
 * @param token - Token de autenticación
 * @param payload - Datos para la consulta de deuda
 * @returns Objeto con datos y estados para la deuda de órdenes
 */
export function useOrdersDebt(
  token: string | undefined,
  payload: DebtPayload | undefined
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['ordersDebt', token, payload],
    queryFn: () =>
      transactionService.fetchTransactionsDebt(token, payload as DebtPayload),
    enabled: !!token && !!payload,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener el efectivo de órdenes de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @returns Objeto con datos y estados para el efectivo de órdenes de sucursal
 */
export function useBranchOrderCash(
  token: string | undefined,
  branchId?: string | undefined
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchOrderCash', token, effectiveBranchId],
    queryFn: () =>
      transactionService.getBranchCash(token, effectiveBranchId as string),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener el total de la deuda de órdenes de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @returns Objeto con datos y estados para el total de la deuda de órdenes de la sucursal
 */
export function useBranchOrderTotalDebt(
  token: string | undefined,
  branchId?: string | undefined
) {
  // Obtener el ID de sucursal del store global si no se proporciona uno específico
  const globalBranchId = useCurrentBranchId();
  const effectiveBranchId =
    branchId ??
    (globalBranchId !== undefined ? globalBranchId.toString() : undefined);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['branchOrderTotalDebt', token, effectiveBranchId],
    queryFn: () =>
      transactionService.getBranchTotalDebt(token, effectiveBranchId as string),
    enabled: !!token && !!effectiveBranchId,
  });

  return { data, isLoading, isError, refetch };
}

/**
 * Hook para obtener todas las órdenes de repuestos de una sucursal
 * @param token - Token de autenticación
 * @param branchId - ID de la sucursal (opcional, si no se proporciona usa el del store global)
 * @param queryParameters - Parámetros de paginación (opcional)
 * @returns Objeto con datos y estados para las órdenes de repuestos
 */
export function usePartOrders(
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
    queryKey: ['partOrders', token, effectiveBranchId, queryParameters],
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
 * Hook para manejar operaciones de órdenes
 * @param token - Token de autenticación
 * @param shouldFetchOrders - Indica si se deben obtener todas las órdenes (por defecto false)
 * @returns Objeto con funciones y estados para manejar órdenes
 */
export function useOrders(
  token: string | undefined,
  shouldFetchOrders: boolean = false,
  branchId?: string,
  queryParameters: GetAllServiceQueryParametersType = {},
  orderId?: string,
  shouldFetchOrderById: boolean = false
) {
  const queryClient = useQueryClient();

  // Obtener todas las órdenes (solo si shouldFetchOrders es true)
  const {
    data: orders,
    isLoading: isLoadingOrders,
    isError: isErrorOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ['orders', token, branchId, queryParameters],
    queryFn: () =>
      transactionService.getAllTransactions(token, branchId, queryParameters),
    enabled: !!token && shouldFetchOrders,
  });

  const {
    data: orderById,
    isLoading: isLoadingOrderById,
    isError: isErrorOrderById,
    refetch: refetchOrderById,
  } = useQuery({
    queryKey: ['orderById', token, orderId],
    queryFn: async (): Promise<GetOrderByIdResponse['data']> => {
      const response = await orderService.getOrderById(
        orderId as string,
        token as string
      );
      return response.data;
    },
    enabled: !!token && !!orderId && shouldFetchOrderById,
    staleTime: 1000 * 30,
  });

  // Crear orden
  const createOrderMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.createTransaction(data, token as string),
    onSuccess: () => {
      // Invalidar consultas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] }); // También invalidamos transacciones ya que las órdenes son un tipo de transacción
    },
  });

  // Actualizar orden
  const updateOrderMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.updateTransaction(data, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Eliminar orden
  const deleteOrderMutation = useMutation({
    mutationFn: (data: TransactionDataPayload) =>
      transactionService.deleteTransaction(data, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
  });

  // Crear múltiples órdenes
  const createBatchOrders = useMutation({
    mutationFn: (payload: TransactionDataPayload[]) =>
      transactionService.createBatchTransactions(payload, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderBalance'] });
      queryClient.invalidateQueries({ queryKey: ['ordersDebt'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderCash'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderTotalDebt'] });
      queryClient.invalidateQueries({ queryKey: ['partOrders'] });
    },
  });

  // Crear una orden completa usando OrderService
  const createOrder = useMutation({
    mutationFn: (payload: OrderPayload) =>
      orderService.createOrder(payload, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderBalance'] });
      queryClient.invalidateQueries({ queryKey: ['ordersDebt'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderCash'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderTotalDebt'] });
      queryClient.invalidateQueries({ queryKey: ['partOrders'] });
    },
  });

  // Actualizar una orden existente (PATCH) — para facturar notas de entrega
  const patchOrderMutation = useMutation({
    mutationFn: ({
      orderId,
      orderData,
    }: {
      orderId: string;
      orderData: OrderPayload['order'];
    }) => orderService.patchOrder(orderId, orderData, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderBalance'] });
      queryClient.invalidateQueries({ queryKey: ['ordersDebt'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderCash'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderTotalDebt'] });
      queryClient.invalidateQueries({ queryKey: ['partOrders'] });
    },
  });

  // Eliminar una orden por ID
  const deleteOrderByIdMutation = useMutation({
    mutationFn: (orderId: string) =>
      orderService.deleteOrder(orderId, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['deliveryNotes'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderBalance'] });
      queryClient.invalidateQueries({ queryKey: ['ordersDebt'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderCash'] });
      queryClient.invalidateQueries({ queryKey: ['branchOrderTotalDebt'] });
      queryClient.invalidateQueries({ queryKey: ['partOrders'] });
    },
  });

  return {
    // Datos de órdenes
    orders,
    isLoadingOrders,
    isErrorOrders,
    refetchOrders,

    // Crear orden completa (usando OrderService)
    createOrder: createOrder.mutate,
    isCreatingOrder: createOrder.isLoading,
    createOrderError: createOrder.error,

    // Actualizar orden existente (PATCH) — facturar pre orden
    patchOrder: patchOrderMutation.mutate,
    isPatchingOrder: patchOrderMutation.isLoading,
    patchOrderError: patchOrderMutation.error,

    // Eliminar orden por ID
    deleteOrderById: deleteOrderByIdMutation.mutate,
    isDeletingOrderById: deleteOrderByIdMutation.isLoading,

    // Crear múltiples transacciones (usando TransactionService)
    createBatchOrders: createBatchOrders.mutate,
    isCreatingBatchOrders: createBatchOrders.isLoading,
    createBatchOrdersError: createBatchOrders.error,

    // Actualizar orden
    updateOrder: updateOrderMutation.mutate,
    isUpdatingOrder: updateOrderMutation.isLoading,
    updateOrderError: updateOrderMutation.error,

    // Eliminar orden
    deleteOrder: deleteOrderMutation.mutate,
    isDeletingOrder: deleteOrderMutation.isLoading,
    deleteOrderError: deleteOrderMutation.error,

    // Consulta de orden por ID
    orderById,
    isLoadingOrderById,
    isErrorOrderById,
    refetchOrderById,
  };
}

export function useBranchOrdersList(
  branchId?: string,
  queryParameters: GetAllServiceQueryParametersType = {},
  options: { enabled?: boolean } = {}
) {
  const token = useToken();
  const currentBranchId = useBranchStore((s) => s.currentBranchId);
  const effectiveBranchId =
    branchId ??
    (currentBranchId !== undefined ? String(currentBranchId) : undefined);

  const pageSize = queryParameters.pageSize ?? '10';
  const page = queryParameters.page ?? '1';
  const search = queryParameters.search ?? '';
  const category = queryParameters.category;
  const start = queryParameters.start;
  const finish = queryParameters.finish;
  const branch = queryParameters.branch;
  const model = queryParameters.model;

  return useQuery<Pagination<OrderData>>({
    queryKey: [
      'branchOrdersList',
      {
        branchId: effectiveBranchId,
        pageSize,
        page,
        search,
        category,
        start,
        finish,
        branch,
        model,
      },
    ],
    queryFn: () =>
      orderService.getAllOrders(token, effectiveBranchId as string, {
        pageSize,
        page,
        search,
        category,
        start,
        finish,
        branch,
        model,
      }),
    enabled:
      (options.enabled ?? true) && Boolean(token) && Boolean(effectiveBranchId),
  });
}

export function useOrderTransactions(orderId: number) {
  const token = useToken();

  return useQuery({
    queryKey: ['orderTransactions', orderId],
    queryFn: async () => {
      const response = await orderService.getTransactionsByOrder(
        orderId,
        token as string
      );
      // Handle both array and pagination response structures
      return Array.isArray(response) ? response : response.results || [];
    },
    enabled: !!token && !!orderId,
  });
}

export function useDeliveryNotes(
  branchId?: string,
  queryParameters: GetDeliveryNotesQueryParams = {},
  options: { enabled?: boolean } = {}
) {
  const token = useToken();
  const currentBranchId = useBranchStore((s) => s.currentBranchId);
  const effectiveBranchId =
    branchId ??
    (currentBranchId !== undefined ? String(currentBranchId) : undefined);

  const pageSize = queryParameters.pageSize ?? '10';
  const page = queryParameters.page ?? '1';
  const search = queryParameters.search ?? '';
  const category = queryParameters.category;
  const status = queryParameters.status;
  const startDate = queryParameters.startDate;
  const endDate = queryParameters.endDate;
  const preorder = queryParameters.preorder;
  const model = queryParameters.model;
  const seller = queryParameters.seller;

  return useQuery<Pagination<OrderData>>({
    queryKey: [
      'deliveryNotes',
      {
        branchId: effectiveBranchId,
        pageSize,
        page,
        search,
        category,
        status,
        startDate,
        endDate,
        preorder,
        model,
        seller,
      },
    ],
    queryFn: () =>
      orderService.getDeliveryNotes(token, effectiveBranchId as string, {
        pageSize,
        page,
        search,
        category,
        status,
        startDate,
        endDate,
        preorder,
        model,
        seller,
      }),
    enabled:
      (options.enabled ?? true) && Boolean(token) && Boolean(effectiveBranchId),
    refetchOnWindowFocus: false,
  });
}

export function useInventoryDeliveryNotes(
  category: number | string,
  enabled = false,
  page = 1,
  pageSize = 10,
  filters: {
    search?: string;
    startDate?: string;
    endDate?: string;
    model?: string;
    branch?: string;
    seller?: string;
  } = {}
) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const branchId =
    currentBranchId !== undefined ? String(currentBranchId) : undefined;

  return useQuery({
    queryKey: [
      'inventoryDeliveryNotes',
      branchId,
      category,
      page,
      pageSize,
      filters,
    ],
    queryFn: () =>
      orderService.getInventoryDeliveryNotes(
        token as string,
        branchId as string,
        category,
        page,
        pageSize,
        filters
      ),
    enabled: !!token && !!branchId && enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useOrderBilling(orderId: number, applyIgtf?: boolean) {
  const token = useToken();

  return useQuery<BillingData>({
    queryKey: ['orderBilling', orderId, applyIgtf],
    queryFn: () =>
      orderService.getBillingData(orderId, token as string, applyIgtf),
    enabled: !!token && !!orderId,
  });
}
