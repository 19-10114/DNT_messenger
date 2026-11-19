'use client';

import React, { useEffect, useState } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PageProductRef, PageThemeKey } from '@/services/pages/types';
import { formatPrice } from '../blocks/media.component';
import { PageImg, WhatsappIcon } from '../blocks/shared.component';
import { publicPageUrl, whatsappUrl } from '../pages.utils';
import { themeStyle } from '../themes';

interface PageProductModalProps {
  product: PageProductRef | null;
  onClose: () => void;
  theme: PageThemeKey;
  accentColor?: string;
  pageSlug: string;
  /** Número de WhatsApp de la página (el del botón flotante) o el general */
  phone: string;
  showPrice: boolean;
}

/**
 * Ficha de un producto del catálogo dentro de una página pública: fotos,
 * nombre, precio y WhatsApp. Lleva el tema de la página (se dibuja en un
 * portal, fuera del contenedor que define las variables).
 */
export function PageProductModal({
  product,
  onClose,
  theme,
  accentColor,
  pageSlug,
  phone,
  showPrice,
}: PageProductModalProps) {
  const [selected, setSelected] = useState(0);
  useEffect(() => setSelected(0), [product?.id]);

  const images = product?.images ?? [];
  const current = images[selected];
  const price = showPrice ? formatPrice(product?.price) : null;
  const message = product
    ? `Hola, me interesa ${product.name}${
        product.model ? ` (${product.model})` : ''
      } que vi en ${publicPageUrl(pageSlug)}`
    : '';

  return (
    <DialogPrimitive.Root
      open={!!product}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          style={themeStyle(theme, accentColor)}
          className="fixed left-1/2 top-1/2 z-50 flex max-h-[92vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[var(--pg-radius)] bg-[var(--pg-bg)] text-[var(--pg-fg)] shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 sm:flex-row"
        >
          {product && (
            <>
              <div className="flex flex-col gap-2 bg-[var(--pg-surface)] p-3 sm:w-1/2">
                <div className="aspect-square overflow-hidden rounded-[calc(var(--pg-radius)*0.7)] bg-white">
                  <PageImg
                    image={
                      current
                        ? { id: 0, url: current, width: null, height: null }
                        : undefined
                    }
                    alt={product.name}
                    className="object-contain"
                  />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((url, index) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setSelected(index)}
                        className={cn(
                          'h-14 w-14 shrink-0 overflow-hidden rounded-md ring-2 ring-offset-1',
                          index === selected
                            ? 'ring-[var(--pg-primary)]'
                            : 'ring-transparent opacity-70'
                        )}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-6">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--pg-muted)]">
                  {product.brand}
                  {product.category === 2 ? ' · Repuesto' : ''}
                </span>
                <DialogPrimitive.Title className="text-2xl font-bold leading-tight">
                  {product.name}
                </DialogPrimitive.Title>
                {product.model && product.model !== product.name && (
                  <p className="text-sm text-[var(--pg-muted)]">
                    Modelo {product.model}
                  </p>
                )}
                {price && (
                  <p className="text-3xl font-extrabold text-[var(--pg-primary)]">
                    {price}
                  </p>
                )}
                {product.description && (
                  <DialogPrimitive.Description className="whitespace-pre-line text-[var(--pg-muted)]">
                    {product.description}
                  </DialogPrimitive.Description>
                )}
                <a
                  href={whatsappUrl(phone, message)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 py-3.5 font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <WhatsappIcon className="h-5 w-5" />
                  Consultar por WhatsApp
                </a>
              </div>
              <DialogPrimitive.Close
                aria-label="Cerrar"
                className="absolute right-3 top-3 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
