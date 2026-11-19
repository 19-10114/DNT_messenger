'use client';

import { PartsReportTable } from '@/components/tables/partsReportTable.component';

export default function PartsReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Reporte de Repuestos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Métricas y KPIs de repuestos, incluyendo inventario, compras y otros
          indicadores clave.
        </p>
      </div>

      <PartsReportTable />
    </section>
  );
}
