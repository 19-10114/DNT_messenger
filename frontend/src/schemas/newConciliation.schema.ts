import * as z from 'zod';

export const NewConciliationFormSchema = z.object({
  cedula: z
    .string({
      invalid_type_error: 'La Cedula debe ser un numero.',
      required_error: 'Debes ingresar una cédula de identidad válida',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  name: z.string({
    invalid_type_error:
      'El nombre de la compañia debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el nombre de la compañia',
  }),
  currency: z.string({
    invalid_type_error: 'Solo se admite USD o Bolivares.',
    required_error: 'Solo se admite USD o Bolivares',
  }),
  payment_type: z.string({
    invalid_type_error:
      'El tipo de arrendamiento  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el tipo  del arrendamiento',
  }),
  amount: z
    .string({
      invalid_type_error: 'El monto debe ser un numero.',
      required_error: 'Debes ingresar el monto del pago',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  sede: z.string({
    invalid_type_error: 'Selección invalida.',
    required_error: 'Debes la oficina correspondiente',
  }),
  date: z.date({
    required_error: 'Selecciona una fecha valida',
    invalid_type_error: 'Coloca la fecha nuevamente.',
  }),
});
export type NewConciliationData = z.infer<typeof NewConciliationFormSchema>;
