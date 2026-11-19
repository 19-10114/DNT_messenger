import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { ProductsService } from '@/services/products/products.service';
import { UsersService } from '@/services/users/users.service';
import {
  BikeServicesService,
  BikeServiceTransactionPayload,
} from '@/services/bikeServices/bikeServices.service';
import { OrderService } from '@/services/orders/orders.service';
import { OrderData } from '@/services/orders/types/Order.type';
import {
  GPS_AVAILABLE_UNITS_QUERY_KEY,
  GPS_UNITS_QUERY_KEY,
} from '@/hooks/gps/gpsQueryKeys';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

const transactionService = new TransactionService();
const productsService = new ProductsService();
const usersService = new UsersService();
const bikeServicesService = new BikeServicesService();
const orderService = new OrderService();

// SKUs of the two "servicio" products these bike services are billed against.
export const BIKE_SERVICE_SKUS = {
  activation: 'SERV-ACTIVACION',
  gps: 'SERV-GPS-INSTALL',
} as const;

export type BikeServiceKind = keyof typeof BIKE_SERVICE_SKUS;

/**
 * Fetches the "servicio" product (id, cost, price) behind a bike service kind
 * (activation / gps) by its SKU, so we don't hardcode product ids.
 */
export function useBikeServiceProduct(kind: BikeServiceKind) {
  const token = useToken();
  const sku = BIKE_SERVICE_SKUS[kind];

  return useQuery({
    queryKey: ['bikeServiceProduct', sku],
    queryFn: async () => {
      const response = await productsService.getProductBySku(
        token as string,
        sku
      );
      return response.data;
    },
    enabled: !!token,
    staleTime: 1000 * 60 * 10,
  });
}

/**
 * Lists all users with role "mechanic", used to populate the "who did this"
 * select when logging a bike activation / GPS install.
 */
export function useMechanics() {
  const token = useToken();

  return useQuery({
    queryKey: ['mechanics'],
    queryFn: async () => {
      const response = await usersService.getUsers(
        token as string,
        'mechanic',
        '0',
        {
          pageSize: '100',
        }
      );
      return response.results || [];
    },
    enabled: !!token,
  });
}

/**
 * Full transaction history (purchase, sale, services, etc.) for a single bike, by plate.
 */
export function useBikeServiceHistory(plate?: string) {
  const token = useToken();

  return useQuery({
    queryKey: ['bikeServiceHistory', plate],
    queryFn: () =>
      transactionService.getBikeServiceHistory(token, plate as string),
    enabled: !!token && !!plate,
  });
}

/** Variables de `useCreateBikeService`: el cuerpo del servicio y, si es una
 * instalación de GPS, el IMEI de la unidad que se está montando. */
export interface CreateBikeServiceVariables {
  payload: BikeServiceTransactionPayload;
  /** Solo para la instalación de GPS; sin él va `NO_IMEI_PLACEHOLDER`. */
  imei?: string;
}

/**
 * Logs a new bike service event (activation / GPS install) as a Transaction,
 * together with the mechanic who performed it.
 *
 * Cuando el servicio es una instalación de GPS, el mismo request deja la unidad
 * en `installed` y lo replica en Arranca (el backend lo hace en una sola
 * transacción), así que las cachés de GPS quedan viejas y hay que invalidarlas:
 * la unidad recién instalada no puede seguir ofreciéndose como disponible.
 */
export function useCreateBikeService(plate?: string) {
  const token = useToken();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ payload, imei }: CreateBikeServiceVariables) =>
      bikeServicesService.createBikeServiceTransaction(
        payload,
        token as string,
        imei
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bikeServiceHistory', plate],
      });
      queryClient.invalidateQueries({ queryKey: [GPS_UNITS_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: [GPS_AVAILABLE_UNITS_QUERY_KEY],
      });
    },
  });
}

/**
 * All bikes that have ever existed (including already-sold ones), for the
 * "any bike by plate" search — unlike the regular bike inventory, which only
 * shows bikes currently on hand. Scoped to the currently selected branch,
 * same as the regular bike inventory (0 = all branches, i.e. super admin).
 */
export function useAllBikesHistory(
  search: string,
  queryParameters: { page?: string; pageSize?: string } = {}
) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const branchId = currentBranchId ?? 0;

  return useQuery({
    queryKey: ['allBikesHistory', branchId, search, queryParameters],
    queryFn: async () => {
      const response = await productsService.getAllBikesHistory(
        token as string,
        String(branchId),
        { ...queryParameters, search }
      );
      return response.data;
    },
    enabled: !!token,
  });
}

/**
 * Fetches the order a bike was sold under (if any), mapped to the shape
 * OrderDetailsModal expects. Used for the bike modal's "Compra/Venta" link.
 */
export function useOrderForBikeSale(orderId?: number | null) {
  const token = useToken();

  return useQuery({
    queryKey: ['orderForBikeSale', orderId],
    queryFn: async (): Promise<OrderData> => {
      const response = await orderService.getOrderById(
        String(orderId),
        token as string
      );
      const order = response.data;
      return {
        id: order.id,
        client:
          order.client && typeof order.client === 'object'
            ? {
                id: order.client.id,
                firstName: order.client.firstName,
                lastName: order.client.lastName,
                phoneNumber: order.client.phoneNumber,
                countryId: order.client.countryId,
              }
            : null,
        seller:
          order.seller && typeof order.seller === 'object'
            ? {
                id: order.seller.id,
                firstName: order.seller.firstName,
                lastName: order.seller.lastName,
              }
            : undefined,
        totalBs: order.totalBs,
        totalUsd: order.totalUsd,
        invoiceNumber: order.invoiceNumber,
        type: order.type,
        notes: order.notes,
        totalInvoiceBs: order.totalInvoiceBs,
        totalInvoiceUsd: order.totalInvoiceUsd,
        paymentMethods: (order.paymentMethods ?? []).map((pm) => ({
          id: pm.id,
          type: pm.type,
          originBank: pm.originBank,
          targetBank: pm.targetBank,
          phoneNumber: pm.phoneNumber,
          originAccount: pm.originAccount,
          targetAccount: pm.targetAccount,
          reference: pm.reference,
          amountUsd: pm.currency === 'USD' ? pm.amount : undefined,
          amountBs: pm.currency === 'BS' ? pm.amount : undefined,
        })),
        createdAt: order.createdAt,
        originBranch: order.originBranch as any,
        targetBranch: order.targetBranch as any,
        billed: true,
      };
    },
    enabled: !!token && !!orderId,
  });
}
