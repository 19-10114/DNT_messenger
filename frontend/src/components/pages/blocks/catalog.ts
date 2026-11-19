import {
  ClipboardList,
  GalleryThumbnails,
  LayoutPanelLeft,
  LayoutTemplate,
  LucideIcon,
  MessageCircle,
  ShoppingBag,
  Type,
} from 'lucide-react';

import {
  BlockType,
  BlockVariantByType,
  PageBlockPayload,
  PageButton,
} from '@/services/pages/types';

export const DEFAULT_WHATSAPP = '+584242345435';

/** Botón nuevo con valores de ejemplo */
export const newButton = (
  kind: PageButton['kind'] = 'whatsapp',
  style: PageButton['style'] = 'primary'
): PageButton =>
  kind === 'whatsapp'
    ? {
        label: 'Escríbenos',
        kind,
        phone: DEFAULT_WHATSAPP,
        message: 'Hola, quiero más información.',
        style,
      }
    : { label: 'Ver más', kind, url: 'https://', style };

interface VariantInfo<V extends string> {
  value: V;
  label: string;
  hint: string;
}

export interface BlockCatalogEntry<T extends BlockType> {
  type: T;
  label: string;
  description: string;
  icon: LucideIcon;
  variants: VariantInfo<BlockVariantByType[T]>[];
  /** Bloque nuevo con textos de ejemplo, listo para editar */
  create: () => Extract<PageBlockPayload, { type: T }>;
}

/** Catálogo cerrado de bloques: lo que se puede agregar a una página */
export const BLOCK_CATALOG: { [K in BlockType]: BlockCatalogEntry<K> } = {
  hero: {
    type: 'hero',
    label: 'Portada',
    description: 'Foto grande con título, frase y botones.',
    icon: LayoutTemplate,
    variants: [
      {
        value: 'full',
        label: 'Pantalla completa',
        hint: 'El texto va sobre la foto',
      },
      {
        value: 'split',
        label: 'Dividida',
        hint: 'Foto a un lado, texto al otro',
      },
    ],
    create: () => ({
      type: 'hero',
      variant: 'split',
      isVisible: true,
      config: {
        title: 'Escribe aquí tu título',
        subtitle: 'Y aquí una frase que invite a seguir leyendo.',
        imageId: null,
        align: 'left',
        buttons: [],
      },
    }),
  },
  text: {
    type: 'text',
    label: 'Texto',
    description: 'Un título y uno o varios párrafos.',
    icon: Type,
    variants: [
      { value: 'plain', label: 'Simple', hint: 'Texto sobre el fondo' },
      { value: 'card', label: 'Tarjeta', hint: 'Dentro de un recuadro' },
    ],
    create: () => ({
      type: 'text',
      variant: 'plain',
      isVisible: true,
      config: {
        heading: 'Un título corto',
        body: 'Cuenta aquí lo importante.\n\nDeja una línea en blanco para empezar otro párrafo.',
      },
    }),
  },
  media: {
    type: 'media',
    label: 'Texto e imagen',
    description: 'Una foto o producto junto a un texto, con botones.',
    icon: LayoutPanelLeft,
    variants: [
      {
        value: 'image-left',
        label: 'Foto a la izquierda',
        hint: 'Texto a la derecha',
      },
      {
        value: 'image-right',
        label: 'Foto a la derecha',
        hint: 'Texto a la izquierda',
      },
      { value: 'overlay', label: 'Texto sobre la foto', hint: 'Foto de fondo' },
    ],
    create: () => ({
      type: 'media',
      variant: 'image-left',
      isVisible: true,
      config: {
        heading: 'Lo que la hace especial',
        body: 'Cuenta aquí un detalle con su foto.\n\nAgrega otro bloque igual con la foto al otro lado para armar una ficha.',
        imageId: null,
        buttons: [],
      },
    }),
  },
  gallery: {
    type: 'gallery',
    label: 'Galería',
    description: 'Varias fotos en cuadrícula o carrusel.',
    icon: GalleryThumbnails,
    variants: [
      { value: 'grid', label: 'Cuadrícula', hint: 'Se amplían al tocarlas' },
      {
        value: 'carousel',
        label: 'Carrusel',
        hint: 'Una a la vez, pasan solas',
      },
    ],
    create: () => ({
      type: 'gallery',
      variant: 'grid',
      isVisible: true,
      config: { heading: '', images: [] },
    }),
  },
  products: {
    type: 'products',
    label: 'Productos',
    description: 'Motos o repuestos del catálogo; cada uno abre su ficha.',
    icon: ShoppingBag,
    variants: [
      { value: 'grid', label: 'Cuadrícula', hint: '2 o 3 por fila' },
      { value: 'carousel', label: 'Carrusel', hint: 'Se deslizan de lado' },
    ],
    create: () => ({
      type: 'products',
      variant: 'grid',
      isVisible: true,
      config: { heading: 'Elige la tuya', showPrice: true, products: [] },
    }),
  },
  cta: {
    type: 'cta',
    label: 'Botón',
    description: 'Hasta 3 botones de WhatsApp o enlaces, o uno flotante.',
    icon: MessageCircle,
    variants: [
      { value: 'button', label: 'Botones', hint: 'Centrados en la página' },
      {
        value: 'floating',
        label: 'Flotante',
        hint: 'Siempre visible abajo a la derecha',
      },
    ],
    create: () => ({
      type: 'cta',
      variant: 'button',
      isVisible: true,
      config: {
        buttons: [{ ...newButton(), label: 'Escríbenos por WhatsApp' }],
        sublabel: 'Te respondemos en minutos',
      },
    }),
  },
  survey: {
    type: 'survey',
    label: 'Encuesta',
    description: 'Una encuesta del módulo de Encuestas.',
    icon: ClipboardList,
    variants: [
      {
        value: 'flow',
        label: 'Una pregunta a la vez',
        hint: 'Con barra de progreso',
      },
      { value: 'inline', label: 'Todas juntas', hint: 'Para encuestas cortas' },
    ],
    create: () => ({
      type: 'survey',
      variant: 'flow',
      isVisible: true,
      // Se elige la encuesta al agregar el bloque; 0 = sin elegir
      config: { surveyId: 0, thanks: '¡Gracias! Recibimos tus respuestas.' },
    }),
  },
};

export const BLOCK_ORDER: BlockType[] = [
  'hero',
  'text',
  'media',
  'gallery',
  'products',
  'cta',
  'survey',
];

/** Resumen corto de un bloque para la lista del editor */
export function blockSummary(
  block: PageBlockPayload,
  surveyTitle?: string,
  productName?: (id: number) => string | undefined
): string {
  switch (block.type) {
    case 'hero':
      return block.config.title;
    case 'text':
      return block.config.heading || block.config.body.slice(0, 60);
    case 'gallery': {
      const count = block.config.images.length;
      return count ? `${count} foto${count === 1 ? '' : 's'}` : 'Sin fotos';
    }
    case 'media':
      return block.config.heading || block.config.body.slice(0, 60);
    case 'products': {
      const count = block.config.products.length;
      if (!count) return 'Sin productos';
      const first = productName?.(block.config.products[0].productId);
      return first && count > 1
        ? `${first} y ${count - 1} más`
        : (first ?? `${count} productos`);
    }
    case 'cta':
      if (block.variant === 'floating') return block.config.label ?? '';
      return (
        (block.config.buttons ?? []).map((b) => b.label).join(' · ') ||
        'Sin botones'
      );
    case 'survey':
      return (
        surveyTitle ??
        (block.config.surveyId ? 'Encuesta' : 'Sin encuesta elegida')
      );
  }
}
