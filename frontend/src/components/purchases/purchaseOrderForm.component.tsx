'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button.component';
import { PurchasePartsCart } from './purchasePartsCart.component';
import { PurchaseBikeCart } from './purchaseBikeCart.component';
import {
  PurchaseOrder,
  PurchaseOrderCategory,
} from '@/services/purchases/types/PurchaseOrder.type';

interface PurchaseOrderFormProps {
  /** Presente = editando una preorden existente. Su categoría queda fija --
   * no se puede convertir una preorden de motos en una de repuestos. */
  editOrder?: PurchaseOrder;
}

/**
 * Vista única para crear (o editar) una preorden de compra, calcada del
 * selector de categoría de `orderForm.component.tsx` (Ventas): tabs arriba,
 * carrito de la categoría elegida debajo. Motos no lleva desglose de
 * impuestos, Repuestos sí -- esa diferencia vive dentro de cada carrito.
 */
export function PurchaseOrderForm({ editOrder }: PurchaseOrderFormProps) {
  const [category, setCategory] = useState<PurchaseOrderCategory>(
    editOrder?.category ?? 'parts'
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 border-b">
        <Button
          variant={category === 'parts' ? 'default' : 'ghost'}
          disabled={!!editOrder}
          onClick={() => setCategory('parts')}
          className="rounded-b-none flex-1 sm:flex-none"
        >
          Repuestos
        </Button>
        <Button
          variant={category === 'bikes' ? 'default' : 'ghost'}
          disabled={!!editOrder}
          onClick={() => setCategory('bikes')}
          className="rounded-b-none flex-1 sm:flex-none"
        >
          Motos
        </Button>
      </div>

      {category === 'parts' ? (
        <PurchasePartsCart editOrder={editOrder} />
      ) : (
        <PurchaseBikeCart editOrder={editOrder} />
      )}
    </section>
  );
}
