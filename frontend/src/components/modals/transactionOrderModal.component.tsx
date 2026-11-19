'use client';

import { useOrderForBikeSale } from '@/hooks/useBikeService';
import { usePurchaseOrderByOrder } from '@/hooks/purchases/usePurchaseOrders';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { PurchaseOrderDetailModal } from '@/components/purchases/purchaseOrderDetailModal.component';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';

interface TransactionOrderModalProps {
  orderId: number | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * La orden que originó una transacción, abierta desde su detalle. Un
 * `Order` puede ser de venta o de compra (§3.11 backend ARCHITECTURE.md) y
 * cada uno tiene su propia ficha ya construida en otro módulo -- acá solo
 * se decide cuál mostrar según `order.type`, en vez de duplicar ninguna:
 * - `sale` -> `OrderDetailsModal` (Ventas), igual que ya reusan
 *   `bikeDetailsModal`/`partsReportTable`/`clientDetailModal` con
 *   `useOrderForBikeSale`.
 * - `purchase` -> `PurchaseOrderDetailModal` (Preórdenes de Compra), vía
 *   `usePurchaseOrderByOrder` (reverse de `resulting_order`), de solo
 *   lectura acá -- no corresponde editar/aprobar desde el detalle de una
 *   transacción.
 */
export function TransactionOrderModal({
  orderId,
  open,
  onOpenChange,
}: TransactionOrderModalProps) {
  const { data: order, isLoading: isLoadingOrder } = useOrderForBikeSale(
    open ? orderId : null
  );
  const isPurchase = order?.type === 'purchase';
  const { data: purchaseOrder, isLoading: isLoadingPurchaseOrder } =
    usePurchaseOrderByOrder(orderId ?? undefined, open && isPurchase);

  if (!open) return null;

  const isResolving = isLoadingOrder || (isPurchase && isLoadingPurchaseOrder);
  if (isResolving) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent width="400px">
          <DialogHeader>
            <DialogTitle>Cargando orden...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  if (isPurchase) {
    return (
      <PurchaseOrderDetailModal
        purchaseOrder={purchaseOrder ?? null}
        open={open}
        onOpenChange={onOpenChange}
      />
    );
  }

  return (
    <OrderDetailsModal
      order={order ?? null}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
