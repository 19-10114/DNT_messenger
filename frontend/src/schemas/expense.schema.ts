import * as z from 'zod';
import { endOfDay } from 'date-fns';
import {
  CASH_PAYMENT_METHODS,
  PAYMENT_METHOD_CURRENCY,
  PAYMENT_METHOD_REQUIRED_FIELDS,
} from '@/services/expenses/types/Expense.type';

export const RECEIPT_MAX_BYTES = 20 * 1024 * 1024;
/** Fotos o PDF por gasto. Mismo tope que el backend. */
export const MAX_EXPENSE_RECEIPTS = 5;
export const RECEIPT_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

export const EXPENSE_PAYMENT_METHOD_VALUES = [
  'efectivo_usd',
  'efectivo_bs',
  'transferencia',
  'zelle',
  'binance',
  'pago_movil',
  'punto_de_venta',
] as const;

// z.custom, not z.instanceof(File): the latter reads `File` when the module
// loads, and Node 18 (the server render) has no global `File`. Optional: an
// expense may be registered without a receipt.
export const receiptSchema = z
  .custom<File>(
    (value) => typeof File !== 'undefined' && value instanceof File,
    { message: 'Adjunta un archivo válido' }
  )
  .refine((file) => file.size <= RECEIPT_MAX_BYTES, 'Máximo 20 MB')
  .refine(
    (file) => RECEIPT_MIME_TYPES.includes(file.type),
    'Solo imágenes (JPG, PNG, WEBP) o PDF'
  );

/** Una línea del gasto. El monto va en la moneda del gasto (Bs si es en Bs). */
export const expenseLineSchema = z.object({
  category: z.string().min(1, 'Selecciona una categoría'),
  concept: z.string().max(200, 'Máximo 200 caracteres').optional(),
  lineType: z.enum(['cargo', 'descuento']),
  amount: z.string().refine((value) => Number(value) > 0, 'Monto mayor a 0'),
  /** Solo en cargos: fuera de la base del IVA (factura mixta). */
  ivaExempt: z.boolean().optional(),
});

export type ExpenseLineFormValues = z.infer<typeof expenseLineSchema>;

/** Σ cargos − Σ descuentos, lo que se paga sin IVA ni retenciones. */
export function linesTotal(lines: ExpenseLineFormValues[]): number {
  return lines.reduce((sum, line) => {
    const amount = Number(line.amount) || 0;
    return line.lineType === 'descuento' ? sum - amount : sum + amount;
  }, 0);
}

/** El IVA y las retenciones elegidos en el formulario. */
export interface ExpenseTaxValues {
  applyIva?: boolean;
  ivaRate?: string;
  retainIva?: boolean;
  ivaRetentionRate?: string;
  retainIslr?: boolean;
  islrRate?: string;
}

export interface ExpenseInvoiceTotals {
  /** Σ cargos (sin IVA): la base del ISLR. */
  base: number;
  /** Σ cargos no exentos: la base del IVA. */
  taxable: number;
  iva: number;
  /** base + IVA. */
  total: number;
  retainedIva: number;
  retainedIslr: number;
  /** Descuentos escritos (S.S.O., préstamos…). */
  deductions: number;
  /** Lo que se paga: total − retenciones − descuentos. */
  net: number;
}

/**
 * A centavos, redondeando la mitad hacia arriba (ROUND_HALF_UP del backend).
 * `toFixed(6)` quita el ruido binario: 3.9975 × 100 = 399.74999… → 400.
 */
export function roundCents(value: number): number {
  return Math.round(Number((value * 100).toFixed(6))) / 100;
}

/**
 * La factura detrás del gasto, con las mismas reglas que
 * `services.compute_lines` del backend (que es quien manda: esto solo
 * muestra la cuenta mientras se escribe):
 * - IVA = Σ cargos no exentos × tasa
 * - Retención IVA = IVA × 75 % o 100 % (sin IVA no hay)
 * - Retención ISLR = Σ cargos × tasa
 * Cada monto redondeado a centavos por separado.
 */
export function computeInvoice(
  lines: ExpenseLineFormValues[],
  tax: ExpenseTaxValues
): ExpenseInvoiceTotals {
  let base = 0;
  let taxable = 0;
  let deductions = 0;
  lines.forEach((line) => {
    const amount = Number(line.amount) || 0;
    if (line.lineType === 'descuento') {
      deductions += amount;
    } else {
      base += amount;
      if (!line.ivaExempt) taxable += amount;
    }
  });
  const ivaRate = Number(tax.ivaRate) || 0;
  const iva =
    tax.applyIva && ivaRate > 0 ? roundCents((taxable * ivaRate) / 100) : 0;
  const ivaRetention = Number(tax.ivaRetentionRate) || 0;
  const retainedIva =
    tax.retainIva && iva > 0 ? roundCents((iva * ivaRetention) / 100) : 0;
  const islrRate = Number(tax.islrRate) || 0;
  const retainedIslr =
    tax.retainIslr && islrRate > 0 ? roundCents((base * islrRate) / 100) : 0;
  const total = roundCents(base + iva);
  return {
    base: roundCents(base),
    taxable: roundCents(taxable),
    iva,
    total,
    retainedIva,
    retainedIslr,
    deductions: roundCents(deductions),
    net: roundCents(total - retainedIva - retainedIslr - deductions),
  };
}

const baseSchema = z.object({
  branch: z.string().min(1, 'Selecciona la sucursal'),
  /** Una o más; el monto a pagar se calcula a partir de ellas. */
  lines: z.array(expenseLineSchema).min(1, 'Agrega al menos una categoría'),
  concept: z
    .string()
    .trim()
    .min(3, 'Describe el gasto')
    .max(200, 'Máximo 200 caracteres'),
  beneficiary: z.string().max(150, 'Máximo 150 caracteres').optional(),
  /** Id del usuario de Moto Candela; vacío si el beneficiario es texto libre. */
  beneficiaryUser: z.string().optional(),
  /** Solo administradores, solo efectivo USD: no descontar de la caja. */
  excludedFromCash: z.boolean().optional(),
  /** La fija el tipo de pago, salvo en transferencia. */
  currency: z.enum(['USD', 'BS']),
  rate: z.string().optional(),
  rateType: z
    .enum(['dolar_bcv', 'euro_bcv', 'usdt', 'personalizada'])
    .optional(),
  paymentMethod: z.enum(EXPENSE_PAYMENT_METHOD_VALUES, {
    required_error: 'Selecciona el tipo de pago',
  }),
  reference: z.string().max(100, 'Máximo 100 caracteres').optional(),
  phoneNumber: z.string().max(30, 'Máximo 30 caracteres').optional(),
  originBank: z.string().max(100).optional(),
  targetBank: z.string().max(100).optional(),
  originAccount: z.string().max(64, 'Máximo 64 caracteres').optional(),
  targetAccount: z.string().max(64, 'Máximo 64 caracteres').optional(),
  expenseDate: z
    .date({ required_error: 'Indica la fecha del gasto' })
    .refine(
      (date) => date <= endOfDay(new Date()),
      'La fecha no puede ser futura'
    ),
  notes: z.string().max(500, 'Máximo 500 caracteres').optional(),
  /** Id del proveedor; vacío si el beneficiario no es un proveedor. */
  supplier: z.string().optional(),
  invoiceNumber: z.string().trim().max(30, 'Máximo 30 caracteres').optional(),
  controlNumber: z.string().trim().max(30, 'Máximo 30 caracteres').optional(),
  applyIva: z.boolean().optional(),
  ivaRate: z.string().optional(),
  retainIva: z.boolean().optional(),
  ivaRetentionRate: z.enum(['75', '100']).optional(),
  retainIslr: z.boolean().optional(),
  islrRate: z.string().optional(),
});

type BaseValues = z.infer<typeof baseSchema>;

/** Reglas que cruzan campos. */
const REQUIRED_DETAIL_MESSAGES = {
  phoneNumber: 'El número de teléfono es obligatorio',
  originBank: 'Selecciona el banco de origen',
  originAccount: 'La cuenta de origen es obligatoria',
} as const;

function crossFieldRules(values: BaseValues, ctx: z.RefinementCtx) {
  if (!values.lines.some((line) => line.lineType === 'cargo')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lines'],
      message: 'Agrega al menos una categoría de gasto',
    });
  } else if (computeInvoice(values.lines, values).net <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lines'],
      message: 'Los descuentos no pueden igualar ni superar el total',
    });
  } else if (
    values.applyIva &&
    computeInvoice(values.lines, values).taxable <= 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['lines'],
      message: 'Todas las líneas están exentas: no hay IVA que agregar',
    });
  }
  const retains = values.retainIva || values.retainIslr;
  if (retains && !values.supplier) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beneficiary'],
      message: 'Elige el proveedor para retenerle impuestos',
    });
  }
  if (values.retainIva && !values.applyIva) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['retainIva'],
      message: 'Marca «Agregar IVA» para retener el IVA',
    });
  }
  if (values.retainIva && !values.ivaRetentionRate) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ivaRetentionRate'],
      message: 'Elige el porcentaje',
    });
  }
  const islrRate = Number(values.islrRate);
  if (values.retainIslr && !(islrRate > 0 && islrRate <= 100)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['islrRate'],
      message: 'Entre 0 y 100 %',
    });
  }
  if (retains && !values.invoiceNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['invoiceNumber'],
      message: 'Obligatorio para retener',
    });
  }
  if (retains && !values.controlNumber?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['controlNumber'],
      message: 'Obligatorio para retener',
    });
  }
  const fixedCurrency = PAYMENT_METHOD_CURRENCY[values.paymentMethod];
  if (fixedCurrency && fixedCurrency !== values.currency) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['currency'],
      message: `Ese tipo de pago es siempre en ${fixedCurrency === 'BS' ? 'Bs' : 'USD'}`,
    });
  }
  (PAYMENT_METHOD_REQUIRED_FIELDS[values.paymentMethod] ?? []).forEach(
    (field) => {
      if (field in REQUIRED_DETAIL_MESSAGES && !values[field]?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field],
          message:
            REQUIRED_DETAIL_MESSAGES[
              field as keyof typeof REQUIRED_DETAIL_MESSAGES
            ],
        });
      }
    }
  );
  if (values.currency === 'BS' && !(Number(values.rate) > 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['rate'],
      message: 'Indica la tasa Bs/USD',
    });
  }
  if (
    !CASH_PAYMENT_METHODS.includes(values.paymentMethod) &&
    !values.reference?.trim()
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['reference'],
      message: 'La referencia es obligatoria si no es efectivo',
    });
  }
}

/**
 * Alta y edición. Los comprobantes son opcionales (hasta
 * MAX_EXPENSE_RECEIPTS, contando los ya guardados que se conservan):
 * `receipts` son los nuevos y `removeReceipts` los guardados que se quitan.
 */
export const ExpenseFormSchema = baseSchema
  .extend({
    receipts: z
      .array(receiptSchema)
      .max(MAX_EXPENSE_RECEIPTS, `Máximo ${MAX_EXPENSE_RECEIPTS} comprobantes`),
    removeReceipts: z.array(z.number()),
  })
  .superRefine(crossFieldRules);

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;

/** Motivo de anular o rechazar un gasto. */
export const ReasonSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Indica el motivo')
    .max(300, 'Máximo 300 caracteres'),
});
