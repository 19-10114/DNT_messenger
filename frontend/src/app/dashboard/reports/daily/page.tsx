import DailyReport from '@/components/reports/dailyReport.component';

export default function DailyReportsPage() {
  return (
    <div className="p-6 space-y-4">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Reporte Diario
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Métricas diarias, en un día específico, incluyendo ventas, ingresos,
          gastos y otros indicadores clave.
        </p>
      </div>
      <DailyReport />
    </div>
  );
}
