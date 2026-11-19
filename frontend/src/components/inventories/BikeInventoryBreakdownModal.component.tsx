'use client';

import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import ReportChart from '@/components/ui/reportChart.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { usdFormatCurrency } from '@/lib/utils';
import type {
  BikeBranchSummary,
  BikeInventorySummary,
  BikeModelSummary,
} from '@/services/products/types';
import {
  formatUnits,
  formatValue,
  modelLabel,
  sumValues,
} from './inventorySummary.utils';

interface BikeInventoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: BikeInventorySummary | undefined;
  /** Columnas de valor: solo super admin. */
  showValue: boolean;
  /** Pestaña "Por sede": super admin viendo la sede 0. */
  showBranches: boolean;
  /** "nuevas" / "usadas", para el subtítulo. */
  scopeLabel: string;
}

/**
 * Desglose del KPI de motos: cantidad (y valor) por modelo y, para el super
 * admin en la sede 0, por sede con un gráfico de barras.
 */
export function BikeInventoryBreakdownModal({
  isOpen,
  onClose,
  summary,
  showValue,
  showBranches,
  scopeLabel,
}: BikeInventoryBreakdownModalProps) {
  const models = summary?.models ?? [];
  const branches = useMemo(() => summary?.branches ?? [], [summary]);

  const modelColumns: GenericTableColumn<BikeModelSummary>[] = [
    {
      key: 'model',
      header: 'Modelo',
      render: (row) => modelLabel(row.model),
      footer: 'Total',
    },
    { key: 'brand', header: 'Marca' },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'center',
      render: (row) => formatUnits(row.quantity),
      footer: formatUnits(summary?.totalUnits ?? 0),
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      hidden: !showValue,
      render: (row) => formatValue(row.value),
      footer: formatValue(summary?.totalValue),
    },
  ];

  const branchColumns: GenericTableColumn<BikeBranchSummary>[] = [
    { key: 'branchName', header: 'Sede', footer: 'Total' },
    {
      key: 'quantity',
      header: 'Cantidad',
      align: 'center',
      render: (row) => formatUnits(row.quantity),
      footer: formatUnits(summary?.totalUnits ?? 0),
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      render: (row) => formatValue(row.value),
      footer: formatValue(sumValues(branches)),
    },
  ];

  const modelExport = models.map((row) => ({
    Modelo: modelLabel(row.model),
    Marca: row.brand,
    Cantidad: row.quantity,
    ...(showValue && { Valor: row.value ?? 0 }),
  }));

  const branchExport = branches.map((row) => ({
    Sede: row.branchName,
    Cantidad: row.quantity,
    Valor: row.value ?? 0,
  }));

  // Barras horizontales ordenadas por valor: con ~20 sedes los nombres no
  // caben en un eje horizontal sin rotarlos.
  const branchChart = useMemo<EChartsOption>(() => {
    const sorted = [...branches].sort(
      (a, b) => (a.value ?? 0) - (b.value ?? 0)
    );
    return {
      grid: { left: 8, right: 90, top: 8, bottom: 8, containLabel: true },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (value) => usdFormatCurrency(Number(value)),
      },
      xAxis: { type: 'value', axisLabel: { show: false } },
      yAxis: {
        type: 'category',
        data: sorted.map((row) => row.branchName),
        axisLabel: { fontSize: 11 },
      },
      series: [
        {
          name: 'Valor',
          type: 'bar',
          data: sorted.map((row) => row.value ?? 0),
          barMaxWidth: 18,
          itemStyle: { color: '#365fda', borderRadius: [0, 4, 4, 0] },
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            formatter: ({ value }) => usdFormatCurrency(Number(value)),
          },
        },
      ],
    };
  }, [branches]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent width="min(960px, 95vw)" maxHeight="90vh">
        <DialogHeader>
          <DialogTitle>Inventario de motos</DialogTitle>
          <DialogDescription>
            {formatUnits(summary?.totalUnits ?? 0)} motos {scopeLabel}
            {showValue && ` · ${formatValue(summary?.totalValue)} a costo`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="models">
          {showBranches && (
            <TabsList>
              <TabsTrigger value="models">Por modelo</TabsTrigger>
              <TabsTrigger value="branches">Por sede</TabsTrigger>
            </TabsList>
          )}

          <TabsContent value="models">
            <GenericTable
              columns={modelColumns}
              data={models}
              density="compact"
              maxHeight="55vh"
              emptyMessage="No hay motos en inventario"
              toolbar={
                <ExportButton
                  data={modelExport}
                  title="Exportar"
                  fileName={`inventario-motos-por-modelo-${scopeLabel}`}
                />
              }
            />
          </TabsContent>

          {showBranches && (
            <TabsContent value="branches" className="space-y-4">
              {branches.length > 0 && (
                <ReportChart
                  option={branchChart}
                  height={Math.max(240, branches.length * 28)}
                  ariaLabel="Valor del inventario de motos por sede"
                />
              )}
              <GenericTable
                columns={branchColumns}
                data={branches}
                getRowKey={(row) => row.branchId}
                density="compact"
                emptyMessage="No hay motos en inventario"
                toolbar={
                  <ExportButton
                    data={branchExport}
                    title="Exportar"
                    fileName={`inventario-motos-por-sede-${scopeLabel}`}
                  />
                }
              />
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
