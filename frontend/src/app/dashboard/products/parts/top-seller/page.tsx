'use client';

import TopPartsTable from '@/components/tables/topPartsTable.component';

export default function TopPartsTestPage() {
  return (
    <div className="container mx-auto py-4 px-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Repuestos más Vendidos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización de los repuestos más vendidos en un período de tiempo
          determinado.
        </p>
      </div>

      <TopPartsTable />
    </div>
  );
}
