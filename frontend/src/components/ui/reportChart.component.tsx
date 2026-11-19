'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ReportChartProps {
  option: echarts.EChartsOption;
  height?: number;
  ariaLabel: string;
}

/**
 * Un gráfico de ECharts que sigue a su contenedor.
 *
 * Se inicia una vez, recibe cada `option` nueva con `notMerge` —así una serie
 * que desaparece al cambiar de filtro no se queda pintada— y se redimensiona
 * con el contenedor, no sólo con la ventana: los paneles del reporte cambian
 * de ancho al pasar de dos columnas a una.
 */
export default function ReportChart({
  option,
  height = 280,
  ariaLabel,
}: ReportChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = echarts.init(containerRef.current);
    chartRef.current = chart;

    const observer = new ResizeObserver(() => chart.resize());
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, true);
  }, [option]);

  return (
    <div
      ref={containerRef}
      role="img"
      aria-label={ariaLabel}
      style={{ height }}
      className="w-full"
    />
  );
}
