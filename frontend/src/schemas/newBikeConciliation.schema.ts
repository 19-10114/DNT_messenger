import * as z from 'zod';

export const NewBikeConciliationSchema = z.object({
  cedula: z
    .string({
      invalid_type_error: 'La Cedula debe ser un numero.',
      required_error: 'Debes ingresar una cédula de identidad válida',
    })
    .regex(/^\d+(\.\d+)?$/, 'El monto solo puede tener números'),
  product: z.string({
    invalid_type_error: 'El producto debe ser un numero.',
    required_error: 'Debes ingresar el ID de un producto',
  }),
  license_plate: z.string({
    invalid_type_error: 'Placa invalida.',
    required_error: 'Placa invalida',
  }),
  sede: z.string({
    invalid_type_error: 'Selección invalida.',
    required_error: 'Debes la oficina correspondiente',
  }),
  responsable: z.string({
    invalid_type_error: 'Usuario invalido.',
    required_error: 'Refresque la pagina',
  }),
  delivered_date: z.date({
    required_error: 'Selecciona una fecha valida',
    invalid_type_error: 'Coloca la fecha nuevamente.',
  }),
});
export type NewBikeConciliationData = z.infer<typeof NewBikeConciliationSchema>;
