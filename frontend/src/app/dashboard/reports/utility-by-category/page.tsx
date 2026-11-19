'use client';

import { CategoryUtilityReport } from '@/components/reports/categoryUtilityReport.component';

export default function CategoryUtilityReportPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Dashboard Gerencial
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Utilidad bruta (ventas − costo de venta, sin gastos operativos) de
          motos, repuestos, servicios y agropecuarios por sucursal, categoría y
          producto, con costeo FIFO / por placa.
        </p>
      </div>

      <CategoryUtilityReport />
    </section>
  );
}
