'use client';

import React from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';

import { cn, usdFormatCurrency } from '@/lib/utils';
import {
  MediaSlot,
  PageButton as PageButtonData,
  PageImage,
  PageProductRef,
} from '@/services/pages/types';
import { whatsappUrl } from '../pages.utils';
import { BlockRenderContext } from './blockContext';
import { PageImg, WhatsappIcon, linkTarget } from './shared.component';

/** Foto de un hueco: la subida, o la destacada del producto del catálogo */
export function resolveMedia(
  slot: MediaSlot | undefined,
  ctx: BlockRenderContext
): { image?: PageImage; product?: PageProductRef } {
  if (!slot) return {};
  if (slot.productId) {
    const product = ctx.products[slot.productId];
    const url = product?.images[0];
    return {
      product,
      image: url ? { id: 0, url, width: null, height: null } : undefined,
    };
  }
  return { image: slot.imageId ? ctx.images[slot.imageId] : undefined };
}

export const formatPrice = (price: number | null | undefined) =>
  price === null || price === undefined ? null : usdFormatCurrency(price);

interface MediaImgProps {
  slot: MediaSlot | undefined;
  ctx: BlockRenderContext;
  alt: string;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
  showPrice?: boolean;
  /** Etiqueta con el nombre del producto sobre la foto */
  showName?: boolean;
  /** Foto alternativa para celular (portada) */
  mobileImage?: PageImage;
}

/**
 * Imagen de un bloque. Si es un producto del catálogo, en la página pública
 * se puede tocar y abre su ficha; con `showPrice`, lleva el precio encima.
 */
export function MediaImg({
  slot,
  ctx,
  alt,
  className,
  imgClassName,
  priority,
  showPrice,
  showName,
  mobileImage,
}: MediaImgProps) {
  const { image, product } = resolveMedia(slot, ctx);
  const price = showPrice ? formatPrice(product?.price) : null;
  const clickable = !!product && ctx.mode === 'public' && !!ctx.onOpenProduct;

  const content = (
    <>
      <PageImg
        image={image}
        alt={product?.name ?? alt}
        className={imgClassName}
        priority={priority}
        mobileImage={mobileImage}
        mode={ctx.mode}
      />
      {product && (showName || price) && (
        <span className="absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-1">
          {showName && (
            <span className="truncate rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              {product.name}
            </span>
          )}
          {price && (
            <span className="rounded-full bg-[var(--pg-primary)] px-3 py-1 text-sm font-bold text-[var(--pg-primary-fg)] shadow">
              {price}
            </span>
          )}
        </span>
      )}
    </>
  );

  if (!clickable) {
    return <div className={cn('relative', className)}>{content}</div>;
  }
  return (
    <button
      type="button"
      onClick={() => ctx.onOpenProduct?.(product.id)}
      className={cn('group relative block w-full text-left', className)}
      aria-label={`Ver ${product.name}`}
    >
      {content}
      <span className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow transition-opacity group-hover:opacity-100">
        <ArrowUpRight className="h-4 w-4" />
      </span>
    </button>
  );
}

interface ButtonRowProps {
  buttons: PageButtonData[] | undefined;
  /** Sobre una foto: el contorno se dibuja claro u oscuro, no con el tema */
  onPhoto?: 'light' | 'dark';
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  /** Botones de WhatsApp rellenos en el verde de WhatsApp (bloque Botón) */
  whatsappGreen?: boolean;
  className?: string;
}

/** Hasta tres botones en fila (apilados en celular) */
export function ButtonRow({
  buttons,
  onPhoto,
  align = 'left',
  size = 'md',
  whatsappGreen = false,
  className,
}: ButtonRowProps) {
  const valid = (buttons ?? []).filter((button) => button.label);
  if (valid.length === 0) return null;
  return (
    <div
      className={cn(
        'flex flex-col gap-3 page-md:flex-row page-md:flex-wrap',
        align === 'center'
          ? 'items-center page-md:justify-center'
          : 'items-start',
        className
      )}
    >
      {valid.map((button, index) => {
        const isWhatsapp = button.kind === 'whatsapp';
        const href = isWhatsapp
          ? whatsappUrl(button.phone, button.message)
          : button.url || '#';
        const target = isWhatsapp
          ? { target: '_blank', rel: 'noopener noreferrer' }
          : linkTarget(href);
        const outline = button.style === 'outline';
        const Icon = isWhatsapp
          ? WhatsappIcon
          : outline
            ? ArrowUpRight
            : ArrowRight;
        const green = whatsappGreen && isWhatsapp && !outline;
        return (
          <a
            key={`${button.label}-${index}`}
            href={href}
            {...target}
            className={cn(
              'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform duration-200 hover:-translate-y-0.5 active:translate-y-0',
              size === 'lg' ? 'px-9 py-4 text-lg' : 'px-7 py-3.5 text-base',
              !outline && 'shadow-lg hover:shadow-xl',
              !outline &&
                !green &&
                'bg-[var(--pg-primary)] text-[var(--pg-primary-fg)]',
              green && 'bg-[#25D366] text-white',
              outline &&
                !onPhoto &&
                'border-2 border-[var(--pg-fg)]/80 text-[var(--pg-fg)]',
              outline &&
                onPhoto === 'light' &&
                'border-2 border-white/90 text-white backdrop-blur-sm',
              outline &&
                onPhoto === 'dark' &&
                'border-2 border-neutral-900/80 text-neutral-900 backdrop-blur-sm'
            )}
          >
            <Icon className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
            {button.label}
          </a>
        );
      })}
    </div>
  );
}
