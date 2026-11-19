'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { BlockRenderProps } from '../blockContext';
import { formatPrice } from '../media.component';
import { PageImg, Reveal, StyledText } from '../shared.component';

/** Productos del catálogo; cada tarjeta abre la ficha del producto */
export function ProductsBlockRender({
  block,
  ctx,
}: BlockRenderProps<'products'>) {
  const { heading, products, showPrice = true } = block.config;
  const animate = ctx.mode === 'public';
  // Un producto que ya no está en el catálogo simplemente no se muestra
  const items = products
    .map((item) => ({ ...item, product: ctx.products[item.productId] }))
    .filter((item) => item.product);

  if (items.length === 0) {
    if (ctx.mode === 'public') return null;
    return (
      <section className="mx-auto max-w-6xl px-5 py-10 page-md:px-8">
        <div className="rounded-[var(--pg-radius)] border border-dashed border-[var(--pg-border)] py-12 text-center text-sm text-[var(--pg-muted)]">
          Elige productos del catálogo
        </div>
      </section>
    );
  }

  const carousel = block.variant === 'carousel';
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 page-md:px-8 page-md:py-16">
      {heading && (
        <h2 className="mb-6 text-3xl font-bold tracking-tight text-[var(--pg-fg)] page-md:mb-8 page-md:text-4xl">
          <StyledText style={block.style} part="heading">
            {heading}
          </StyledText>
        </h2>
      )}
      <div
        className={cn(
          carousel
            ? '-mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 page-md:-mx-8 page-md:px-8'
            : 'grid grid-cols-2 gap-3 page-md:gap-5',
          // 4 en una fila; 3, 5 y 6 de a tres (no queda uno solo abajo)
          !carousel && items.length === 4 && 'page-md:grid-cols-4',
          !carousel &&
            items.length >= 3 &&
            items.length !== 4 &&
            'page-md:grid-cols-3'
        )}
      >
        {items.map(({ product, caption }, index) => {
          const price = showPrice ? formatPrice(product.price) : null;
          const clickable = ctx.mode === 'public' && !!ctx.onOpenProduct;
          const image = product.images[0];
          return (
            <Reveal
              key={`${product.id}-${index}`}
              enabled={animate}
              delay={Math.min(index, 5) * 0.06}
              className={cn(
                carousel && 'w-[72%] shrink-0 snap-start page-md:w-[31%]'
              )}
            >
              <button
                type="button"
                disabled={!clickable}
                onClick={() => ctx.onOpenProduct?.(product.id)}
                className="group flex h-full w-full flex-col overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] text-left transition-shadow hover:shadow-xl disabled:cursor-default"
              >
                <div className="aspect-square overflow-hidden bg-[var(--pg-bg)]">
                  <PageImg
                    image={
                      image
                        ? { id: 0, url: image, width: null, height: null }
                        : undefined
                    }
                    alt={product.name}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 p-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-[var(--pg-muted)]">
                    {product.brand}
                  </span>
                  <span className="font-semibold leading-snug text-[var(--pg-fg)]">
                    {caption || product.name}
                  </span>
                  {price && (
                    <span className="mt-auto pt-2 text-lg font-bold text-[var(--pg-primary)]">
                      {price}
                    </span>
                  )}
                </div>
              </button>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
