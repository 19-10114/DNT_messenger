'use client';

import { ArrancaMcReport } from '@/components/arrancaMcReport/arrancaMcReport.component';

export default function ArrancaMcReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Arranca - MC
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Balance, motos y GPS compartidos con Arranca, desde el lado de Moto
          Candela.
        </p>
      </div>

      <ArrancaMcReport />
    </section>
  );
}
