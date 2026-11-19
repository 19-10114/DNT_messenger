import * as z from 'zod';

export const BikeProductFormSchema = z.object({
  sku: z
    .string({
      invalid_type_error: 'El SKU debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un SKU válido',
    })
    .min(3, 'El SKU debe ser de al menos 3 caracteres'),
  name: z
    .string({
      invalid_type_error:
        'El nombre del producto debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un nombre válido',
    })
    .min(3, 'El nombre del producto debe ser de al menos 3 caracteres'),
  model: z
    .string({
      invalid_type_error: 'El modelo debe ser una cadena de caracteres.',
      required_error: 'Debes ingresar un modelo válido',
    })
    .min(3, 'El modelo debe ser de al menos 3 caracteres'),
  category: z
    .string({
      invalid_type_error: 'La categoria debe ser un numero.',
      required_error: 'Debes seleccionar una categoria',
    })
    .min(1, 'Debes seleccionar una categoría'),
  brand: z.string({
    invalid_type_error: 'La marca debe ser una cadena de caracteres.',
    required_error: 'Debes ingresar una marca',
  }),
});

export type BikeProductFormData = z.infer<typeof BikeProductFormSchema>;
