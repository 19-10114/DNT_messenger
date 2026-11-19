import { RetentionsList } from '@/components/expenses/retentionsList.component';

export default function ExpenseRetentionsPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Retenciones
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          IVA e ISLR retenidos a proveedores en los gastos aprobados: lo que se
          le debe al SENIAT.
        </p>
      </div>
      <RetentionsList />
    </section>
  );
}
