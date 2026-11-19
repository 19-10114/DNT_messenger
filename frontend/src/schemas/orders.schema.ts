import * as z from 'zod';

const CompanySchema = z.object({
  name: z.string({
    invalid_type_error:
      'El nombre de la compañia debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el nombre de la compañia',
  }),
  web_page: z.string().url({ message: ' url invalida ' }),
  instagram: z.string({
    invalid_type_error: 'El instagram debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el instagram de la compañia',
  }),
  facebook: z.string({
    invalid_type_error: 'El facebook debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el facebook de la compañia',
  }),
  address: z.string({
    invalid_type_error: 'La direccion  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar la direccion de la compañia',
  }),
});

const LoanGrantorSchema = z.object({
  first_name: z.string({
    invalid_type_error:
      'El nombre del fiafor debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el nombre del fiador',
  }),
  last_name: z.string({
    invalid_type_error:
      'El apellido del fiafor debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el apellido del fiador',
  }),
  relationship: z.string({
    invalid_type_error: 'La relacion  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar la relacion con el fiador',
  }),
  phone_number: z.string({
    invalid_type_error: 'El numero de telefono debe ser un numero.',
    required_error: 'Debes ingresar el numero de telefono celular del fiador',
  }),
  email: z.string().email({ message: 'correo electronico inavlido' }),
  address_room: z.string({
    invalid_type_error: 'La direccion  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar la direccion de habitacion',
  }),
  land_line_number: z.string({
    invalid_type_error: 'El numero de telefono debe ser un numero.',
    required_error: 'Debes ingresar el numero de telefono fijo del fiador',
  }),
});

const LeaseSchema = z.object({
  type: z.string({
    invalid_type_error:
      'El tipo de arrendamiento  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el tipo  del arrendamiento',
  }),
  state: z.string({
    invalid_type_error:
      'El estado del arrendamiento  debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar el estado  del arrendamiento',
  }),
  user_score: z.string({
    invalid_type_error: 'El puntaje del usuario debe ser un numero.',
    required_error: 'Debes ingresar un precio el puntaje del usuario',
  }),
  product: z.string({
    invalid_type_error: 'El producto debe ser un numero.',
    required_error: 'Debes ingresar el ID de un producto',
  }),
  full_product_price: z.string({
    invalid_type_error: 'El precio del producto debe ser un numero.',
    required_error: 'Debes ingresar el precio del producto',
  }),
  initial_fee: z.string({
    invalid_type_error: 'El precio de entrada debe ser un numero.',
    required_error: 'Debes ingresar un precio de entrada',
  }),
  monthly_fee: z.string({
    invalid_type_error: 'La cuota mensual debe ser un numero.',
    required_error: 'Debes ingresar una cuota mensual',
  }),
  fees_number: z.string({
    invalid_type_error: 'El numero de cuotas debe ser un numero.',
    required_error: 'Debes ingresar un numero de cuotas',
  }),
  address: z.string({
    invalid_type_error: 'La direccion debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar una direccion',
  }),
  lease_reason: z.string({
    invalid_type_error:
      'la razon de arrendamiento debe ser una cadena de caracteres..',
    required_error: 'Debes ingresar la razon de arrendamiento ',
  }),
  country_user_id: z.string({
    invalid_type_error: 'La Cedula debe ser un numero.',
    required_error: 'Debes ingresar una cédula de identidad válida',
  }),
  payment_type: z.string({
    invalid_type_error:
      'Solo se admiten los siguientes campos weekly", "monhtly", "biweekly", "15last, bimonthly".',
    required_error: 'Debes ingresar un tipo de pago válido',
  }),
  location: z.string({
    invalid_type_error: 'La direccion debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar una direccion',
  }),
  contract_id: z
    .string({
      invalid_type_error: 'El contrato solo puede tener números.',
      required_error: 'Debes ingresar el número de contrato',
    })
    .regex(/^[0-9]+$/, 'El contrato solo puede tener números'),
  // payment_type: z.enum(["weekly", "monhtly", "biweekly", "15last"]),
});

export const MySchema = z.object({
  company: CompanySchema,
  loan_grantor: LoanGrantorSchema,
  lease: LeaseSchema,
});

export type LoginFormData = z.infer<typeof MySchema>;
