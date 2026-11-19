import * as z from 'zod';

export const ModifyPaymentFormSchema = z.object({
  amount: z.string({
    invalid_type_error: 'El monto debe ser un numero.',
    required_error: 'Debes ingresar el monto del pago',
  }),
  date: z.date(),
  location: z.string({
    invalid_type_error: 'Selección invalida.',
    required_error: 'Debes la oficina correspondiente',
  }),
});
export type ModifyPaymentData = z.infer<typeof ModifyPaymentFormSchema>;
