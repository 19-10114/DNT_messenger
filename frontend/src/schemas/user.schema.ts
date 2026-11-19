import * as z from 'zod';

export const UserFormSchema = z.object({
  username: z.string({
    invalid_type_error:
      'El nombre del usuario debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un usuario válido',
  }),
  email: z.string({
    invalid_type_error: 'El correo debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un correo',
  }),
  firstName: z.string({
    invalid_type_error: 'El nombre debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un nombre',
  }),
  lastName: z.string({
    invalid_type_error: 'El apellido debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un apellido',
  }),
  documentId: z.string({
    invalid_type_error: 'La cédula solo pueden ser números.',
    required_error: 'Debes ingresar tu numero de cédula',
  }),
  branch: z.string({
    invalid_type_error: 'El branch debe solo ser números.',
    required_error: 'Debes ingresar el branch',
  }),
  phoneNumber: z.string({
    invalid_type_error:
      'El número de teléfono debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un número de teléfono',
  }),
  password: z
    .string({
      invalid_type_error: 'La contraseña debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar una contraseña',
    })
    .min(6, 'La contraseña debe ser de al menos 6 caracteres'),
  role: z.string({
    invalid_type_error: 'El rol debe ser una cadena de caracteres.',
    required_error: 'Debes seleccionar un rol',
  }),
});

export type UserFormValues = z.infer<typeof UserFormSchema>;
