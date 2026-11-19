import axios from 'axios';
import { format } from 'date-fns';
import { formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import {
  Expense,
  ExpenseCurrency,
  ExpenseKind,
  ExpenseLineType,
  ExpensePaymentMethod,
  ExpenseRateType,
  ExpensePaymentMethodTotal,
  ExpenseRateSource,
  ExpenseStatus,
} from '@/services/expenses/types/Expense.type';

export const PAYMENT_METHOD_LABELS: Record<ExpensePaymentMethod, string> = {
  efectivo_usd: 'Efectivo USD',
  efectivo_bs: 'Efectivo Bs',
  transferencia: 'Transferencia Bancaria',
  zelle: 'Zelle',
  binance: 'Binance',
  pago_movil: 'Pago Móvil',
  punto_de_venta: 'Punto de Venta',
};

export const RATE_TYPE_LABELS: Record<ExpenseRateType, string> = {
  dolar_bcv: 'Dólar BCV',
  euro_bcv: 'Euro BCV',
  usdt: 'USDT',
  personalizada: 'Personalizada',
};

/**
 * Los bancos del pago de órdenes (BANKS en
 * components/orders/paymentMethodsSelector.component.tsx, que no se exporta).
 * Copiados para no tocar órdenes: si cambian allá, cambiarlos aquí.
 */
export const BANKS = [
  'Banesco',
  'BNC',
  'Mercantil',
  'Venezuela',
  'Provincial',
  'Bicentenario',
  'Tesoro',
  'Exterior',
  'Caroni',
  'Sofitasa',
  'Activo',
  'Bancamiga',
  'Banplus',
  'Mi Banco (R4)',
  'Otros',
] as const;

export const KIND_LABELS: Record<ExpenseKind, string> = {
  gasto: 'Gasto operativo',
  retiro: 'Retiro de socios',
  anticipo: 'Anticipo / préstamo',
  obligacion: 'Impuestos y aportes',
  traslado: 'Traslado a banco',
  ajuste: 'Ajuste de saldo',
  deduccion: 'Descuento en el pago',
  impuesto: 'IVA de la factura',
  retencion: 'Retención de impuesto',
};

export const STATUS_LABELS: Record<ExpenseStatus, string> = {
  pending_approval: 'Pendiente',
  registered: 'Registrado',
  rejected: 'Rechazado',
  cancelled: 'Anulado',
};

/** Clases del badge de estado (ámbar pendiente, rojo rechazado/anulado). */
export const STATUS_BADGE_CLASSES: Record<ExpenseStatus, string> = {
  pending_approval: 'border-amber-300 bg-amber-100 text-amber-800',
  registered: 'border-transparent bg-secondary text-secondary-foreground',
  rejected: 'border-red-300 bg-red-100 text-red-800',
  cancelled: 'border-red-300 bg-red-50 text-red-700',
};

export const RATE_SOURCE_LABELS: Record<ExpenseRateSource, string> = {
  dolar_bcv: 'Dólar BCV del día',
  euro_bcv: 'Euro BCV del día',
  usdt: 'USDT del día',
};

/** La tasa del día de un gasto para `source`, o `null` si no está guardada. */
export function dayRateOf(
  expense: Pick<Expense, 'dayRates'>,
  source: ExpenseRateSource
): number | null {
  const rates = expense.dayRates;
  if (!rates) return null;
  const value =
    source === 'dolar_bcv'
      ? rates.dolarBcv
      : source === 'euro_bcv'
        ? rates.euroBcv
        : rates.usdt;
  return value && value > 0 ? value : null;
}

/**
 * Un monto del gasto (el total o una línea) en USD a la tasa del día de
 * `source`; `null` si ese día no tiene esa tasa. Un gasto en USD no cambia.
 */
export function amountUsdAt(
  expense: Pick<Expense, 'dayRates' | 'currency'>,
  amount: number,
  source: ExpenseRateSource
): number | null {
  if (expense.currency === 'USD') return amount;
  const rate = dayRateOf(expense, source);
  return rate ? Math.round((amount / rate) * 100) / 100 : null;
}

export const LINE_TYPE_LABELS: Record<ExpenseLineType, string> = {
  cargo: 'Cargo',
  descuento: 'Descuento',
  iva: 'IVA',
  ret_iva: 'Retención IVA',
  ret_islr: 'Retención ISLR',
};

/** Las líneas que restan del pago. */
export const DEDUCTION_LINE_TYPES: ExpenseLineType[] = [
  'descuento',
  'ret_iva',
  'ret_islr',
];

/** "Retención IVA 75 %", "IVA 16 %": la etiqueta de una línea calculada. */
export function computedLineLabel(line: {
  lineType: ExpenseLineType;
  rateApplied: number | null;
}): string {
  const label = LINE_TYPE_LABELS[line.lineType];
  return line.rateApplied !== null ? `${label} ${line.rateApplied} %` : label;
}

/** Fecha local a `YYYY-MM-DD`, el formato de `expense_date`. */
export function toApiDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** `YYYY-MM-DD` a `dd/mm/aaaa` sin pasar por Date (evita el corrimiento UTC). */
export function formatExpenseDate(value: string): string {
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}/${month}/${year}` : value;
}

/**
 * Todos los medios de pago de un gasto, cada uno en su moneda (la
 * transferencia en las dos), para que el desglose los muestre siempre, en
 * cero si no hubo gastos por ese medio.
 */
const ALL_PAYMENT_METHOD_SLOTS: ExpensePaymentMethodTotal[] = [
  { type: 'efectivo_usd', currency: 'USD', total: 0 },
  { type: 'zelle', currency: 'USD', total: 0 },
  { type: 'binance', currency: 'USD', total: 0 },
  { type: 'transferencia', currency: 'USD', total: 0 },
  { type: 'efectivo_bs', currency: 'BS', total: 0 },
  { type: 'pago_movil', currency: 'BS', total: 0 },
  { type: 'punto_de_venta', currency: 'BS', total: 0 },
  { type: 'transferencia', currency: 'BS', total: 0 },
];

/** Los totales del backend completados con los medios que no tuvieron gastos. */
export function completePaymentMethodTotals(
  totals: ExpensePaymentMethodTotal[] | undefined
): ExpensePaymentMethodTotal[] {
  return ALL_PAYMENT_METHOD_SLOTS.map((slot) => ({
    ...slot,
    total:
      totals?.find(
        (row) => row.type === slot.type && row.currency === slot.currency
      )?.total ?? 0,
  }));
}

/** Fecha y hora de un instante del backend (ISO, UTC) en hora local: "24/09/2026, 10:35 a. m.". */
export function formatExpenseDateTime(
  value: string | null | undefined
): string {
  if (!value) return '-';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString('es-VE', { dateStyle: 'short', timeStyle: 'short' });
}

/** `YYYY-MM-DD` a un Date local (medianoche local, no UTC). */
export function parseApiDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatExpenseAmount(amount: number, currency: ExpenseCurrency) {
  return currency === 'USD'
    ? usdFormatCurrency(amount)
    : formatCurrencyBolivares(amount);
}

export function userDisplayName(user: Expense['createdBy'] | null): string {
  if (!user) return '-';
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');
  return fullName || user.username;
}

/**
 * Cuándo dos nombres escritos son el mismo beneficiario: sin tildes, en
 * minúsculas y con los espacios colapsados. Misma regla que
 * `beneficiary_key` en el backend.
 */
export function beneficiaryKey(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Misma regla que `isAdmin` en sidebarNav: superusuario no staff o rol admin. */
export function isAdminUser(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return (isSuperuser === true && isStaff === false) || roles.includes('admin');
}

/**
 * Quién aprueba, rechaza y edita gastos ya aprobados, y quién decide que un
 * efectivo USD no salió de la caja: el rol admin (o superusuario no staff) y
 * finanzas. Misma regla que `can_approve_expenses` del backend.
 */
export function canApproveExpenses(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return isAdminUser(roles, isSuperuser, isStaff) || roles.includes('finance');
}

/**
 * Quién puede editar el gasto (`can_edit_expense` del backend): pendiente, su
 * creador o un admin; aprobado, solo un admin; rechazado o anulado, nadie.
 */
export function canEditExpense(
  expense: Pick<Expense, 'status' | 'createdBy'>,
  userId: number | undefined,
  isAdmin: boolean
): boolean {
  if (expense.status === 'pending_approval') {
    return isAdmin || expense.createdBy.id === userId;
  }
  return expense.status === 'registered' && isAdmin;
}

/** Quién puede anular gastos (EXPENSE_CANCEL_ROLES del backend). */
export function canCancelExpenses(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return (
    isAdminUser(roles, isSuperuser, isStaff) ||
    roles.includes('administrator') ||
    roles.includes('manager') ||
    roles.includes('finance')
  );
}

/** Quién puede registrar gasto para cualquier sucursal. */
export function canBookAnyBranch(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return (
    isAdminUser(roles, isSuperuser, isStaff) ||
    roles.includes('administrator') ||
    roles.includes('finance')
  );
}

/**
 * El backend responde en inglés (LANGUAGE_CODE = en-us). Estos son los
 * mensajes del módulo que el formulario no puede prevenir del todo.
 */
const BACKEND_MESSAGES: Record<string, string> = {
  'No exchange rate is available for that date; enter the rate manually':
    'No hay tasa BCV para esa fecha; ingrésala manualmente.',
  'You can only register expenses for your own branch':
    'Solo puedes registrar gastos de tu sucursal.',
  'That expense category is no longer active':
    'La categoría seleccionada ya no está activa.',
  'The expense is already cancelled': 'El gasto ya estaba anulado.',
  'Only a registered expense can be cancelled':
    'Solo se anula un gasto aprobado. Un pendiente se rechaza o se retira.',
  'A cancelled or rejected expense cannot be edited':
    'Un gasto anulado o rechazado no se puede editar.',
  'Only an admin can approve expenses': 'Solo un admin aprueba gastos.',
  'Only an admin can reject expenses': 'Solo un admin rechaza gastos.',
  'Only a pending expense can be approved':
    'Solo se aprueba un gasto pendiente.',
  'Only a pending expense can be rejected':
    'Solo se rechaza un gasto pendiente.',
  'Only whoever registered it can withdraw it':
    'Solo quien lo registró puede retirarlo.',
  'Only a pending expense can be withdrawn':
    'Solo se retira un gasto pendiente.',
  'A reason is required': 'Indica el motivo.',
  'An expense needs at least one line': 'Agrega al menos una categoría.',
  'An expense needs at least one charge line':
    'Agrega al menos una categoría de gasto.',
  'A deduction category can only be used on a deduction line':
    'Una categoría de descuento solo va en una línea de descuento.',
  'A deduction line needs a deduction category':
    'Una línea de descuento necesita una categoría de descuento.',
  'The deductions cannot equal or exceed the charges':
    'Los descuentos no pueden igualar ni superar el total.',
  'This expense has several lines: edit the lines instead':
    'Este gasto tiene varias líneas: edita las líneas.',
  'A cancelled expense cannot be edited':
    'Un gasto anulado no se puede editar.',
  'You are not allowed to register expenses':
    'No tienes permiso para registrar gastos.',
  'You are not allowed to cancel expenses':
    'No tienes permiso para anular gastos.',
  'You are not allowed to edit this expense':
    'No tienes permiso para editar este gasto.',
  'The amount is too small to convert to USD at that rate':
    'El monto es demasiado pequeño para convertirlo a USD con esa tasa.',
  'Choose the currency of the transfer':
    'Selecciona la moneda de la transferencia.',
  'A phone number is required for that payment method':
    'El número de teléfono es obligatorio para ese tipo de pago.',
  'The origin bank is required for that payment method':
    'El banco de origen es obligatorio para ese tipo de pago.',
  'The origin account is required for that payment method':
    'La cuenta de origen es obligatoria para ese tipo de pago.',
  'That supplier is no longer active': 'Ese proveedor ya no está activo.',
  'That VAT rate is not allowed': 'Esa tasa de IVA no está permitida.',
  'Choose the supplier to withhold taxes from':
    'Elige el proveedor al que se le retiene.',
  'The VAT withholding must be 75 % or 100 %':
    'La retención de IVA debe ser 75 % o 100 %.',
  'The ISLR withholding must be between 0 and 100 %':
    'La retención de ISLR debe estar entre 0 y 100 %.',
  'Add the VAT to the expense to withhold it':
    'Marca «Agregar IVA» para retener el IVA.',
  'Every line is VAT-exempt: there is no VAT to add':
    'Todas las líneas están exentas: no hay IVA que agregar.',
  'VAT and withholdings are added by the system, not as a line':
    'El IVA y las retenciones los calcula el sistema; no van como línea.',
  'The invoice number is required to withhold taxes':
    'El número de factura es obligatorio para retener.',
  'The invoice control number is required to withhold taxes':
    'El número de control es obligatorio para retener.',
};

export function getExpenseErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: unknown }
      | undefined;
    const fieldErrors = data?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const details = Object.entries(fieldErrors as Record<string, unknown>)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(' ')
            : String(messages);
          return `${field}: ${text}`;
        })
        .join(' · ');
      if (details) return details;
    }
    if (data?.message) return BACKEND_MESSAGES[data.message] ?? data.message;
  }
  return fallback;
}
