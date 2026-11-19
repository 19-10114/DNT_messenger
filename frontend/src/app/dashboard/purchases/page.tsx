import { PurchaseOrdersTable } from '@/components/purchases/purchaseOrdersTable.component';

export default function PurchasesPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Preórdenes de Compra
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización y gestión de las preórdenes de compra de motos y
          repuestos.
        </p>
      </div>
      <PurchaseOrdersTable />
    </section>
  );
}
