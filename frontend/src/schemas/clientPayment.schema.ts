import * as z from 'zod';

export const clientPaymentFormSchema = z.object({
  amount: z
    .string({
      invalid_type_error: 'El monto debe ser un numero.',
      required_error: 'Debes ingresar el monto del pago',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),

  currency: z.enum(['Bolivares', 'USD']),

  exchange_rate: z
    .string({
      invalid_type_error: 'La tasa de cambio debe ser un número',
      required_error: 'Debes ingresar la tasa de cambio',
    })
    .regex(/^\d+(\.\d+)?$/, 'La tasa de cambio solo puede tener números'),

  type: z.string({
    invalid_type_error: 'Tipo de pago invalido.',
    required_error: 'Debes ingresar el tipo de pago',
  }),

  bank: z.string({
    invalid_type_error: 'Banco inválido',
    required_error: 'Debes seleccionar un banco',
  }),

  amount_charged: z
    .string({
      invalid_type_error: 'Solo se admiten números',
      required_error:
        'Debes ingresar monto en bolivares con el que se hará el pago',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),

  bankReference: z.string({
    invalid_type_error: 'Referencia bancaria inválida',
    required_error: 'Debes ingresar la referencia bancaria',
  }),

  concept: z.enum(['Payment Fee', 'Penalty'], {
    required_error: 'Debes seleccionar un tipo de pago',
    invalid_type_error: 'Tipo de pago inválido',
  }),

  location: z.string({
    invalid_type_error: 'Selección inválida',
    required_error: 'Debes seleccionar una oficina',
  }),

  numberOfFees: z
    .number({
      invalid_type_error: 'Por favor ingresa el numero de cuota.',
      required_error: 'Debes ingresar las cuotas a pagar',
    })
    .int()
    .positive(),

  date: z.date(),
});

export type ClientPaymentFormValues = z.infer<typeof clientPaymentFormSchema>;

export const BANKS = [
  { id: 1, name: 'BNC' },
  { id: 2, name: 'R4 (Mi Banco)' },
  // { id: 3, name: 'BANCO_MERCANTIL' },
  // { id: 4, name: 'BANCO_PROVINCIAL' },
  // { id: 5, name: 'BANESCO' },
] as const;

export const PAYMENT_TYPES = [
  { id: 'Payment fee', name: 'Pago de cuota' },
  { id: 'Penalty', name: 'Pago por reconexión' },
] as const;

// Constante para la sede
export const LOCATION = 'Chacao';

// Tipos de pago y sus recargos (si aplican)
export const PENALTY_FEE = 10;
