import { PurchaseOrderForm } from '@/components/purchases/purchaseOrderForm.component';

export default function NewPurchaseOrderPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Crear Preorden de Compra
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Elegí motos o repuestos y armá el carrito a comprar. Al confirmar,
          la preorden queda pendiente de aprobación.
        </p>
      </div>
      <PurchaseOrderForm />
    </section>
  );
}
