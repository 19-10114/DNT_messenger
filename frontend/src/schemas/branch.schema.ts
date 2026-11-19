import * as z from 'zod';

export const BranchFormSchema = z.object({
  name: z.string({
    required_error: 'El nombre de la sucursal es requerido',
  }),
  type: z.string({
    required_error: 'El tipo de sucursal es requerido',
  }),
  /** 2 a 4 letras o números ("GRN"); se guarda en mayúsculas. Opcional. */
  code: z
    .string()
    .trim()
    .regex(/^([A-Za-z0-9]{2,4})?$/, 'De 2 a 4 letras o números')
    .optional(),
});

export type BranchFormValues = z.infer<typeof BranchFormSchema>;
