'use client';

import React, { useRef, useEffect } from 'react';
import * as echarts from 'echarts';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { usdFormatCurrency } from '@/lib/utils';
import { BranchInventoryValue } from '@/services/transactions/types/GetAllTransactions';

interface InventoryValueChartProps {
  isOpen: boolean;
  onClose: () => void;
  data: BranchInventoryValue[] | undefined;
  isLoading: boolean;
}

export function InventoryValueChart({
  isOpen,
  onClose,
  data,
  isLoading,
}: InventoryValueChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  // Inicializar gráfico cuando el modal está abierto y hay datos
  useEffect(() => {
    if (!isOpen) return;
    if (!data || data.length === 0) return;
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (!chartRef.current) {
        return;
      }

      const rect = chartRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        setTimeout(() => {
          if (chartRef.current && data && data.length > 0) {
            initChart();
          }
        }, 100);
        return;
      }

      initChart();
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, data, isLoading]);

  const initChart = () => {
    if (!chartRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.dispose();
      chartInstanceRef.current = null;
    }

    try {
      const chartInstance = echarts.init(chartRef.current);
      chartInstanceRef.current = chartInstance;

      // Preparar datos para el gráfico
      const branches = data!.map((item) => item.branch);
      const bikeValues = data!.map((item) => item.bikeInventoryValue);
      const partValues = data!.map((item) => item.inventoryValue);
      const totalValues = data!.map((item) => item.totalInventoryValue);

      const option = {
        title: {
          text: 'Valor de Inventario por Sucursal',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'bold',
          },
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow',
          },
          formatter: (params: any) => {
            const branchData = data![params[0].dataIndex];
            let result = `<div style="font-weight:bold;margin-bottom:8px;">${branchData.branch}</div>`;

            params.forEach((param: any) => {
              const color = param.color;
              const seriesName = param.seriesName;
              const value = param.value;
              result += `
                <div style="margin:4px 0;">
                  <span style="display:inline-block;margin-right:8px;border-radius:50%;width:10px;height:10px;background-color:${color};"></span>
                  ${seriesName}: ${usdFormatCurrency(value)}
                </div>
              `;
            });

            result += `
              <div style="margin:8px 0 0 0;border-top:1px solid #eee;padding-top:8px;">
                <strong>Total Inventario:</strong> ${usdFormatCurrency(branchData.totalInventoryValue)}
              </div>
            `;

            return result;
          },
        },
        legend: {
          data: ['Motos', 'Repuestos'],
          bottom: 40,
          left: 'center',
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '20%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: branches,
          axisLabel: {
            rotate: 45,
            fontSize: 12,
            interval: 0,
          },
        },
        yAxis: {
          type: 'value',
          name: 'Valor (USD)',
          axisLabel: {
            formatter: (value: number) => usdFormatCurrency(value),
          },
        },
        series: [
          {
            name: 'Motos',
            type: 'bar',
            stack: 'total',
            data: bikeValues,
            itemStyle: {
              color: '#365fda',
              borderRadius: [0, 0, 0, 0],
            },
            label: {
              show: false,
            },
          },
          {
            name: 'Repuestos',
            type: 'bar',
            stack: 'total',
            data: partValues,
            itemStyle: {
              color: '#ec8f2b',
              borderRadius: [4, 4, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                return usdFormatCurrency(totalValues[params.dataIndex]);
              },
              fontSize: 10,
            },
          },
        ],
      };

      chartInstance.setOption(option);
      chartInstance.resize();
      chartInstance.on('legendselectchanged', (params: any) => {
        const seriesUpdates = [];

        if (params.selected['Repuestos']) {
          seriesUpdates.push({
            name: 'Motos',
            itemStyle: { borderRadius: [0, 0, 0, 0] },
            label: { show: false },
          });
        } else {
          seriesUpdates.push({
            name: 'Motos',
            itemStyle: { borderRadius: [4, 4, 0, 0] },
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                return usdFormatCurrency(bikeValues[params.dataIndex]);
              },
              fontSize: 10,
            },
          });
        }

        if (params.selected['Motos']) {
          seriesUpdates.push({
            name: 'Repuestos',
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                return usdFormatCurrency(totalValues[params.dataIndex]);
              },
              fontSize: 10,
            },
          });
        } else {
          seriesUpdates.push({
            name: 'Repuestos',
            label: {
              show: true,
              position: 'top',
              formatter: (params: any) => {
                return usdFormatCurrency(partValues[params.dataIndex]);
              },
              fontSize: 10,
            },
          });
        }

        // Aplicar solo las actualizaciones necesarias
        chartInstance.setOption({
          series: seriesUpdates,
        });
      });
    } catch (error) {
      console.error('Error inicializando gráfico:', error);
    }
  };

  // Limpiar gráfico cuando se cierra el modal
  useEffect(() => {
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Manejar resize
  useEffect(() => {
    const handleResize = () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.resize();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Valor de Inventario por Sucursal</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Cargando datos...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Valor de Inventario por Sucursal</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center h-96">
            <div className="text-gray-500 text-center">
              <p>No hay datos disponibles</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <div className="w-full">
          <div
            ref={chartRef}
            style={{ width: '100%', height: '500px', minHeight: '500px' }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
