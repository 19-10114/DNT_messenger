import { z } from 'zod';

export const certificateOriginSchema = z.object({
  concesionario: z.string().nonempty('El concesionario es requerido'),
  rif: z.string().nonempty('El RIF es requerido'),
  cedula: z.string().nonempty('La cédula es requerida'),
  factura: z.string().nonempty('El número de factura es requerido'),
  fechaFactura: z.string().nonempty('La fecha de factura es requerida'),
  nombreRazonSocial: z.string().nonempty('Nombre o Razón Social es requerido'),
  casaApto: z.string().optional(), // residence_type + residence
  urbanizacionBarrio: z.string().optional(),
  avenidaCalle: z.string().optional(), // street
  distritoParroquia: z.string().optional(), // district
  ciudad: z.string().optional(),
  state: z.string().optional(),
  codigoPostal: z.string().optional(),
  telefonoHabitacion: z.string().optional(),
  dom_reserve: z.string().optional(),
  dom_number: z.string().optional(),
  insurance_company: z.string().optional(),
  insurance_number: z.string().optional(),
  insurance_expiration: z.string().optional(),
  observations: z.string().optional(),
});

export type CertificateOriginSchemaType = z.infer<
  typeof certificateOriginSchema
>;
