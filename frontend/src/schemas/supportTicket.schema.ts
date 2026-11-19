import { z } from 'zod';

/** Formulario "Reportar a soporte". Los adjuntos van aparte (AttachmentDropzone). */
export const supportTicketSchema = z.object({
  kind: z.enum(['bug', 'improvement', 'question']),
  title: z
    .string()
    .trim()
    .min(5, 'Escribe un título de al menos 5 caracteres')
    .max(120, 'El título no puede pasar de 120 caracteres'),
  description: z
    .string()
    .trim()
    .min(10, 'Cuéntanos un poco más (al menos 10 caracteres)')
    .max(10000, 'La descripción es demasiado larga'),
  impact: z.enum(['can_work', 'workaround', 'blocked']),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;
