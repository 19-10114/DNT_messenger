import SalesReport from '@/components/reports/salesReport.component';

export default function SalesReportsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Reporte de Ventas
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          KPIs y métricas de ventas, en un rango de fecha escogido.
        </p>
      </div>
      <SalesReport />
    </div>
  );
}
