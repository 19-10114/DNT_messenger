import * as z from 'zod';
import { normalizeRif } from '@/components/suppliers/supplier.utils';

/** Alta y edición de un proveedor. */
export const SupplierFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Indica el nombre o la razón social')
      .max(150, 'Máximo 150 caracteres'),
    rif: z
      .string()
      .trim()
      .refine(
        (value) => normalizeRif(value) !== null,
        'RIF inválido. Ej.: J-30123456-7'
      ),
    personType: z.enum(['juridica', 'natural']),
    ivaRetentionRate: z.enum(['0', '75', '100']),
    retainIslr: z.boolean(),
    islrRate: z.string().optional(),
    islrConcept: z.string().trim().max(80, 'Máximo 80 caracteres').optional(),
    phone: z.string().trim().max(30, 'Máximo 30 caracteres').optional(),
    email: z
      .string()
      .trim()
      .max(100, 'Máximo 100 caracteres')
      .refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        'Correo inválido'
      )
      .optional(),
    notes: z.string().trim().max(500, 'Máximo 500 caracteres').optional(),
  })
  .superRefine((values, ctx) => {
    const rate = Number(values.islrRate);
    if (values.retainIslr && !(rate > 0 && rate <= 100)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['islrRate'],
        message: 'Entre 0 y 100 %',
      });
    }
  });

export type SupplierFormValues = z.infer<typeof SupplierFormSchema>;
