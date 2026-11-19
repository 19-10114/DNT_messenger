import { ExpensesList } from '@/components/expenses/expensesList.component';

export default function ExpenseRequestsPage() {
  return (
    <section className="p-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Pre Gastos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Gastos por aprobar y rechazados. Al aprobarse pasan a Gastos.
        </p>
      </div>
      <ExpensesList mode="requests" />
    </section>
  );
}
