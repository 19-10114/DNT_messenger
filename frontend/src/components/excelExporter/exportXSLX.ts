'use client';

import { formatDate } from '@/lib/utils';
import * as XLSX from 'xlsx';

export interface ExportData {
  [key: string]: string | number;
}

export function exportToXLSX(data: ExportData[], fileName: string) {
  const today = new Date();
  const pageName = formatDate(today).replaceAll('/', '-');

  try {
    if (data.length === 0) {
      throw new Error('No hay datos para exportar.');
    }

    const headers: string[] = Object.keys(data[0]);
    const dataArray: any[][] = [headers];

    data.forEach((item) => {
      const rowData = headers.map((header) => {
        const value = item[header];
        // return typeof value === 'number' ? formatCurrency(value) : value;
        return value;
      });

      dataArray.push(rowData);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataArray);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `Pagos de ${pageName}`);

    XLSX.writeFile(
      wb,
      fileName
        ? `${fileName} de ${formatDate(today)}.xlsx`
        : `Pagos de ${formatDate(today)}.xlsx`
    );
  } catch (error: any) {
    console.error('Error exporting to XLSX:', error.message);
  }
}
