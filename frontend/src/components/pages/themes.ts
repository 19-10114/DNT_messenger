import type { CSSProperties } from 'react';

import { BlockBackground, PageThemeKey } from '@/services/pages/types';

/**
 * Temas de las páginas públicas. Los bloques solo usan estas variables
 * (`var(--pg-*)`), así que cambiar de tema cambia toda la página de forma
 * coherente. El backend solo valida la clave.
 */
export interface PageTheme {
  key: PageThemeKey;
  name: string;
  description: string;
  /** Logo de la cabecera: claro u oscuro según el fondo */
  logo: 'light' | 'dark';
  vars: {
    bg: string;
    surface: string;
    fg: string;
    muted: string;
    border: string;
    primary: string;
    primaryFg: string;
    highlightBg: string;
    highlightFg: string;
    radius: string;
    /** Fondo de los huecos sin imagen: la página se ve bien antes de subir fotos */
    placeholder: string;
  };
}

export const PAGE_THEMES: Record<PageThemeKey, PageTheme> = {
  candela: {
    key: 'candela',
    name: 'Candela',
    description: 'Claro con el naranja de la marca. Ideal para promociones.',
    logo: 'dark',
    vars: {
      bg: '#faf8f5',
      surface: '#ffffff',
      fg: '#141210',
      muted: '#6b645c',
      border: '#ebe5dd',
      primary: '#ff8635',
      primaryFg: '#ffffff',
      highlightBg: '#141210',
      highlightFg: '#ffffff',
      radius: '1.25rem',
      placeholder:
        'radial-gradient(circle at 20% 20%, #ffb37a 0%, transparent 45%), radial-gradient(circle at 80% 30%, #ff8635 0%, transparent 50%), linear-gradient(135deg, #2b1a10 0%, #141210 100%)',
    },
  },
  dark: {
    key: 'dark',
    name: 'Nocturno',
    description: 'Fondo oscuro y acento naranja. Para lanzamientos.',
    logo: 'light',
    vars: {
      bg: '#0b0b0d',
      surface: '#16161a',
      fg: '#f5f5f4',
      muted: '#a1a1aa',
      border: '#26262b',
      primary: '#ff8635',
      primaryFg: '#0b0b0d',
      highlightBg: '#ff8635',
      highlightFg: '#0b0b0d',
      radius: '1rem',
      placeholder:
        'radial-gradient(circle at 75% 25%, rgba(255,134,53,0.55) 0%, transparent 45%), radial-gradient(circle at 15% 80%, rgba(255,134,53,0.25) 0%, transparent 40%), linear-gradient(160deg, #1d1d22 0%, #0b0b0d 100%)',
    },
  },
  light: {
    key: 'light',
    name: 'Limpio',
    description: 'Blanco y sobrio. Para encuestas y páginas informativas.',
    logo: 'dark',
    vars: {
      bg: '#ffffff',
      surface: '#f6f6f5',
      fg: '#111111',
      muted: '#6b7280',
      border: '#e5e7eb',
      primary: '#111111',
      primaryFg: '#ffffff',
      highlightBg: '#f3f0eb',
      highlightFg: '#111111',
      radius: '0.75rem',
      placeholder:
        'radial-gradient(circle at 30% 30%, #e7e5e4 0%, transparent 55%), linear-gradient(135deg, #d6d3d1 0%, #a8a29e 100%)',
    },
  },
};

export const THEME_ORDER: PageThemeKey[] = ['candela', 'dark', 'light'];

export function getTheme(key: string | undefined): PageTheme {
  return PAGE_THEMES[key as PageThemeKey] ?? PAGE_THEMES.candela;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

export const isHexColor = (value: string | undefined | null): value is string =>
  !!value && HEX.test(value);

/** Luminancia relativa (WCAG) de un `#RRGGBB` */
function luminance(hex: string): number {
  const channel = (index: number) => {
    const value = parseInt(hex.slice(index, index + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** Texto legible sobre un color: casi negro o blanco */
export function readableOn(hex: string): string {
  // 0.179: el punto donde el contraste con negro supera al de blanco
  return luminance(hex) > 0.179 ? '#111111' : '#ffffff';
}

/** Acento efectivo: el propio de la página o el del tema */
function accentOf(key: string | undefined, accent?: string | null) {
  const { vars } = getTheme(key);
  return isHexColor(accent)
    ? { primary: accent, primaryFg: readableOn(accent) }
    : { primary: vars.primary, primaryFg: vars.primaryFg };
}

/**
 * Variables CSS del tema, para el `style` del contenedor raíz. Con `accent`
 * (`#RRGGBB`) el acento del tema se reemplaza y su texto se calcula para que
 * siempre se lea.
 */
export function themeStyle(
  key: string | undefined,
  accent?: string | null
): CSSProperties {
  const { vars } = getTheme(key);
  const { primary, primaryFg } = accentOf(key, accent);
  return {
    '--pg-bg': vars.bg,
    '--pg-surface': vars.surface,
    '--pg-fg': vars.fg,
    '--pg-muted': vars.muted,
    '--pg-border': vars.border,
    '--pg-primary': primary,
    '--pg-primary-fg': primaryFg,
    '--pg-highlight-bg': vars.highlightBg,
    '--pg-highlight-fg': vars.highlightFg,
    '--pg-radius': vars.radius,
    '--pg-placeholder': vars.placeholder,
  } as CSSProperties;
}

/**
 * Fondo de un bloque. No pinta colores sueltos: redefine las variables del
 * tema dentro del bloque, así todo lo que el bloque dibuja (texto, tarjetas,
 * botones) se adapta y el texto siempre se lee. Con `theme` (o nada) no
 * cambia nada.
 */
export function blockBackgroundStyle(
  background: BlockBackground | undefined,
  key: string | undefined,
  accent?: string | null
): CSSProperties | undefined {
  if (!background || background === 'theme') return undefined;
  const { vars } = getTheme(key);
  const { primary, primaryFg } = accentOf(key, accent);

  if (background === 'surface') {
    return {
      '--pg-bg': vars.surface,
      '--pg-surface': vars.bg,
      backgroundColor: vars.surface,
    } as CSSProperties;
  }
  if (background === 'accent') {
    const translucent = primaryFg === '#ffffff' ? '255,255,255' : '17,17,17';
    return {
      '--pg-bg': primary,
      '--pg-fg': primaryFg,
      '--pg-muted': `rgba(${translucent},0.82)`,
      '--pg-border': `rgba(${translucent},0.25)`,
      '--pg-surface': `rgba(${translucent},0.10)`,
      // Los botones se invierten: acento sobre acento no se vería
      '--pg-primary': primaryFg,
      '--pg-primary-fg': primary,
      backgroundColor: primary,
      color: primaryFg,
    } as CSSProperties;
  }
  const palette = PAGE_THEMES[background === 'dark' ? 'dark' : 'light'].vars;
  return {
    '--pg-bg': palette.bg,
    '--pg-surface': palette.surface,
    '--pg-fg': palette.fg,
    '--pg-muted': palette.muted,
    '--pg-border': palette.border,
    backgroundColor: palette.bg,
    color: palette.fg,
  } as CSSProperties;
}
