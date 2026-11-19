import { z } from 'zod';

import { BlockType, PageBlockPayload } from '@/services/pages/types';

/**
 * Validación de bloques en el navegador, espejo de
 * `pages/services/block_types.py` en el backend. Sirve para marcar los
 * errores en el editor antes de guardar; el backend vuelve a validar.
 */

const SAFE_URL = /^(https?:\/\/\S+|\/\S*|mailto:\S+|tel:\+?[0-9]{6,15})$/;
const PHONE = /^\+?[0-9]{8,15}$/;

const text = (max: number, label: string) =>
  z.string().max(max, `${label}: máximo ${max} caracteres`);
const required = (max: number, label: string) =>
  text(max, label).trim().min(1, `${label} es obligatorio`);
const id = z.number().int().positive();
const optionalId = id.nullable().optional();

/** Un botón: WhatsApp necesita número; un enlace, URL */
const button = z
  .object({
    label: required(24, 'El texto del botón'),
    kind: z.enum(['whatsapp', 'link']),
    phone: z.string().optional(),
    message: text(200, 'El mensaje').optional(),
    url: z.string().optional(),
    style: z.enum(['primary', 'outline']).optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === 'whatsapp' && !PHONE.test(value.phone ?? '')) {
      context.addIssue({
        code: 'custom',
        message:
          'El número de WhatsApp debe tener código de país, p. ej. +584141234567',
      });
    }
    if (value.kind === 'link' && !SAFE_URL.test(value.url ?? '')) {
      context.addIssue({
        code: 'custom',
        message: 'El enlace debe empezar por https://, / , mailto: o tel:',
      });
    }
  });
const buttons = z.array(button).max(3, 'Máximo 3 botones');

/** Una foto subida o un producto, no los dos */
const oneMedia = (value: {
  imageId?: number | null;
  productId?: number | null;
}) => !(value.imageId && value.productId);
const ONE_MEDIA = 'Usa una foto o un producto, no los dos';

const SCHEMAS: Record<BlockType, z.ZodTypeAny> = {
  hero: z
    .object({
      title: required(80, 'El título'),
      subtitle: text(160, 'La frase').optional(),
      imageId: optionalId,
      productId: optionalId,
      mobileImageId: optionalId,
      showPrice: z.boolean().optional(),
      align: z.enum(['left', 'center']).optional(),
      buttons: buttons.optional(),
    })
    .refine(oneMedia, ONE_MEDIA),
  text: z.object({
    heading: text(80, 'El título').optional(),
    body: required(1200, 'El texto'),
  }),
  media: z
    .object({
      heading: text(80, 'El título').optional(),
      body: required(1200, 'El texto'),
      imageId: optionalId,
      productId: optionalId,
      showPrice: z.boolean().optional(),
      buttons: buttons.optional(),
    })
    .refine(oneMedia, ONE_MEDIA),
  gallery: z.object({
    heading: text(80, 'El título').optional(),
    showPrice: z.boolean().optional(),
    images: z
      .array(
        z
          .object({
            imageId: optionalId,
            productId: optionalId,
            caption: text(80, 'El pie de foto').optional(),
          })
          .refine((item) => !!(item.imageId || item.productId), 'Falta la foto')
          .refine(oneMedia, ONE_MEDIA)
      )
      .max(12, 'Máximo 12 fotos'),
  }),
  products: z.object({
    heading: text(80, 'El título').optional(),
    showPrice: z.boolean().optional(),
    products: z
      .array(
        z.object({ productId: id, caption: text(80, 'El nombre').optional() })
      )
      .min(2, 'Elige al menos 2 productos')
      .max(6, 'Máximo 6 productos'),
  }),
  // `cta` depende de la variante: se valida en validateBlock
  cta: z.any(),
  survey: z.object({
    surveyId: z.number().int().positive('Elige una encuesta'),
    thanks: required(300, 'El mensaje de agradecimiento'),
    title: text(80, 'El título').optional(),
    intro: text(300, 'La introducción').optional(),
    buttonLabel: text(30, 'El texto del botón').optional(),
  }),
};

const CTA_BUTTONS = z.object({
  buttons: buttons.min(1, 'Agrega al menos un botón'),
  sublabel: text(60, 'El texto de apoyo').optional(),
});

const CTA_FLOATING = z
  .object({
    kind: z.enum(['whatsapp', 'link']),
    label: required(30, 'El texto del botón'),
    phone: z.string().optional(),
    message: text(200, 'El mensaje').optional(),
    url: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.kind === 'whatsapp' && !PHONE.test(value.phone ?? '')) {
      context.addIssue({
        code: 'custom',
        message:
          'El número de WhatsApp debe tener código de país, p. ej. +584141234567',
      });
    }
    if (value.kind === 'link' && !SAFE_URL.test(value.url ?? '')) {
      context.addIssue({
        code: 'custom',
        message: 'El enlace debe empezar por https://, / , mailto: o tel:',
      });
    }
  });

/** Mensajes de error de un bloque; vacío si está bien */
export function validateBlock(block: PageBlockPayload): string[] {
  const schema =
    block.type === 'cta'
      ? block.variant === 'floating'
        ? CTA_FLOATING
        : CTA_BUTTONS
      : SCHEMAS[block.type];
  const result = schema.safeParse(block.config);
  if (result.success) return [];
  return Array.from(new Set(result.error.issues.map((issue) => issue.message)));
}

export const MAX_BLOCKS = 20;
