import * as z from 'zod';

/** Texto de un input numérico: vacío, o un número con punto o coma decimal. */
export const parseAmount = (value: string) =>
  value.trim() === '' ? null : Number(value.trim().replace(',', '.'));

const optionalWhole = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || (/^\d+$/.test(value) && Number(value) >= 1),
    'Un número entero mayor que 0'
  );

const optionalAmount = z
  .string()
  .trim()
  .refine((value) => {
    const amount = parseAmount(value);
    return amount === null || (Number.isFinite(amount) && amount >= 0);
  }, 'Un monto válido');

export const SalesTargetsFormSchema = z.object({
  rows: z.array(
    z.object({
      branchId: z.number(),
      targetUnits: optionalWhole,
      targetUsd: optionalAmount,
    })
  ),
});

export type SalesTargetsFormValues = z.infer<typeof SalesTargetsFormSchema>;

/** `all` = día no hábil para todas las sucursales. */
export const NonWorkingDayFormSchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha')
    .refine(
      (value) => new Date(`${value}T12:00:00`).getDay() !== 0,
      'Los domingos nunca son hábiles'
    ),
  scope: z.string(),
  reason: z.string().trim().max(100, 'Máximo 100 caracteres'),
});

export type NonWorkingDayFormValues = z.infer<typeof NonWorkingDayFormSchema>;
