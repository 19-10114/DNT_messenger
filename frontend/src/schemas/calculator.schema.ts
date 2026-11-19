import * as z from 'zod';

export const CalculatorFormSchema = z.object({
  modelo: z
    .string({
      invalid_type_error:
        'El nombre del producto debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un nombre válido',
    })
    .min(3, 'El nombre del producto debe ser de al menos 3 caracteres'),
  inicial: z
    .string({
      invalid_type_error: 'El precio de entrada debe ser un numero.',
      required_error: 'Debes ingresar un precio de entrada',
    })
    .regex(/^[0-9]+$/, 'El precio debe contener  solo números'),
  cuota: z
    .string({
      invalid_type_error: 'El precio de contado debe ser un numero.',
      required_error: 'Debes ingresar un precio de contado',
    })
    .regex(/^[0-9]+$/, 'El precio debe contener  solo números'),
  tipo: z.string({
    invalid_type_error:
      'Solo se admiten los siguientes campos "SEMANAL", "MENSUAL", "QUINCENAL"',
    required_error: 'Debes ingresar un tipo de pago válido',
  }),
});

export type CalculatorForm = z.infer<typeof CalculatorFormSchema>;
