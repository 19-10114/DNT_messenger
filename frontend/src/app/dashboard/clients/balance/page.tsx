import { ClientBalanceSummaryTable } from '@/components/clients/ClientBalanceSummaryTable.component';
import { ClientBalanceSearch } from '@/components/clients/ClientBalanceSearch.component';

export default function ClientBalancePage() {
  return (
    <section className="space-y-10">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2 text-primary font-serif">
            Saldo de Clientes
          </h1>
          <p className="text-sm text-muted-foreground">
            Todos los clientes con saldo de abono (lo que depositaron menos lo
            que ya usaron para pagar órdenes), ordenados de mayor a menor.
          </p>
        </div>
        <ClientBalanceSummaryTable />
      </div>

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-primary font-serif">
            Buscar un cliente puntual
          </h2>
          <p className="text-sm text-muted-foreground">
            Por nombre, apellido o cédula, con el historial completo de
            movimientos.
          </p>
        </div>
        <ClientBalanceSearch />
      </div>
    </section>
  );
}
