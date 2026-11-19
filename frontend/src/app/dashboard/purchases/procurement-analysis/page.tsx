'use client';

import { ProcurementAnalysis } from '@/components/purchases/procurementAnalysis.component';

export default function ProcurementAnalysisPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Procura de Repuestos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Qué repuestos comprar en tu sucursal y con qué urgencia, según demanda
          real (descontando días sin stock), rotación y qué tan activos están
          los modelos de moto que los usan.
        </p>
      </div>

      <ProcurementAnalysis />
    </section>
  );
}
