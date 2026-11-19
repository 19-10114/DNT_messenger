import * as z from 'zod';

export const PaymentFormSchema = z.object({
  // amount: z
  //   .string({
  //     invalid_type_error: 'El monto debe ser un numero.',
  //     required_error: 'Debes ingresar el monto del pago',
  //   })
  //   .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  amount: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Debe ser un número válido',
  }),
  amount_bs: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), {
      message: 'Debe ser un número válido',
    }),
  currency: z.string({
    invalid_type_error: 'Solo se admite USD o Bolivares.',
    required_error: 'Solo se admite USD o Bolivares',
  }),
  exchange_rate: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Debe ser un número válido',
  }),
  // exchange_rate: z
  //   .string({
  //     invalid_type_error: 'El tipo de cambio debe ser un numero',
  //     required_error:
  //       'Debes ingresar el tipo de cambio con el que se hará el pago',
  //   })
  //   .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  type: z.string({
    invalid_type_error: 'Tipo de pago invalido.',
    required_error: 'Debes ingresar el tipo de pago',
  }),
  bank: z.string({
    invalid_type_error: 'Banco invalido.',
    required_error: 'Debes ingresar el banco',
  }),
  bankReference: z.string({
    invalid_type_error: 'Ingresa la referencia del banco.',
    required_error: 'Debes ingresar la referencia del banco',
  }),
  // amount_charged: z
  //   .string({
  //     invalid_type_error: 'Solo se admiten números',
  //     required_error:
  //       'Debes ingresar monto en bolivares con el que se hará el pago',
  //   })
  //   .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  amount_charged: z.string().refine((val) => !isNaN(Number(val)), {
    message: 'Debe ser un número válido',
  }),
  concept: z.string({
    invalid_type_error: 'Selección invalida.',
    required_error: 'Debes ingresar concepto de pago',
  }),
  location: z.string({
    invalid_type_error: 'Selección invalida.',
    required_error: 'Debes la oficina correspondiente',
  }),
  date: z.date(),
  notes: z.string().optional(), // Campo de observaciones
});
export type PaymentData = z.infer<typeof PaymentFormSchema>;
