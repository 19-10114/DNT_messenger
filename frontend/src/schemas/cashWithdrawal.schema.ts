import * as z from 'zod';
import { receiptSchema } from '@/schemas/expense.schema';

export const CASH_WITHDRAWAL_DESTINATIONS = [
  'deposito_banco',
  'entrega_socio',
  'pago_empire',
  'utilidades',
  'otro',
] as const;

/**
 * Salida de efectivo. Mismas reglas que el backend: "Otro" pide motivo,
 * siempre hay quien recibe el efectivo, monto en USD mayor a 0. Que no supere
 * el efectivo de la sede lo valida el formulario con el saldo y, sobre todo,
 * el backend.
 */
export const CashWithdrawalSchema = z
  .object({
    destination: z.enum(CASH_WITHDRAWAL_DESTINATIONS),
    concept: z.string().trim().max(200, 'Máximo 200 caracteres'),
    deliveredTo: z
      .string()
      .trim()
      .min(1, 'Indica quién recibe el efectivo')
      .max(150, 'Máximo 150 caracteres'),
    reference: z.string().trim().max(100, 'Máximo 100 caracteres'),
    amountUsd: z
      .string()
      .refine((value) => Number(value) > 0, 'Monto mayor a 0'),
    notes: z.string().trim().max(500, 'Máximo 500 caracteres'),
    receipt: receiptSchema.optional(),
  })
  .superRefine((values, ctx) => {
    if (values.destination === 'otro' && !values.concept) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['concept'],
        message: 'Indica para qué es el efectivo',
      });
    }
  });

export type CashWithdrawalFormValues = z.infer<typeof CashWithdrawalSchema>;
