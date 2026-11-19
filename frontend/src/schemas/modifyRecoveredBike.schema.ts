import * as z from 'zod';

export const ModifyRecoveredBikeSchema = z.object({
  licensePlate: z.string(),
  recoveredStatus: z.string().optional(),
  kilometraje: z
    .number()
    .min(0, 'El kilometraje debe ser mayor a 0')
    .optional(),
  observaciones: z.string().optional(),
  recoveredUbicacion: z.string().optional(),
  montoInvertido: z.number().min(0, 'El monto debe ser mayor a 0').optional(),
});

export type ModifyRecoveredBikeFormValues = z.infer<
  typeof ModifyRecoveredBikeSchema
>;
