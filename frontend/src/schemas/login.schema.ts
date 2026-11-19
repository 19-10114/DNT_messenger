import * as z from 'zod';

export const loginFormSchema = z.object({
  username: z.string({
    invalid_type_error: 'El usuario debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar un usuario válido',
  }),
  password: z
    .string({
      invalid_type_error: 'La contraseña debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar una contraseña',
    })
    .min(6, 'La contraseña debe ser de al menos 6 caracteres'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
