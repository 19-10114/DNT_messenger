'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useRoles, useToken } from '@/stores/auth/auth.store';
import { OrderService } from '@/services/orders/orders.service';
import { TransactionService } from '@/services/transactions/transactions.service';

const ordersService = new OrderService();
const transactionsService = new TransactionService();

/**
 * Claves de consulta que un revert deja desactualizadas.
 *
 * Revertir un movimiento no toca una sola pantalla: deshace stock, deuda entre
 * sucursales, caja, saldo a favor del cliente y -- si la moto deja de existir --
 * el inventario de motos. Invalidar de menos deja al usuario mirando números
 * que el backend ya cambió, que es justo el estado de confusión que este
 * botón existe para resolver.
 */
const AFFECTED_QUERY_KEYS = [
  'transactions',
  'orders',
  'partOrders',
  'deliveryNotes',
  'bikeInventory',
  'partInventory',
  'branchOrderBalance',
  'branchOrderCash',
  'ordersDebt',
  'branchOrderTotalDebt',
  'clientBalance',
  'arrancaBalance',
  'purchaseOrders',
];

/** El rol que puede revertir. Espeja `REVERT_ROLES` del backend. */
export function useCanRevert(): boolean {
  const roles = useRoles();
  // Coincidencia exacta, igual que `has_role` en el backend: `administrator` y
  // `parts_admin` son roles distintos y menos privilegiados.
  return roles.includes('admin');
}

function useRevertMutation(
  mutationFn: (variables: {
    id: number | string;
    reason: string;
  }) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      AFFECTED_QUERY_KEYS.forEach((queryKey) =>
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      );
    },
  });
}

/** Revierte una transacción suelta (sin orden asociada). */
export function useRevertTransaction() {
  const token = useToken();
  const mutation = useRevertMutation(({ id, reason }) =>
    transactionsService.revertTransaction(id, reason, token as string)
  );

  return {
    revertTransaction: mutation.mutate,
    isRevertingTransaction: mutation.isLoading,
    revertTransactionError: mutation.error,
  };
}

/** Revierte una orden completa y todas sus líneas. */
export function useRevertOrder() {
  const token = useToken();
  const mutation = useRevertMutation(({ id, reason }) =>
    ordersService.revertOrder(String(id), reason, token as string)
  );

  return {
    revertOrder: mutation.mutate,
    isRevertingOrder: mutation.isLoading,
    revertOrderError: mutation.error,
  };
}
