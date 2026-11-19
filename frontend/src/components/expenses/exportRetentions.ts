'use client';

import * as XLSX from 'xlsx';
import { RetentionLine } from '@/services/expenses/types/Expense.type';
import { PERSON_TYPE_LABELS } from '@/components/suppliers/supplier.utils';
import { formatExpenseDate } from './expense.utils';

type Row = Record<string, string | number>;

const round = (value: number) => Math.round(value * 100) / 100;

/** A Bs: el monto si el gasto es en Bs; si no, a la tasa del gasto. */
function toBs(line: RetentionLine, amount: number): number {
  return round(
    line.expense.currency === 'BS' ? amount : amount * line.expense.rate
  );
}

function common(line: RetentionLine): Row {
  return {
    Fecha: formatExpenseDate(line.expense.expenseDate),
    'RIF proveedor': line.supplier?.rif ?? '',
    Proveedor: line.supplier?.name ?? '',
    'N° de factura': line.expense.invoiceNumber,
    'N° de control': line.expense.controlNumber,
  };
}

function trailing(line: RetentionLine): Row {
  return {
    'Moneda original': line.expense.currency === 'BS' ? 'Bs' : 'USD',
    'Monto original': line.amount,
    'Tasa Bs/USD': line.expense.rate,
    Gasto: line.expense.displayCode,
    Sucursal: line.expense.branch.name,
  };
}

function ivaRow(line: RetentionLine): Row {
  const invoice = line.expense.invoice;
  return {
    ...common(line),
    'Total factura (Bs)': toBs(line, invoice.total),
    'Base imponible (Bs)': toBs(line, invoice.base),
    '% IVA': invoice.ivaRate ?? '',
    'IVA de la factura (Bs)': toBs(line, line.baseAmount),
    '% retenido': line.rateApplied,
    'IVA retenido (Bs)': line.amountBs,
    ...trailing(line),
  };
}

function islrRow(line: RetentionLine): Row {
  return {
    ...common(line),
    'Tipo de persona': line.supplier
      ? PERSON_TYPE_LABELS[line.supplier.personType]
      : '',
    Concepto: line.supplier?.islrConcept ?? '',
    'Base imponible (Bs)': toBs(line, line.baseAmount),
    '% retenido': line.rateApplied,
    'ISLR retenido (Bs)': line.amountBs,
    ...trailing(line),
  };
}

function sheet(rows: Row[], totalColumn: string): XLSX.WorkSheet {
  const total = round(
    rows.reduce((sum, row) => sum + (Number(row[totalColumn]) || 0), 0)
  );
  const withTotal = rows.length
    ? [...rows, { Fecha: 'TOTAL', [totalColumn]: total }]
    : [{ Fecha: 'Sin retenciones en el período' }];
  return XLSX.utils.json_to_sheet(withTotal);
}

/**
 * Excel de retenciones con dos hojas, las columnas que pide la declaración:
 * "Retenciones IVA" y "Retenciones ISLR", montos en Bs y una fila de total.
 */
export function exportRetentionsToXLSX(
  lines: RetentionLine[],
  branchName: string,
  period: { startDate?: string; endDate?: string }
) {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(
      lines.filter((line) => line.lineType === 'ret_iva').map(ivaRow),
      'IVA retenido (Bs)'
    ),
    'Retenciones IVA'
  );
  XLSX.utils.book_append_sheet(
    workbook,
    sheet(
      lines.filter((line) => line.lineType === 'ret_islr').map(islrRow),
      'ISLR retenido (Bs)'
    ),
    'Retenciones ISLR'
  );
  const slug = branchName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .toLowerCase();
  const range = [period.startDate, period.endDate].filter(Boolean).join('_');
  XLSX.writeFile(
    workbook,
    `retenciones_${slug}${range ? `_${range}` : ''}.xlsx`
  );
}
