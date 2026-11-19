import * as z from 'zod';

export const ClientFormSchema = z.object({
  first_name: z
    .string({
      invalid_type_error: 'El nombre debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un nombre',
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres'),

  last_name: z
    .string({
      invalid_type_error: 'El apellido debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un apellido',
    })
    .min(2, 'El apellido debe tener al menos 2 caracteres'),

  country_id: z
    .string({
      invalid_type_error: 'La cédula debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar la cédula de identidad',
    })
    .min(6, 'La cédula debe tener al menos 6 dígitos'),

  phone_number: z
    .string({
      invalid_type_error:
        'El número de teléfono debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un número de teléfono',
    })
    .min(10, 'El número de teléfono debe tener al menos 10 dígitos'),

  email: z
    .string({
      invalid_type_error: 'El correo debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un correo electrónico',
    })
    .email('Ingresa un correo electrónico válido'),

  address: z
    .string({
      invalid_type_error: 'La dirección debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar una dirección',
    })
    .min(5, 'La dirección debe tener al menos 5 caracteres'),

  city: z
    .string({
      invalid_type_error: 'La ciudad debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar una ciudad',
    })
    .min(2, 'La ciudad debe tener al menos 2 caracteres'),

  residence_type: z.string().optional(),
  street: z.string().optional(),
  residence: z.string().optional(),
  district: z.string().optional(),
  state: z.string().optional(),
  postal_code: z.string().optional(),
  local_phone_number: z.string().optional(),
  origin: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof ClientFormSchema>;
