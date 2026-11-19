'use client';

import { usePurchaseOrder } from '@/hooks/purchases/usePurchaseOrders';
import { PurchaseOrderForm } from '@/components/purchases/purchaseOrderForm.component';

export default function EditPurchaseOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: order, isLoading } = usePurchaseOrder(Number(params.id));

  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Editar Preorden de Compra #{params.id}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Modificá la preorden mientras esté pendiente de aprobación.
        </p>
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando preorden...</p>
      ) : order ? (
        order.status === 'approved' || order.status === 'rejected' ? (
          <p className="text-sm text-destructive">
            {order.status === 'approved'
              ? 'Esta preorden ya fue aprobada y no se puede editar.'
              : 'Esta preorden fue rechazada y queda como registro histórico -- no se puede editar.'}
          </p>
        ) : (
          <PurchaseOrderForm editOrder={order} />
        )
      ) : (
        <p className="text-sm text-destructive">Preorden no encontrada.</p>
      )}
    </section>
  );
}
