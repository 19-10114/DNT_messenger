'use client';

import { ArrancaBalanceReport } from '@/components/arrancaBalance/arrancaBalanceReport.component';

export default function ArrancaBalanceReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Balance Arranca
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Movimientos de dinero entre Moto Candela y Arranca, del más reciente
          al más antiguo.
        </p>
      </div>

      <ArrancaBalanceReport />
    </section>
  );
}
