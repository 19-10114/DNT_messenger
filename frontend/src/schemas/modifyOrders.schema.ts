import * as z from 'zod';

export const ModifyLeaseSchema = z.object({
  product_id: z.number({
    invalid_type_error: 'El producto debe ser un numero.',
    required_error: 'Debes ingresar el ID de un producto',
  }),
  // .regex(/^\d+(\.\d+)?$/, 'El ID solo puede tener números'),
  full_product_price: z.number({
    invalid_type_error: 'El precio del producto debe ser un numero.',
    required_error: 'Debes ingresar el precio del producto',
  }),
  // .regex(/^\d+(\.\d+)?$/, 'El producto solo puede tener números'),
  initial_fee: z.number({
    invalid_type_error: 'El precio de entrada debe ser un numero.',
    required_error: 'Debes ingresar un precio de entrada',
  }),
  // .regex(/^\d+(\.\d+)?$/, 'El precio solo puede tener números'),
  monthly_fee: z.number({
    invalid_type_error: 'La cuota mensual debe ser un numero.',
    required_error: 'Debes ingresar una cuota mensual',
  }),
  // .regex(/^\d+(\.\d+)?$/, 'El precio solo puede tener números'),
  fees_number: z.number({
    invalid_type_error: 'El numero de cuotas debe ser un numero.',
    required_error: 'Debes ingresar un numero de cuotas',
  }),
  // .regex(/^\d+(\.\d+)?$/, 'La cuota solo puede tener números'),
  payment_type: z.string({
    invalid_type_error:
      'Solo se admiten los siguientes campos weekly", "monhtly", "biweekly", "15last, bimonthly".',
    required_error: 'Debes ingresar un tipo de pago válido',
  }),
  product_name: z
    .string({
      invalid_type_error: 'Selección inválida',
      required_error: 'Debes colocar un producto valido',
    })
    .optional(),
  contract_id: z.string({
    invalid_type_error: 'El contrato solo puede tener números.',
    required_error: 'Debes ingresar el número de contrato',
  }),
  // .regex(/^[0-9]+$/, 'El contrato solo puede tener números'),
  // payment_type: z.enum(["weekly", "monhtly", "biweekly", "15last"]),
});

export type ModifyOrderData = z.infer<typeof ModifyLeaseSchema>;
