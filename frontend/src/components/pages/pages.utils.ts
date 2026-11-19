import { AxiosError } from 'axios';

import { PUBLIC_PAGE } from '@/constants/routes';

import {
  PageBlock,
  PageListItem,
  PageStatus,
  PageThemeKey,
} from '@/services/pages/types';

/** Link público de una página (relativo) */
export const publicPagePath = (slug: string) => PUBLIC_PAGE(slug);

/** Link público absoluto, para copiar y compartir */
export function publicPageUrl(slug: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}${publicPagePath(slug)}`;
}

export const PAGE_STATUS_LABELS: Record<PageStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

/** Estado que ve el usuario: una publicada que venció no está "en línea" */
export function pageStatusInfo(
  page: Pick<PageListItem, 'status' | 'isLive' | 'expiresAt'>
): { label: string; tone: 'live' | 'draft' | 'expired' | 'archived' } {
  if (page.status === 'archived')
    return { label: 'Archivada', tone: 'archived' };
  if (page.status === 'draft') return { label: 'Borrador', tone: 'draft' };
  if (!page.isLive) return { label: 'Vencida', tone: 'expired' };
  return { label: 'En línea', tone: 'live' };
}

export const STATUS_TONE_CLASSES: Record<
  ReturnType<typeof pageStatusInfo>['tone'],
  string
> = {
  live: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  draft: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  expired: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  archived: 'bg-gray-50 text-gray-500 ring-gray-400/20',
};

export const isThemeKey = (value: string): value is PageThemeKey =>
  ['candela', 'dark', 'light'].includes(value);

/** Texto del backend o un mensaje por defecto */
export function getPagesErrorMessage(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<{ message?: unknown }>;
  const message = axiosError?.response?.data?.message;
  return typeof message === 'string' && message ? message : fallback;
}

/** Errores por índice de bloque que devuelve `PUT /pages/<id>/blocks` */
export function getBlockErrors(error: unknown): Record<string, string[]> {
  const axiosError = error as AxiosError<{
    errors?: { blocks?: Record<string, string[]> };
  }>;
  return axiosError?.response?.data?.errors?.blocks ?? {};
}

/** Párrafos de un texto plano: separados por una línea en blanco */
export function paragraphs(text: string | undefined): string[] {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

/** `https://wa.me/<número>?text=<mensaje>` */
export function whatsappUrl(phone?: string, message?: string): string {
  const digits = (phone ?? '').replace(/[^0-9]/g, '');
  const text = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${digits}${text}`;
}

/** Ids de fotos subidas que usa un bloque (para la miniatura y la tarjeta) */
export function blockImageIds(block: PageBlock): number[] {
  if (block.type === 'hero' || block.type === 'media') {
    return block.config.imageId ? [block.config.imageId] : [];
  }
  if (block.type === 'gallery') {
    return block.config.images
      .map((image) => image.imageId)
      .filter((id): id is number => !!id);
  }
  return [];
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}
