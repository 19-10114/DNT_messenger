'use client';

import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import {
  Expense,
  ExpenseCategory,
} from '@/services/expenses/types/Expense.type';
import { ExpenseFilters } from './expensesFilters.component';
import {
  DEDUCTION_LINE_TYPES,
  KIND_LABELS,
  LINE_TYPE_LABELS,
  PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  STATUS_LABELS,
  amountUsdAt,
  formatExpenseDate,
  formatExpenseDateTime,
  userDisplayName,
} from './expense.utils';

/** Columnas con el monto en USD a cada tasa del día (SAL-163). */
function usdAtDayRates(expense: Expense, amount: number): Row {
  const at = (source: 'dolar_bcv' | 'euro_bcv' | 'usdt') => {
    const value = amountUsdAt(expense, amount, source);
    return value === null ? '' : value;
  };
  return {
    'USD a BCV del día': at('dolar_bcv'),
    'USD a euro BCV del día': at('euro_bcv'),
    'USD a USDT del día': at('usdt'),
  };
}

type Row = Record<string, string | number>;

/**
 * Una fila de la hoja "Pagos" por gasto: el pago completo (neto de las
 * líneas). Montos como número para poder sumarlos.
 */
function toPaymentRow(expense: Expense): Row {
  return {
    ID: expense.id,
    Código: expense.displayCode,
    'Fecha del gasto': formatExpenseDate(expense.expenseDate),
    'Fecha de registro': formatExpenseDateTime(expense.createdAt),
    Sucursal: expense.branch.name,
    'Categoría principal': expense.category.name,
    Líneas: expense.lines.length,
    Concepto: expense.concept,
    Beneficiario: expense.beneficiary,
    Proveedor: expense.supplier?.name ?? '',
    RIF: expense.supplier?.rif ?? '',
    'N° de factura': expense.invoiceNumber ?? '',
    'N° de control': expense.controlNumber ?? '',
    'Base imponible': expense.invoice?.base ?? '',
    IVA: expense.invoice?.iva ?? 0,
    'Total factura': expense.invoice?.total ?? '',
    'Retenido IVA': expense.invoice?.retainedIva ?? 0,
    'Retenido ISLR': expense.invoice?.retainedIslr ?? 0,
    Monto: expense.amount,
    Moneda: expense.currency === 'BS' ? 'Bs' : 'USD',
    'Tasa Bs/USD': expense.currency === 'BS' ? expense.rate : '',
    'Tipo de tasa':
      expense.currency === 'BS' && expense.rateType
        ? RATE_TYPE_LABELS[expense.rateType]
        : '',
    'Monto USD': expense.amountUsd,
    ...usdAtDayRates(expense, expense.amount),
    'Tipo de pago': PAYMENT_METHOD_LABELS[expense.paymentMethod],
    'Descuenta caja':
      expense.paymentMethod === 'efectivo_usd' && !expense.excludedFromCash
        ? 'Sí'
        : 'No',
    Referencia: expense.reference,
    Teléfono: expense.phoneNumber,
    'Banco origen': expense.originBank,
    'Banco destino': expense.targetBank,
    'Cuenta origen': expense.originAccount,
    'Cuenta destino': expense.targetAccount,
    Estado: STATUS_LABELS[expense.status],
    'Registrado por': userDisplayName(expense.createdBy),
    'Aprobado por': expense.approvedBy
      ? userDisplayName(expense.approvedBy)
      : '',
    'Rechazado por': expense.rejectedBy
      ? userDisplayName(expense.rejectedBy)
      : '',
    'Motivo de rechazo': expense.rejectionReason,
    'Anulado por': expense.cancelledBy
      ? userDisplayName(expense.cancelledBy)
      : '',
    'Motivo de anulación': expense.cancelReason,
    Observaciones: expense.notes,
    Comprobantes: expense.receipts.length,
  };
}

/**
 * Una fila de la hoja "Gastos" por línea: cada categoría con su monto, más los
 * datos del gasto al que pertenece. Los descuentos van con monto negativo, así
 * la suma de la hoja es lo pagado.
 */
function toLineRows(expense: Expense): Row[] {
  return expense.lines.map((line) => {
    const sign = DEDUCTION_LINE_TYPES.includes(line.lineType) ? -1 : 1;
    return {
      ID: expense.id,
      Código: expense.displayCode,
      Estado: STATUS_LABELS[expense.status],
      'Fecha del gasto': formatExpenseDate(expense.expenseDate),
      Sucursal: expense.branch.name,
      Cuenta: line.category.accountCode,
      Categoría: line.category.name,
      Tipo: KIND_LABELS[line.category.kind],
      Línea: LINE_TYPE_LABELS[line.lineType],
      'Concepto de la línea': line.concept,
      'Concepto del gasto': expense.concept,
      Beneficiario: expense.beneficiary,
      Monto: sign * line.amount,
      Moneda: expense.currency === 'BS' ? 'Bs' : 'USD',
      'Monto USD': sign * line.amountUsd,
      ...Object.fromEntries(
        Object.entries(usdAtDayRates(expense, line.amount)).map(
          ([key, value]) => [key, value === '' ? '' : sign * Number(value)]
        )
      ),
      'Tipo de pago': PAYMENT_METHOD_LABELS[expense.paymentMethod],
      'Registrado por': userDisplayName(expense.createdBy),
    };
  });
}

/** Ancho de cada columna según su contenido más largo (tope 50). */
function sheetFrom(rows: Row[]) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const headers = Object.keys(rows[0] ?? {});
  sheet['!cols'] = headers.map((header) => ({
    wch: Math.min(
      50,
      Math.max(
        header.length,
        ...rows.map((row) => String(row[header] ?? '').length)
      ) + 2
    ),
  }));
  return sheet;
}

/** Los filtros aplicados, en palabras, para la segunda hoja. */
function describeFilters(
  filters: ExpenseFilters,
  branchName: string,
  categories: ExpenseCategory[]
): string[][] {
  const category = categories.find(
    (item) => String(item.id) === filters.category
  );
  const status =
    filters.status === 'all'
      ? 'Todos'
      : filters.status === 'mine_pending'
        ? 'Registrados y mis pendientes'
        : filters.status === 'requests'
          ? 'Pendientes y rechazados'
          : STATUS_LABELS[filters.status ?? 'registered'];
  return [
    ['Filtro', 'Valor'],
    ['Sucursal', branchName],
    [
      'Desde',
      filters.startDate ? formatExpenseDate(filters.startDate) : 'Todas',
    ],
    ['Hasta', filters.endDate ? formatExpenseDate(filters.endDate) : 'Todas'],
    ['Categoría', category ? category.name : 'Todas'],
    ['Tipo', filters.kind ? KIND_LABELS[filters.kind] : 'Todos'],
    [
      'Tipo de pago',
      filters.paymentMethod === 'cash'
        ? 'Solo efectivo'
        : filters.paymentMethod
          ? PAYMENT_METHOD_LABELS[filters.paymentMethod]
          : 'Todos',
    ],
    ['Estado', status],
    ['Búsqueda', filters.search || '-'],
    ['Exportado', formatExpenseDateTime(new Date().toISOString())],
  ];
}

/**
 * Descarga un .xlsx con los gastos (ya filtrados) en tres hojas: "Gastos",
 * una fila por línea (para sumar por categoría); "Pagos", una por gasto (para
 * sumar lo pagado sin repetir); y "Filtros", qué se exportó. Nombre:
 * `gastos_<sucursal>_<fecha>.xlsx`.
 */
export function exportExpensesToXLSX(
  expenses: Expense[],
  filters: ExpenseFilters,
  branchName: string,
  categories: ExpenseCategory[]
) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    sheetFrom(expenses.flatMap(toLineRows)),
    'Gastos'
  );
  XLSX.utils.book_append_sheet(
    book,
    sheetFrom(expenses.map(toPaymentRow)),
    'Pagos'
  );
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet(describeFilters(filters, branchName, categories)),
    'Filtros'
  );

  const safeBranch = branchName
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
  XLSX.writeFile(
    book,
    `gastos_${safeBranch || 'sucursal'}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`
  );
}
