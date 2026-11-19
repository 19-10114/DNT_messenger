import * as z from 'zod';

export const TransactionFormSchema = z.object({
  // Common fields for all transaction types
  amount: z
    .string({
      invalid_type_error: 'El monto debe ser un numero.',
      required_error: 'Debes ingresar el monto del pago',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  type: z.string({
    invalid_type_error: 'Tipo de transacción invalido.',
    required_error: 'Debes ingresar el tipo de transacción',
  }),
  // Removing description field as it's not part of the backend payload
  responsable: z.string({
    invalid_type_error: 'Usuario invalido.',
    required_error: 'Refresque la pagina',
  }),
  date_delivered: z.date(),

  // Common fields for all transaction categories
  order_id: z.string().optional(),
  invoice_number: z.string().optional(),
  invoice_origin: z.string().optional(),
  reception_date: z.date().optional(),
  product: z.string().optional(),
  notes: z.string().optional(), // Campo de observaciones

  // Fields for motorcycle transactions
  plate: z.string().optional(),
  color: z.string().optional(),
  serial_number: z.string().optional(),
  motor_serial: z.string().optional(),
  in_number: z.string().optional(),
  out_number: z
    .string()
    .optional()
    .refine((val) => !val || /^\d+$/.test(val), {
      message: 'Solo se permiten números',
    }),
  year: z.string().optional(),

  // Fields for spare parts transactions
  quantity: z.string().optional(),
  origin_branch: z.string().optional(),
  target_branch: z.string().optional(),
});

export type TransactionData = z.infer<typeof TransactionFormSchema>;
