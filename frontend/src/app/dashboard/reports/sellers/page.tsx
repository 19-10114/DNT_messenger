'use client';

import { SellersReportTable } from '@/components/tables/sellersReportTable.component';

export default function SellersReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Reporte de Vendedores
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Métricas y KPIs de vendedores, incluyendo ventas, ingresos y otros
          indicadores clave.
        </p>
      </div>

      <SellersReportTable />
    </section>
  );
}
