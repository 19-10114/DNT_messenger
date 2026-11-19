'use client';
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.component';
import {
  ExportData,
  exportToXLSX,
} from '@/components/excelExporter/exportXSLX';
import { Button } from '@/components/ui/button.component';

type GenericTableProps<T> = {
  data: T[];
  columns: string[];
  onRowClick?: (column: string, row: T) => void;
  keyField: keyof T;
  fileName?: string;
};

function TableForLocations<T>({
  data,
  columns,
  onRowClick,
  keyField,
  fileName,
}: GenericTableProps<T>) {
  const totalFooterSummary = columns.reduce(
    (acc: Record<string, number>, column) => {
      if (column === 'Fecha') return acc;
      acc[column] = data.reduce((sum: number, row: T) => {
        const value = row[column as keyof T];
        return typeof value === 'number' ? sum + value : sum;
      }, 0);
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <>
      <div className="py-4">
        <Button
          onClick={() => exportToXLSX(data as ExportData[], fileName || '')}
        >
          Descargar XLSX
        </Button>
      </div>
      <Table className="min-w-full table-auto border-collapse border">
        <TableHeader className="bg-primary text-white text-center text-xs font-medium uppercase tracking-wider">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead
                key={index}
                className="p-2 text-white text-center font-bold"
              >
                {(typeof column === 'string' ? column : String(column)).replace(
                  /_/g,
                  ' '
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              className="hover:bg-gray-400"
              key={row[keyField] as React.Key}
            >
              {columns.map((column, cellIndex) => (
                <TableCell className="text-center" key={cellIndex}>
                  {column === 'Fecha' || row[column as keyof T] === 0 ? (
                    (row[column as keyof T] as number | string)
                  ) : (
                    <button
                      type="button"
                      onClick={() => onRowClick && onRowClick(column, row)}
                      className="text-green-500 hover:underline"
                    >
                      {row[column as keyof T] as number | string}
                    </button>
                  )}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="font-bold text-center">Totales</TableCell>
            {columns.slice(1).map((column, index) => (
              <TableCell key={index} className="font-bold text-center">
                {totalFooterSummary[column]}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      </Table>
    </>
  );
}

export default TableForLocations;
