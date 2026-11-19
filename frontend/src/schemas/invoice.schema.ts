import { z } from 'zod';

export const invoiceItemSchema = z.object({
  quantity: z.coerce.number().min(1, 'La cantidad debe ser al menos 1'),
  description: z.string().nonempty('La descripción es requerida'),
  unitPrice: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  totalPrice: z.coerce.number().min(0), // Usually calculated, but can be overridden or validated
});

export const invoiceSchema = z.object({
  // Encabezado
  emissionPlace: z.string().nonempty('El lugar de emisión es requerido'),
  day: z.string().nonempty('Día requerido').max(2),
  month: z.string().nonempty('Mes requerido').max(2),
  year: z.string().nonempty('Año requerido').max(4),

  // Cliente
  clientName: z.string().nonempty('Nombre o Razón Social requerido'),
  clientAddress: z.string().optional(), // Domicilio Fiscal (from image)
  clientPhone: z.string().optional(), // Teléfono (from image)
  clientId: z.string().nonempty('C.I. / RIF es requerido'),

  // Detalles Orden
  deliveryOrder: z.string().optional(),
  paymentConditions: z.string().optional(),

  // Items
  items: z.array(invoiceItemSchema).min(1, 'Debe haber al menos un ítem'),

  // Impuestos y Totales
  ivaRate: z.coerce.number().min(0).default(16),
  ivaAmount: z.coerce.number().min(0),

  applyIgtf: z.boolean().default(false),
  igtfRate: z.coerce.number().min(0).default(3),
  igtfAmount: z.coerce.number().min(0),

  // Totales
  subtotal: z.coerce.number(),
  totalToPay: z.coerce.number(),
});

export type InvoiceSchemaType = z.infer<typeof invoiceSchema>;
export type InvoiceItemSchemaType = z.infer<typeof invoiceItemSchema>;
