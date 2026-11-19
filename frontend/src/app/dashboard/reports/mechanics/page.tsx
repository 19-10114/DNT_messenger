'use client';

import { MechanicsReportTable } from '@/components/tables/mechanicsReportTable.component';

export default function MechanicsReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Reporte de Mecánicos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Métricas y KPIs de mecánicos, incluyendo reparaciones, mantenimientos
          y otros indicadores clave.
        </p>
      </div>

      <MechanicsReportTable />
    </section>
  );
}
