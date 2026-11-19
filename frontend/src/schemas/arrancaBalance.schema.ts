import * as z from 'zod';

import { ARRANCA_BALANCE_DIRECTIONS } from '@/services/arrancaBalance/types';

/**
 * `amount` y `branch` se validan como texto (lo que tienen el input y el
 * select) y se convierten a número al enviar. El backend exige un monto mayor a
 * cero con dos decimales y una sucursal MC.
 */
export const ArrancaBalanceSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, 'Ingrese un monto')
    .refine(
      (value) => /^\d+(\.\d{1,2})?$/.test(value),
      'Use un número con hasta dos decimales (ej. 1500.50)'
    )
    .refine((value) => Number(value) > 0, 'El monto debe ser mayor a cero'),
  concept: z
    .string()
    .trim()
    .min(1, 'Ingrese un concepto')
    .max(255, 'El concepto no puede superar los 255 caracteres'),
  direction: z.enum(ARRANCA_BALANCE_DIRECTIONS, {
    errorMap: () => ({ message: 'Seleccione el sentido del movimiento' }),
  }),
  branch: z.string().min(1, 'Seleccione una sucursal'),
  observations: z.string().trim(),
});

export type ArrancaBalanceFormValues = z.infer<typeof ArrancaBalanceSchema>;
