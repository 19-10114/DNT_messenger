'use client';

import { SalesTargetsReport } from '@/components/salesTargets/salesTargetsReport.component';

export default function SalesTargetsReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Metas de ventas
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Meta mensual de motos por sucursal frente a lo vendido, día a día.
        </p>
      </div>

      <SalesTargetsReport />
    </section>
  );
}
