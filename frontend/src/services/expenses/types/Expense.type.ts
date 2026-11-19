import { Pagination } from '@/models/pagination.model';
import {
  SupplierIvaRetentionRate,
  SupplierPersonType,
} from '@/services/suppliers/types/Supplier.type';

/**
 * Tipos del Módulo de Gastos (`/api/expenses/`). Ver ARCHITECTURE.md del
 * backend §3.13 / §4.13. Ids al escribir, objetos anidados al leer.
 */

export type ExpenseKind =
  | 'gasto'
  | 'retiro'
  | 'anticipo'
  | 'obligacion'
  | 'traslado'
  | 'ajuste'
  /** Descuento en el pago (retención, cuota de préstamo): no es gasto. */
  | 'deduccion'
  /** El IVA de la factura (crédito fiscal). Solo en líneas `iva`. */
  | 'impuesto'
  /** Impuesto retenido al proveedor (IVA o ISLR). Solo en líneas `ret_*`. */
  | 'retencion';

export type ExpenseCurrency = 'USD' | 'BS';

/**
 * `pending_approval` → `registered` (aprobado) o `rejected`; `registered` →
 * `cancelled`. Solo `registered` cuenta en caja y reportes.
 */
export type ExpenseStatus =
  | 'pending_approval'
  | 'registered'
  | 'rejected'
  | 'cancelled';

/**
 * Una línea suma al pago (cargo, iva) o se descuenta de él (descuento,
 * ret_iva, ret_islr). Las que escribe el usuario son `cargo` y `descuento`;
 * `iva`, `ret_iva` y `ret_islr` las calcula el backend a partir del IVA y las
 * retenciones del gasto.
 */
export type ExpenseLineType =
  | 'cargo'
  | 'descuento'
  | 'iva'
  | 'ret_iva'
  | 'ret_islr';

/** Las líneas que escribe el usuario. */
export type ExpenseManualLineType = 'cargo' | 'descuento';

export const RETENTION_LINE_TYPES: ExpenseLineType[] = ['ret_iva', 'ret_islr'];

export type ExpensePaymentMethod =
  | 'efectivo_usd'
  | 'efectivo_bs'
  | 'transferencia'
  | 'zelle'
  | 'binance'
  | 'pago_movil'
  | 'punto_de_venta';

/**
 * La moneda que fija cada medio de pago (PAYMENT_METHOD_CURRENCY del backend),
 * igual que en el pago de órdenes. La transferencia no fija ninguna: se elige.
 */
export const PAYMENT_METHOD_CURRENCY: Partial<
  Record<ExpensePaymentMethod, ExpenseCurrency>
> = {
  efectivo_usd: 'USD',
  efectivo_bs: 'BS',
  zelle: 'USD',
  binance: 'USD',
  pago_movil: 'BS',
  punto_de_venta: 'BS',
};

/** Qué tasa se eligió (RATE_TYPE_CHOICES del backend). */
/** A qué tasa del día se muestran los montos en los reportes (SAL-163). */
export type ExpenseRateSource = 'dolar_bcv' | 'euro_bcv' | 'usdt';

/** Tasas Bs/USD guardadas para la fecha del gasto; `null` dentro si falta una. */
export interface ExpenseDayRates {
  dolarBcv: number | null;
  euroBcv: number | null;
  usdt: number | null;
}

export type ExpenseRateType =
  | 'dolar_bcv'
  | 'euro_bcv'
  | 'usdt'
  | 'personalizada';

/** Datos del pago, como en OrderPayment. */
export type ExpensePaymentDetailField =
  | 'phoneNumber'
  | 'originBank'
  | 'targetBank'
  | 'originAccount'
  | 'targetAccount';

/**
 * Qué datos pide cada medio (PAYMENT_METHOD_REQUIRED_FIELDS del backend), las
 * mismas reglas que el pago de órdenes. Banco y cuenta destino son opcionales.
 */
export const PAYMENT_METHOD_REQUIRED_FIELDS: Partial<
  Record<ExpensePaymentMethod, ExpensePaymentDetailField[]>
> = {
  pago_movil: ['phoneNumber', 'originBank'],
  transferencia: ['originBank', 'originAccount'],
  zelle: ['originAccount'],
  binance: ['originAccount'],
};

/** Pagos en efectivo: no llevan referencia. */
export const CASH_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'efectivo_usd',
  'efectivo_bs',
];

/**
 * Lo único que descuenta el efectivo de la sucursal, por ahora: el efectivo
 * en USD. Un gasto en efectivo Bs se registra pero no toca la caja.
 */
export const CASH_EXPENSE_PAYMENT_METHODS: ExpensePaymentMethod[] = [
  'efectivo_usd',
];

export interface ExpenseCategory {
  id: number;
  code: string;
  name: string;
  accountCode: string;
  accountName: string;
  groupCode: string;
  groupName: string;
  kind: ExpenseKind;
  isActive: boolean;
  sortOrder: number;
}

/** Un comprobante guardado. */
export interface ExpenseReceipt {
  id: number;
  /** URL firmada que vence a los 5 minutos: pedir el detalle al abrirla. */
  url: string | null;
  mime: string;
}

export interface ExpenseUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

/** Una fila del selector de beneficiario (`GET /expenses/beneficiaries`). */
export interface ExpenseBeneficiary extends ExpenseUser {
  /** Lista separada por comas, p. ej. `manager,administrator`. */
  role: string | null;
  branch: { id: number; name: string } | null;
}

/** Beneficiario guardado: un nombre escrito en un gasto anterior (no un usuario). */
export interface SavedBeneficiary {
  id: number;
  name: string;
}

export interface ExpenseBranch {
  id: number;
  name: string;
  type: string;
  /** Código corto ("GRN"); `null` si la sucursal no tiene. */
  code: string | null;
}

/** Una parte del pago: categoría, concepto opcional y monto en la moneda del gasto. */
export interface ExpenseLine {
  id: number;
  category: ExpenseCategory;
  concept: string;
  lineType: ExpenseLineType;
  amount: number;
  amountUsd: number;
  position: number;
  /** Solo en cargos: fuera de la base del IVA. */
  ivaExempt: boolean;
  /** En iva / ret_*: el % aplicado y la base sobre la que se aplicó. */
  rateApplied: number | null;
  baseAmount: number | null;
}

/** Una línea tal como se envía: la categoría por id. */
export interface ExpenseLinePayload {
  category: number;
  concept?: string;
  lineType: ExpenseManualLineType;
  amount: number;
  ivaExempt?: boolean;
}

/** El proveedor tal como lo trae un gasto. */
export interface ExpenseSupplier {
  id: number;
  name: string;
  rif: string;
  personType: SupplierPersonType;
  ivaRetentionRate: SupplierIvaRetentionRate;
  islrRetentionRate: number | null;
  islrConcept: string;
  isActive: boolean;
}

/**
 * La factura detrás del pago, en la moneda del gasto: base (cargos), IVA,
 * total, lo retenido y el neto pagado (= `amount`).
 */
export interface ExpenseInvoice {
  base: number;
  iva: number;
  total: number;
  retainedIva: number;
  retainedIslr: number;
  retainedTotal: number;
  otherDeductions: number;
  net: number;
}

export interface Expense {
  id: number;
  /** "GRN-123": código de la sucursal (o su id) y el id del gasto. */
  displayCode: string;
  branch: ExpenseBranch;
  /** Categoría principal: la línea de cargo más grande. Solo para mostrar. */
  category: ExpenseCategory;
  /** Una o más; `amount` es Σ cargos − Σ descuentos. */
  lines: ExpenseLine[];
  /** Tasas del día del gasto; `null` si ese día no tiene tasa guardada. */
  dayRates: ExpenseDayRates | null;
  createdBy: ExpenseUser;
  concept: string;
  /** Texto libre, o el nombre de `beneficiaryUser` si es un usuario. */
  beneficiary: string;
  beneficiaryUser: ExpenseUser | null;
  /** Presente cuando el beneficiario es un nombre escrito (se guarda para reusarlo). */
  savedBeneficiary: SavedBeneficiary | null;
  /** Proveedor con perfil fiscal; entonces `beneficiary` es su nombre. */
  supplier: ExpenseSupplier | null;
  invoiceNumber: string;
  controlNumber: string;
  invoice: ExpenseInvoice;
  /**
   * Decisión de un administrador: gasto en efectivo USD que NO salió de la
   * caja de la sucursal. Sigue siendo gasto, pero no descuenta la caja.
   */
  excludedFromCash: boolean;
  /** En `currency`. */
  amount: number;
  /** La fija el medio de pago, salvo en transferencia (se elige). */
  currency: ExpenseCurrency;
  /** Bs por USD con la que se registró. */
  rate: number;
  /** De dónde salió la tasa; vacío si no se indicó. */
  rateType: ExpenseRateType | '';
  /** El gasto normalizado a USD: lo que suman los totales y el efectivo. */
  amountUsd: number;
  paymentMethod: ExpensePaymentMethod;
  reference: string;
  phoneNumber: string;
  originBank: string;
  targetBank: string;
  originAccount: string;
  targetAccount: string;
  /** Fecha del gasto (YYYY-MM-DD), no la de carga. */
  expenseDate: string;
  notes: string;
  /** Fotos o PDF del gasto, en orden (hasta 5). Vacío si no tiene. */
  receipts: ExpenseReceipt[];
  status: ExpenseStatus;
  cancelledBy: ExpenseUser | null;
  cancelledAt: string | null;
  cancelReason: string;
  approvedBy: ExpenseUser | null;
  approvedAt: string | null;
  rejectedBy: ExpenseUser | null;
  rejectedAt: string | null;
  rejectionReason: string;
  createdAt: string;
  lastUpdated: string;
}

export interface GetAllExpensesQueryParams {
  page?: string;
  pageSize?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  kind?: ExpenseKind;
  /** Un medio concreto, o `cash` para lo que descuenta caja (efectivo USD). */
  paymentMethod?: ExpensePaymentMethod | 'cash';
  /**
   * `mine_pending` = aprobados más los pendientes propios; `requests` =
   * pendientes y rechazados (la página Pre Gastos). Quien no puede aprobar solo
   * recibe sus propias solicitudes, con cualquier filtro.
   */
  status?: ExpenseStatus | 'all' | 'mine_pending' | 'requests';
  search?: string;
  /** Totales también a esta tasa del día (`staticData.converted`). */
  rate?: ExpenseRateSource;
  /** Id del proveedor. */
  supplier?: string;
  /** `'true'` = solo gastos con alguna retención. */
  withRetentions?: 'true';
}

/** Lo pagado por un medio, en su moneda (la transferencia puede ser USD o Bs). */
export interface ExpensePaymentMethodTotal {
  type: ExpensePaymentMethod;
  currency: ExpenseCurrency;
  total: number;
}

/** Los mismos totales re-expresados a una tasa del día (SAL-163). */
export interface ExpenseConvertedTotals {
  source: ExpenseRateSource;
  totalUsd: number;
  totalBs: number;
  convertedCount: number;
  /** Gastos cuya fecha no tiene tasa guardada: quedan fuera de estos totales. */
  missingRateCount: number;
}

/** Lo retenido por categoría de descuento, en USD (SAL-162). */
export interface ExpenseDeductionTotal {
  categoryId: number;
  name: string;
  accountCode: string;
  totalUsd: number;
}

export interface ExpensesStaticData {
  totalUsd: number;
  totalCashUsd: number;
  /** Lo pagado en bolívares, en bolívares (sin convertir). */
  totalBs: number;
  count: number;
  paymentMethodTotals: ExpensePaymentMethodTotal[];
  deductionTotals: ExpenseDeductionTotal[];
  /** Solo cuando se pidió `rate`. */
  converted: ExpenseConvertedTotals | null;
  /** Cola de pendientes con los mismos filtros. Solo para admin. */
  pending?: { count: number; totalUsd: number };
}

export interface ExpensesPage extends Pagination<Expense> {
  staticData?: ExpensesStaticData;
}

export interface CreateExpensePayload {
  branch: number;
  /** El backend calcula el monto del gasto a partir de ellas. */
  lines: ExpenseLinePayload[];
  concept: string;
  beneficiary?: string;
  /** Usuario de Moto Candela; `null` lo quita (edición). */
  beneficiaryUser?: number | null;
  /** Obligatoria en transferencia; en el resto la fija el medio. */
  currency?: ExpenseCurrency;
  /** Si falta, el backend toma la BCV del día. */
  rate?: number;
  rateType?: ExpenseRateType;
  paymentMethod: ExpensePaymentMethod;
  reference?: string;
  phoneNumber?: string;
  originBank?: string;
  targetBank?: string;
  originAccount?: string;
  targetAccount?: string;
  expenseDate: string;
  notes?: string;
  /** Solo administradores y solo en efectivo USD. Omitido = se conserva. */
  excludedFromCash?: boolean;
  /** `true` = pre-gasto (queda pendiente aunque lo registre un admin). */
  asRequest?: boolean;
  /** Id del proveedor; `null` lo quita. */
  supplier?: number | null;
  invoiceNumber?: string;
  controlNumber?: string;
  /** % de IVA sobre los cargos no exentos; 0 = sin IVA. */
  ivaRate?: number;
  /** 0 = sin retención. Omitido = el perfil del proveedor. */
  retentionIvaRate?: number;
  retentionIslrRate?: number;
  /** Comprobantes nuevos. */
  receipts?: File[];
}

/** La sucursal no se edita: mover un gasto es anularlo y registrarlo de nuevo. */
export type UpdateExpensePayload = Partial<
  Omit<CreateExpensePayload, 'branch'>
> & {
  /** Ids de comprobantes guardados que se quitan. */
  removeReceipts?: number[];
};

export interface ExpenseSummary {
  totalUsd: number;
  totalCashUsd: number;
  totalBs: number;
  count: number;
  paymentMethodTotals: ExpensePaymentMethodTotal[];
  deductionTotals: ExpenseDeductionTotal[];
  converted: ExpenseConvertedTotals | null;
  byKind: { kind: ExpenseKind; totalUsd: number }[];
  /** Suman las líneas de cargo: un gasto con dos categorías cuenta en ambas. */
  byCategory: ExpenseCategoryTotal[];
  /** Descuentos y retenciones, aparte: no son gasto. */
  byDeduction: ExpenseCategoryTotal[];
  /** Lo retenido al SENIAT, por impuesto, en USD. */
  retained: { ivaUsd: number; islrUsd: number };
}

/** Lo que ofrece el formulario para el IVA (`GET /expenses/tax-options`). */
export interface ExpenseTaxOptions {
  /** La general primero. */
  ivaRates: number[];
  ivaRetentionRates: number[];
}

export type RetentionLineType = 'ret_iva' | 'ret_islr';

/** Una fila de la página Retenciones: una retención de un gasto aprobado. */
export interface RetentionLine {
  id: number;
  lineType: RetentionLineType;
  /** En la moneda del gasto. */
  amount: number;
  amountUsd: number;
  /** En Bs: el monto si el gasto es en Bs; si no, a la tasa del gasto. */
  amountBs: number;
  rateApplied: number;
  /** IVA de la factura (ret_iva) o base imponible (ret_islr), en la moneda del gasto. */
  baseAmount: number;
  expense: {
    id: number;
    displayCode: string;
    expenseDate: string;
    concept: string;
    currency: ExpenseCurrency;
    rate: number;
    branch: { id: number; name: string; code: string | null };
    invoiceNumber: string;
    controlNumber: string;
    /** La factura completa, en la moneda del gasto, y la tasa de IVA cobrada. */
    invoice: ExpenseInvoice & { ivaRate: number | null };
  };
  supplier: {
    id: number;
    name: string;
    rif: string;
    personType: SupplierPersonType;
    islrConcept: string;
  } | null;
}

export interface RetentionTotals {
  retainedIvaUsd: number;
  retainedIslrUsd: number;
  retainedTotalUsd: number;
  retainedIvaBs: number;
  retainedIslrBs: number;
  retainedTotalBs: number;
  count: number;
}

export interface RetentionsPage extends Pagination<RetentionLine> {
  staticData?: RetentionTotals;
}

export interface GetRetentionsQueryParams {
  page?: string;
  pageSize?: string;
  startDate?: string;
  endDate?: string;
  supplier?: string;
  type?: RetentionLineType;
  search?: string;
}

export interface ExpenseCategoryTotal {
  categoryId: number;
  name: string;
  accountCode: string;
  kind: ExpenseKind;
  totalUsd: number;
}

export interface ExpenseCategoryPayload {
  code?: string;
  name?: string;
  accountCode?: string;
  accountName?: string;
  groupCode?: string;
  groupName?: string;
  kind?: ExpenseKind;
  isActive?: boolean;
  sortOrder?: number;
}
