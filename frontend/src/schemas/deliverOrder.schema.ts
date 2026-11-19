import * as z from 'zod';

export const deliverOrderSchema = z.object({
  id: z.string({
    invalid_type_error: 'La id es incorrecta.',
    required_error: 'No puedes modificar este campo',
  }),
  date: z.date({
    required_error: 'Selecciona una fecha valida',
    invalid_type_error: 'Coloca la fecha nuevamente.',
  }),
  collection_date: z.date({
    required_error: 'Selecciona una fecha valida',
    invalid_type_error: 'Coloca la fecha nuevamente.',
  }),
  location: z
    .string({
      invalid_type_error: 'La location es incorrecta.',
      required_error: 'Selecciona una opción valida',
    })
    .min(1, 'Selecciona una opción valida'),
});

export type DeliverOrderData = z.infer<typeof deliverOrderSchema>;
