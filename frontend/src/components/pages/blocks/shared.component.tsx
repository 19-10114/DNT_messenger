'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { BlockStyle, PageImage, TextSize } from '@/services/pages/types';

interface RevealProps {
  enabled: boolean;
  delay?: number;
  className?: string;
  children: React.ReactNode;
}

/** Aparición suave al entrar en pantalla. En la vista previa no anima. */
export function Reveal({
  enabled,
  delay = 0,
  className,
  children,
}: RevealProps) {
  if (!enabled) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

interface PageImgProps {
  image?: PageImage;
  alt: string;
  className?: string;
  /** Carga inmediata para la imagen principal */
  priority?: boolean;
  /**
   * Foto alternativa para anchos de celular (< 768 px). En la página pública
   * se usa `<picture>` y el navegador descarga una sola; en la vista previa
   * se alterna por container query, para que el marco de celular la muestre.
   */
  mobileImage?: PageImage;
  mode?: 'public' | 'preview';
}

/**
 * Imagen recortada al hueco que la contiene (`object-cover`). Sin imagen se
 * ve el degradado del tema, así la página luce bien antes de subir fotos.
 */
export function PageImg({
  image,
  alt,
  className,
  priority,
  mobileImage,
  mode = 'public',
}: PageImgProps) {
  if (mobileImage && mode === 'preview') {
    return (
      <>
        <PageImg
          image={image}
          alt={alt}
          className={cn('hidden page-md:block', className)}
        />
        <PageImg
          image={mobileImage}
          alt={alt}
          className={cn('page-md:hidden', className)}
        />
      </>
    );
  }
  if (mobileImage) {
    return (
      <picture className="contents">
        {image && <source media="(min-width: 768px)" srcSet={image.url} />}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mobileImage.url}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          className={cn('h-full w-full object-cover', className)}
        />
      </picture>
    );
  }
  if (!image) {
    return (
      <div
        aria-hidden
        className={cn('h-full w-full', className)}
        style={{ background: 'var(--pg-placeholder)' }}
      />
    );
  }
  return (
    // Las URLs del bucket son firmadas y cambian en cada carga: next/image
    // no aporta caché aquí y exigiría remotePatterns.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.url}
      alt={alt}
      width={image.width ?? undefined}
      height={image.height ?? undefined}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('h-full w-full object-cover', className)}
    />
  );
}

interface PageButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  tone?: 'primary' | 'light' | 'outline';
}

/** Botón-enlace con los colores del tema */
export function PageButton({
  tone = 'primary',
  className,
  children,
  ...props
}: PageButtonProps) {
  return (
    <a
      {...props}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-base font-semibold shadow-lg transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0',
        tone === 'primary' &&
          'bg-[var(--pg-primary)] text-[var(--pg-primary-fg)]',
        tone === 'light' && 'bg-white text-neutral-900',
        tone === 'outline' &&
          'border border-[var(--pg-border)] bg-transparent text-[var(--pg-fg)] shadow-none',
        className
      )}
    >
      {children}
    </a>
  );
}

/** Abre en otra pestaña solo los enlaces externos */
export function linkTarget(url: string) {
  return /^https?:\/\//.test(url)
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : {};
}

/** Logo de WhatsApp (lucide no trae marcas) */
export function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.03c-.24.68-1.42 1.3-1.95 1.34-.5.05-.97.23-3.27-.68-2.77-1.09-4.53-3.93-4.67-4.11-.13-.18-1.11-1.48-1.11-2.82 0-1.34.7-2 .95-2.27.24-.27.53-.34.71-.34h.51c.16 0 .38-.06.6.46.23.54.77 1.88.84 2.01.07.14.11.3.02.48-.09.18-.14.29-.27.45-.14.16-.29.36-.41.48-.14.14-.28.28-.12.55.16.27.7 1.16 1.51 1.88 1.04.92 1.91 1.21 2.18 1.34.27.14.43.11.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.23.61-.14.25.09 1.58.75 1.85.88.27.14.45.2.52.32.07.11.07.66-.17 1.34Z" />
    </svg>
  );
}

const TEXT_SCALE: Record<TextSize, string | undefined> = {
  sm: '0.85em',
  md: undefined,
  lg: '1.2em',
  xl: '1.45em',
};

/**
 * Color y tamaño elegidos para el título o el texto de un bloque. El tamaño
 * es relativo (`em`) al que el bloque ya define para celular y escritorio,
 * así sigue siendo responsivo.
 */
export function textStyle(
  style: BlockStyle | undefined,
  part: 'heading' | 'body'
): React.CSSProperties | undefined {
  const color = part === 'heading' ? style?.headingColor : style?.bodyColor;
  const size = part === 'heading' ? style?.headingSize : style?.bodySize;
  const fontSize = size ? TEXT_SCALE[size] : undefined;
  if (!color && !fontSize) return undefined;
  return { color, fontSize };
}

/** Envuelve un título o texto con el color y tamaño del bloque */
export function StyledText({
  style,
  part,
  children,
}: {
  style: BlockStyle | undefined;
  part: 'heading' | 'body';
  children: React.ReactNode;
}) {
  const css = textStyle(style, part);
  return css ? <span style={css}>{children}</span> : <>{children}</>;
}
