import { PageBlockPayload, PageThemeKey } from '@/services/pages/types';
import { DEFAULT_WHATSAPP } from '../blocks/catalog';

/**
 * Plantillas de arranque. Son solo bloques con textos de ejemplo que
 * explican qué va en cada hueco; no traen fotos (nada se sube al bucket al
 * crear) y los huecos sin foto muestran el degradado del tema.
 *
 * Los bloques de encuesta llevan `surveyId: 0`: el asistente de creación
 * pide elegir la encuesta y, si no se elige, los quita.
 */
export interface PageTemplate {
  key: string;
  name: string;
  description: string;
  theme: PageThemeKey;
  blocks: PageBlockPayload[];
}

const whatsappFloating = (message: string): PageBlockPayload => ({
  type: 'cta',
  variant: 'floating',
  isVisible: true,
  config: {
    kind: 'whatsapp',
    label: 'Escríbenos',
    phone: DEFAULT_WHATSAPP,
    message,
  },
});

const whatsappButton = (
  label: string,
  message: string,
  style: 'primary' | 'outline' = 'primary'
) => ({
  label,
  kind: 'whatsapp' as const,
  phone: DEFAULT_WHATSAPP,
  message,
  style,
});

export const PAGE_TEMPLATES: PageTemplate[] = [
  {
    key: 'promo',
    name: 'Promoción',
    description: 'Una oferta con foto grande, condiciones, fotos y WhatsApp.',
    theme: 'candela',
    blocks: [
      {
        type: 'hero',
        variant: 'full',
        isVisible: true,
        config: {
          title: 'Tu Keeway RKS 150 desde $1.499',
          subtitle:
            'Solo este mes en todas nuestras sucursales. Financiamiento disponible.',
          imageId: null,
          align: 'left',
          buttons: [
            whatsappButton(
              'La quiero',
              'Hola, vi la promoción y quiero la RKS 150.'
            ),
            { label: 'Ver catálogo', kind: 'link', url: '/', style: 'outline' },
          ],
        },
      },
      {
        type: 'text',
        variant: 'plain',
        isVisible: true,
        style: { background: 'dark' },
        config: {
          heading: 'Inicial desde 30%',
          body: 'Válido hasta agotar existencia. Precios en dólares a la tasa del día.',
        },
      },
      {
        type: 'media',
        variant: 'image-left',
        isVisible: true,
        config: {
          heading: 'Lista para la ciudad',
          body: 'Motor de 150 cc, frenos de disco y el respaldo de Moto Candela en todas sus sucursales.\n\nToca la foto para ver la ficha completa cuando elijas un producto del catálogo.',
          imageId: null,
          buttons: [],
        },
      },
      {
        type: 'gallery',
        variant: 'grid',
        isVisible: true,
        config: { heading: 'Mírala de cerca', images: [] },
      },
      whatsappFloating('Hola, vi la promoción y quiero más información.'),
    ],
  },
  {
    key: 'survey',
    name: 'Encuesta de satisfacción',
    description: 'Agradece la compra y pide la opinión del cliente.',
    theme: 'light',
    blocks: [
      {
        type: 'hero',
        variant: 'split',
        isVisible: true,
        config: {
          title: '¡Gracias por elegir Moto Candela!',
          subtitle:
            'Cuéntanos cómo fue tu experiencia. Te toma menos de un minuto.',
          imageId: null,
          align: 'left',
          buttons: [],
        },
      },
      {
        type: 'survey',
        variant: 'flow',
        isVisible: true,
        config: {
          surveyId: 0,
          title: 'Tu opinión cuenta',
          thanks: '¡Gracias! Tu opinión nos ayuda a mejorar.',
        },
      },
      {
        type: 'text',
        variant: 'plain',
        isVisible: true,
        config: {
          heading: '¿Necesitas ayuda?',
          body: 'Escríbenos por WhatsApp al +58 424-2345435 o visítanos en cualquiera de nuestras sucursales.',
        },
      },
    ],
  },
  {
    key: 'launch',
    name: 'Lanzamiento de modelo',
    description:
      'Presenta una moto nueva: portada, ficha por partes, fotos y precio.',
    theme: 'dark',
    blocks: [
      {
        type: 'hero',
        variant: 'full',
        isVisible: true,
        config: {
          title: 'Nueva Keeway V302C',
          subtitle:
            'Estilo bobber y motor bicilíndrico. Ya disponible en Moto Candela.',
          imageId: null,
          align: 'center',
          buttons: [
            whatsappButton(
              'Reserva la tuya',
              'Hola, quiero reservar la nueva Keeway V302C.'
            ),
          ],
        },
      },
      {
        type: 'media',
        variant: 'image-left',
        isVisible: true,
        config: {
          heading: 'Motor bicilíndrico en V',
          body: 'Potencia suave y sonido inconfundible para rodar en carretera.',
          imageId: null,
          buttons: [],
        },
      },
      {
        type: 'media',
        variant: 'image-right',
        isVisible: true,
        config: {
          heading: 'Frenos con ABS y luces LED',
          body: 'Seguridad y estilo en cada detalle, con tablero digital.',
          imageId: null,
          buttons: [],
        },
      },
      {
        type: 'gallery',
        variant: 'carousel',
        isVisible: true,
        config: { heading: '', images: [] },
      },
      {
        type: 'text',
        variant: 'plain',
        isVisible: true,
        style: { background: 'accent' },
        config: {
          heading: 'Desde $4.990',
          body: 'Pregunta por nuestros planes de financiamiento.',
        },
      },
      {
        type: 'cta',
        variant: 'button',
        isVisible: true,
        config: {
          buttons: [
            whatsappButton(
              'Quiero más información',
              'Hola, quiero información sobre la nueva Keeway V302C.'
            ),
          ],
          sublabel: 'Te respondemos en minutos',
        },
      },
    ],
  },
  {
    key: 'event',
    name: 'Evento o caravana',
    description: 'Fecha y lugar, qué habrá y formulario de inscripción.',
    theme: 'candela',
    blocks: [
      {
        type: 'hero',
        variant: 'split',
        isVisible: true,
        config: {
          title: 'Gran caravana Moto Candela',
          subtitle: 'Sábado 15 de noviembre · 9:00 a. m. · Sucursal Cabudare',
          imageId: null,
          align: 'left',
          buttons: [],
        },
      },
      {
        type: 'text',
        variant: 'card',
        isVisible: true,
        config: {
          heading: '¿Qué haremos?',
          body: 'Recorrido guiado, revisión gratuita de tu moto y premios para los asistentes.\n\nTrae tu casco y tus ganas de rodar.',
        },
      },
      {
        type: 'survey',
        variant: 'inline',
        isVisible: true,
        config: {
          surveyId: 0,
          title: 'Inscríbete',
          intro: 'Déjanos tus datos y te guardamos un puesto.',
          thanks: '¡Listo! Te esperamos.',
          buttonLabel: 'Inscribirme',
        },
      },
      whatsappFloating('Hola, quiero información sobre la caravana.'),
    ],
  },
  {
    key: 'blank',
    name: 'En blanco',
    description: 'Solo una portada. Para armarla a tu manera.',
    theme: 'candela',
    blocks: [
      {
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
      },
    ],
  },
];

export const templateNeedsSurvey = (template: PageTemplate) =>
  template.blocks.some((block) => block.type === 'survey');

/**
 * Bloques listos para crear la página: la encuesta elegida en los bloques
 * de encuesta, o sin esos bloques si no se eligió ninguna.
 */
export function templateBlocks(
  template: PageTemplate,
  surveyId: number | null
): PageBlockPayload[] {
  return template.blocks.flatMap<PageBlockPayload>((block) => {
    if (block.type !== 'survey') return [block];
    if (!surveyId) return [];
    return [{ ...block, config: { ...block.config, surveyId } }];
  });
}
