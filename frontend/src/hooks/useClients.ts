import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientService } from '@/services/clients/clients.service';
import {
  ClientData,
  CreateClientPayload,
} from '@/services/clients/types/Client.type';

const clientService = new ClientService();

/**
 * Hook para buscar/listar clientes por nombre o cédula, paginado.
 */
export function useAllClients(
  token: string | undefined,
  queryParameters: {
    search?: string;
    role?: string;
    page?: string;
    pageSize?: string;
  } = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clients-all', token, queryParameters],
    queryFn: () =>
      clientService.getAllClients(token as string, queryParameters),
    enabled: !!token,
  });

  return {
    clients: data?.data?.results ?? [],
    totalPages: data?.data?.totalPages ?? 1,
    currentPage: data?.data?.currentPage ?? 1,
    totalElements: data?.data?.totalElements ?? 0,
    isLoadingClients: isLoading,
    isErrorClients: isError,
    refetchClients: refetch,
  };
}

/**
 * Hook para las órdenes completadas de un cliente (incluye el total gastado).
 */
export function useClientOrders(
  token: string | undefined,
  clientId: number | undefined,
  queryParameters: { page?: string; pageSize?: string } = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['client-orders', token, clientId, queryParameters],
    queryFn: () =>
      clientService.getClientOrders(
        token as string,
        clientId as number,
        queryParameters
      ),
    enabled: !!token && !!clientId,
  });

  return {
    orders: data?.data?.results ?? [],
    totalSpent: data?.data?.staticData?.totalSpent ?? 0,
    totalPages: data?.data?.totalPages ?? 1,
    currentPage: data?.data?.currentPage ?? 1,
    totalElements: data?.data?.totalElements ?? 0,
    isLoadingOrders: isLoading,
    isErrorOrders: isError,
    refetchOrders: refetch,
  };
}

/**
 * Hook para las pre órdenes (no facturadas) de un cliente.
 */
export function useClientPreOrders(
  token: string | undefined,
  clientId: number | undefined,
  queryParameters: { page?: string; pageSize?: string } = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['client-pre-orders', token, clientId, queryParameters],
    queryFn: () =>
      clientService.getClientPreOrders(
        token as string,
        clientId as number,
        queryParameters
      ),
    enabled: !!token && !!clientId,
  });

  return {
    preOrders: data?.data?.results ?? [],
    activeCount: data?.data?.staticData?.activeCount ?? 0,
    totalPending: data?.data?.staticData?.totalPending ?? 0,
    totalPages: data?.data?.totalPages ?? 1,
    currentPage: data?.data?.currentPage ?? 1,
    totalElements: data?.data?.totalElements ?? 0,
    isLoadingPreOrders: isLoading,
    isErrorPreOrders: isError,
    refetchPreOrders: refetch,
  };
}

/**
 * Hook para los productos comprados por un cliente (agregado por producto).
 */
export function useClientProducts(
  token: string | undefined,
  clientId: number | undefined,
  queryParameters: { page?: string; pageSize?: string } = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['client-products', token, clientId, queryParameters],
    queryFn: () =>
      clientService.getClientProducts(
        token as string,
        clientId as number,
        queryParameters
      ),
    enabled: !!token && !!clientId,
  });

  return {
    products: data?.data?.results ?? [],
    totalPages: data?.data?.totalPages ?? 1,
    currentPage: data?.data?.currentPage ?? 1,
    totalElements: data?.data?.totalElements ?? 0,
    isLoadingProducts: isLoading,
    isErrorProducts: isError,
    refetchProducts: refetch,
  };
}

/**
 * Hook para el drill-down: transacciones individuales de un producto
 * comprado por un cliente.
 */
export function useClientProductDetail(
  token: string | undefined,
  clientId: number | undefined,
  productId: number | undefined,
  queryParameters: { page?: string; pageSize?: string } = {}
) {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'client-product-detail',
      token,
      clientId,
      productId,
      queryParameters,
    ],
    queryFn: () =>
      clientService.getClientProductDetail(
        token as string,
        clientId as number,
        productId as number,
        queryParameters
      ),
    enabled: !!token && !!clientId && !!productId,
  });

  return {
    transactions: data?.data?.results ?? [],
    totalPages: data?.data?.totalPages ?? 1,
    currentPage: data?.data?.currentPage ?? 1,
    totalElements: data?.data?.totalElements ?? 0,
    isLoadingTransactions: isLoading,
    isErrorTransactions: isError,
    refetchTransactions: refetch,
  };
}

/**
 * Hook para buscar un cliente por cédula de identidad
 * @param token - Token de autenticación
 * @param countryId - Cédula de identidad del cliente
 * @param enabled - Si la consulta debe ejecutarse automáticamente
 * @returns Objeto con datos y estados para la búsqueda de cliente
 */
export function useClientByCountryId(
  token: string | undefined,
  countryId: string | undefined,
  enabled: boolean = false
) {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['client', countryId, token],
    queryFn: () => clientService.getClientByCountryId(countryId!, token!),
    enabled: !!token && !!countryId && enabled,
    retry: false, // No reintentar automáticamente si el cliente no existe
  });

  return {
    client: data,
    isLoadingClient: isLoading,
    isErrorClient: isError,
    clientError: error,
    refetchClient: refetch,
  };
}

/**
 * Hook para manejar operaciones de clientes
 * @param token - Token de autenticación
 * @returns Objeto con funciones y estados para manejar clientes
 */
export function useClients(token: string | undefined) {
  const queryClient = useQueryClient();

  // Crear cliente
  const createClientMutation = useMutation({
    mutationFn: (data: CreateClientPayload) =>
      clientService.createClient(data, token as string),
    onSuccess: (response, variables) => {
      // Invalidar consultas para refrescar los datos
      queryClient.invalidateQueries({ queryKey: ['client'] });

      queryClient.setQueryData(['client', variables.country_id, token], {
        id: response.id,
        firstName: variables.first_name,
        lastName: variables.last_name,
        countryId: variables.country_id,
        phoneNumber: variables.phone_number,
        email: variables.email,
        address: variables.address,
        city: variables.city,
        createdAt: new Date().toISOString(),
      } as ClientData);
    },
  });

  // Actualizar cliente
  const updateClientMutation = useMutation({
    mutationFn: ({
      countryId,
      data,
    }: {
      countryId: string;
      data: Partial<CreateClientPayload>;
    }) => clientService.updateClient(countryId, data, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client'] });
    },
  });

  return {
    createClient: createClientMutation.mutate,
    isCreatingClient: createClientMutation.isLoading,
    createClientError: createClientMutation.error,
    createClientSuccess: createClientMutation.isSuccess,
    createClientData: createClientMutation.data,
    updateClient: updateClientMutation.mutate,
    isUpdatingClient: updateClientMutation.isLoading,
    updateClientError: updateClientMutation.error,
    updateClientSuccess: updateClientMutation.isSuccess,
    updateClientData: updateClientMutation.data,
  };
}
