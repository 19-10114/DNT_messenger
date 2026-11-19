import { SuppliersPage } from '@/components/suppliers/suppliersPage.component';

export default function ExpenseSuppliersPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Proveedores
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          A quién se le pagan facturas con IVA y retenciones, con su perfil de
          retención.
        </p>
      </div>
      <SuppliersPage />
    </section>
  );
}
