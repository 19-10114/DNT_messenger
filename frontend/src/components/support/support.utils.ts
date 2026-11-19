import axios from 'axios';
import { Bug, HelpCircle, Lightbulb, LucideIcon } from 'lucide-react';

import {
  SupportTicketImpact,
  SupportTicketKind,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/services/support/types';

/** El equipo de soporte es Super Admin: el mismo criterio que el backend */
export function isSupportAgent(
  roles: string[],
  isSuperuser: boolean | undefined,
  isStaff: boolean | undefined
): boolean {
  return (isSuperuser === true && isStaff === false) || roles.includes('admin');
}

export const KIND_CONFIG: Record<
  SupportTicketKind,
  {
    label: string;
    icon: LucideIcon;
    tone: string;
    placeholder: string;
    titlePlaceholder: string;
  }
> = {
  bug: {
    label: 'Error',
    icon: Bug,
    tone: 'bg-red-100 text-red-700',
    titlePlaceholder: 'Ej.: No puedo guardar una orden nueva',
    placeholder:
      '¿Qué estabas haciendo? ¿Qué esperabas que pasara? ¿Qué pasó en cambio?',
  },
  improvement: {
    label: 'Mejora',
    icon: Lightbulb,
    tone: 'bg-amber-100 text-amber-700',
    titlePlaceholder: 'Ej.: Filtrar las órdenes por vendedor',
    placeholder: '¿Qué te gustaría poder hacer y para qué te serviría?',
  },
  question: {
    label: 'Pregunta',
    icon: HelpCircle,
    tone: 'bg-blue-100 text-blue-700',
    titlePlaceholder: 'Ej.: ¿Cómo anulo una preorden?',
    placeholder: '¿Qué necesitas saber?',
  },
};

export const KIND_ORDER: SupportTicketKind[] = [
  'bug',
  'improvement',
  'question',
];

/** Cómo lo ve quien reporta ("Esperando tu respuesta") */
export const STATUS_LABELS: Record<SupportTicketStatus, string> = {
  new: 'Nuevo',
  in_review: 'En revisión',
  in_progress: 'En progreso',
  waiting_reporter: 'Esperando tu respuesta',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  discarded: 'Descartado',
};

/** Cómo lo ve el equipo ("Esperando al usuario") */
export const AGENT_STATUS_LABELS: Record<SupportTicketStatus, string> = {
  ...STATUS_LABELS,
  waiting_reporter: 'Esperando al usuario',
};

export const STATUS_BADGE_CLASSES: Record<SupportTicketStatus, string> = {
  new: 'bg-sky-100 text-sky-800',
  in_review: 'bg-indigo-100 text-indigo-800',
  in_progress: 'bg-blue-100 text-blue-800',
  waiting_reporter: 'bg-amber-100 text-amber-800',
  resolved: 'bg-emerald-100 text-emerald-800',
  closed: 'bg-gray-100 text-gray-700',
  discarded: 'bg-gray-100 text-gray-500 line-through',
};

/** Orden de las pestañas de la lista del equipo */
export const INBOX_STATUS_TABS: SupportTicketStatus[] = [
  'new',
  'in_review',
  'in_progress',
  'resolved',
  'closed',
  'discarded',
];

export const IMPACT_LABELS: Record<SupportTicketImpact, string> = {
  can_work: 'Sí, puedo seguir',
  workaround: 'Con rodeos',
  blocked: 'No, estoy bloqueado',
};

/** Para el equipo: lo que respondió quien reportó */
export const IMPACT_SHORT_LABELS: Record<SupportTicketImpact, string> = {
  can_work: 'Puede seguir',
  workaround: 'Con rodeos',
  blocked: 'Bloqueado',
};

export const IMPACT_CLASSES: Record<SupportTicketImpact, string> = {
  can_work: 'text-gray-500',
  workaround: 'text-amber-700',
  blocked: 'text-red-700 font-semibold',
};

export const PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica',
};

export const PRIORITY_CLASSES: Record<SupportTicketPriority, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-600 text-white',
};

export const PRIORITY_ORDER: SupportTicketPriority[] = [
  'critical',
  'high',
  'medium',
  'low',
];

// Límites de adjuntos: los mismos que valida el backend (support/services.py)
export const MAX_FILES = 5;
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime',
];
export const ACCEPT_ATTRIBUTE = ACCEPTED_TYPES.join(',');

export function formatTicketNumber(id: number): string {
  return `#${id}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const dateTimeFormatter = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatSupportDateTime(iso: string | null | undefined): string {
  if (!iso) return '';
  return dateTimeFormatter.format(new Date(iso));
}

/** "hace 5 min", "hace 3 h", "hace 2 días" o la fecha */
export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.round(hours / 24);
  if (days < 7) return `hace ${days} ${days === 1 ? 'día' : 'días'}`;
  return formatSupportDateTime(iso);
}

// Mensajes del backend (en inglés) que quien reporta puede ver
const BACKEND_MESSAGES: [RegExp, string][] = [
  [
    /At most \d+ files/,
    `Puedes adjuntar hasta ${MAX_FILES} archivos por envío.`,
  ],
  [/add up to more than/, 'Los archivos juntos pesan más de 25 MB.'],
  [/File size too large/, 'Un archivo pesa más de 10 MB.'],
  [/Unsupported file/, 'Solo se aceptan imágenes y videos (mp4, webm, mov).'],
  [/Image dimensions too large/, 'Una imagen es demasiado grande.'],
  [/Cannot read image/, 'No se pudo leer una de las imágenes.'],
  [/This ticket is closed/, 'Este reporte está cerrado. Crea uno nuevo.'],
  [/Write a message or attach/, 'Escribe un mensaje o adjunta un archivo.'],
  [/Describe the resolution/, 'Describe la solución para quien reportó.'],
  [/Cannot move a ticket/, 'Ese cambio de estado no está permitido.'],
  [/cannot duplicate itself/, 'Un reporte no puede ser duplicado de sí mismo.'],
  [/Ticket not found/, 'No se encontró el reporte.'],
];

function translate(message: string): string {
  const match = BACKEND_MESSAGES.find(([pattern]) => pattern.test(message));
  return match ? match[1] : message;
}

/** Mensaje legible del envoltorio de error de la API */
export function getSupportErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'No hay conexión con el servidor. Revisa tu internet e intenta de nuevo.';
    }
    const data = error.response.data as
      | { message?: string; errors?: unknown }
      | undefined;
    const errors = data?.errors;
    if (errors && typeof errors === 'object' && !Array.isArray(errors)) {
      const messages = Object.values(errors as Record<string, unknown>)
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .map((value) => translate(String(value)));
      if (messages.length) return messages.join(' ');
    }
    if (data?.message) return translate(data.message);
  }
  return fallback;
}

/** "Chrome 130 · Windows" a partir del user agent. Aproximado, para leer rápido. */
export function describeUserAgent(userAgent: string | undefined): string {
  if (!userAgent) return 'Desconocido';
  const browsers: [RegExp, string][] = [
    [/Edg\/(\d+)/, 'Edge'],
    [/OPR\/(\d+)/, 'Opera'],
    [/SamsungBrowser\/(\d+)/, 'Samsung Internet'],
    [/Firefox\/(\d+)/, 'Firefox'],
    [/CriOS\/(\d+)/, 'Chrome'],
    [/Chrome\/(\d+)/, 'Chrome'],
    [/Version\/(\d+).*Safari/, 'Safari'],
  ];
  const systems: [RegExp, string][] = [
    [/Windows/, 'Windows'],
    [/Android/, 'Android'],
    [/iPhone|iPad|iPod/, 'iOS'],
    [/Mac OS X/, 'macOS'],
    [/CrOS/, 'ChromeOS'],
    [/Linux/, 'Linux'],
  ];
  const browser = browsers.find(([pattern]) => pattern.test(userAgent));
  const version = browser ? userAgent.match(browser[0])?.[1] : undefined;
  const system = systems.find(([pattern]) => pattern.test(userAgent));
  return [
    browser ? `${browser[1]} ${version ?? ''}`.trim() : 'Navegador',
    system?.[1],
  ]
    .filter(Boolean)
    .join(' · ');
}
