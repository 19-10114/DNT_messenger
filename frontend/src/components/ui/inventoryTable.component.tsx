import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table.component';
import { formatDate } from '@/lib/utils';
import { Button } from './button.component';
import { useRouter } from 'next/navigation';

interface InventoryTableProps {
  /**
   * The data to be displayed in the table. Each object represents a row in the table,
   * and the keys of the first object determine the columns.
   */
  data: Array<Record<string, number | string | boolean>>;

  /**
   * Optional array of column names that should be rendered as checkboxes (boolean values)
   * If not provided, all boolean values will be displayed as text "true" or "false"
   */
  booleanColumns?: string[];

  /**
   * Callback function called when a checkbox is toggled
   * @param rowIndex - The index of the row being modified
   * @param column - The name of the column being modified
   * @param newValue - The new boolean value
   */
  onBooleanChange?: (
    rowIndex: number,
    column: string,
    newValue: boolean
  ) => void;

  /**
   * Optional flag to indicate if boolean changes are being processed
   * Used to disable checkboxes during API calls
   */
  isProcessing?: boolean;

  /**
   * Optional button configuration
   */
  buttonConfig?: {
    label: string;
    onClick: (row: Record<string, number | string | boolean>) => void;
  };
}

/**
 * A dynamic table component that automatically adjusts its columns and rows
 * based on the provided data. Supports rendering boolean values as checkboxes.
 */

export function InventoryTable({
  data,
  booleanColumns = [],
  onBooleanChange,
  isProcessing = false,
  buttonConfig,
}: InventoryTableProps): JSX.Element {
  const router = useRouter();
  if (!data || data.length === 0) return <p>No hay datos para mostrar.</p>;

  // Extract column names dynamically from the first object in the data array
  const columns = Object.keys(data[0]);

  // Helper function to determine if a cell should be rendered as a checkbox
  const isCheckboxCell = (column: string, value: any): boolean => {
    return booleanColumns.includes(column) && typeof value === 'boolean';
  };

  // Handler for checkbox changes
  const handleCheckboxChange = (
    rowIndex: number,
    column: string,
    currentValue: boolean
  ) => {
    if (onBooleanChange && !isProcessing) {
      onBooleanChange(rowIndex, column, !currentValue);
    }
  };

  return (
    <section className="overflow-x-auto">
      <Table className="min-w-full border-collapse border border-gray-300">
        <TableHeader>
          <TableRow className="bg-primary text-white text-xs font-medium uppercase tracking-wider">
            {columns.map((column, index) => (
              <TableHead key={index} className="p-2 text-white text-center w-2">
                {column.replace(/_/g, ' ')}
              </TableHead>
            ))}
            {buttonConfig && (
              <TableHead className="p-2 text-white text-center w-2">
                Acciones
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columns.map((column, colIndex) => (
                <TableCell
                  key={colIndex}
                  className="border border-gray-300 px-4 py-2 text-sm text-gray-600 text-center"
                >
                  {isCheckboxCell(column, row[column]) ? (
                    <input
                      aria-label="checkbox"
                      type="checkbox"
                      checked={Boolean(row[column])}
                      onChange={() =>
                        handleCheckboxChange(
                          rowIndex,
                          column,
                          Boolean(row[column])
                        )
                      }
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      disabled={isProcessing}
                    />
                  ) : typeof row[column] === 'string' &&
                    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
                      row[column] as string
                    ) ? (
                    formatDate(row[column] as string)
                  ) : (
                    row[column]
                  )}
                </TableCell>
              ))}
              {buttonConfig && (
                <TableCell className="border border-gray-300 px-4 py-2 text-sm text-center">
                  <button
                    onClick={() => buttonConfig.onClick(row)}
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                  >
                    {buttonConfig.label}
                  </button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </section>
  );
}
