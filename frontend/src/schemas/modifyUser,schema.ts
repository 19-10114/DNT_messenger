import * as z from 'zod';
import { CreateNewUserData } from '@/services/user/types/CreateNewUser.type';

export const ModifyUserFormSchema = z.object({
  email: z
    .string({
      invalid_type_error: 'El correo debe ser una cadena de caracteres.',
    })
    .optional(),
  firstName: z
    .string({
      invalid_type_error: 'El nombre debe ser una cadena de caracteres.',
    })
    .optional(),
  lastName: z
    .string({
      invalid_type_error: 'El apellido debe ser una cadena de caracteres.',
    })
    .optional(),
  documentId: z
    .string({
      invalid_type_error: 'La cédula solo pueden ser números.',
    })
    .optional(),
  rif: z
    .string({
      invalid_type_error: 'El RIF debe solo ser números.',
    })
    .optional(),
  phoneNumber: z
    .string({
      invalid_type_error:
        'El número de teléfono debe ser una cadena de caracteres.',
    })
    .optional(),
  branch: z.string({
    invalid_type_error: 'El branch debe solo ser números.',
    required_error: 'Debes ingresar el branch',
  }),
  role: z.string({
    invalid_type_error: 'El rol debe ser una cadena de caracteres.',
    required_error: 'Debes seleccionar un rol',
  }),
});

export type ModifyUserFormValues = Partial<CreateNewUserData>;
