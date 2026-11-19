import * as z from 'zod';

export const ObservationSchema = z.object({
  observation: z
    .string()
    .min(5, 'La observación debe tener al menos 5 caracteres')
    .max(500, 'La observación no puede superar los 500 caracteres'),
});

export type ObservationFormValues = z.infer<typeof ObservationSchema>;
