import { PurchaseOrdersTable } from '@/components/purchases/purchaseOrdersTable.component';

export default function PurchaseOrdersPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Órdenes de Compra
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Preórdenes de compra ya aprobadas -- generaron su orden y sus
          transacciones reales.
        </p>
      </div>
      <PurchaseOrdersTable lockedStatus="approved" />
    </section>
  );
}
