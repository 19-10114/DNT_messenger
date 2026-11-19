'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { BlockRenderProps } from '../blockContext';
import { MediaImg, resolveMedia } from '../media.component';
import { PageImg, Reveal, StyledText } from '../shared.component';
import { BlockStyle } from '@/services/pages/types';

const itemKey = (
  item: { imageId?: number | null; productId?: number | null },
  index: number
) => `${item.imageId ?? `p${item.productId}`}-${index}`;

const AUTOPLAY_MS = 4500;

function Heading({ text, style }: { text?: string; style?: BlockStyle }) {
  if (!text) return null;
  return (
    <h2 className="mb-6 text-3xl font-bold tracking-tight text-[var(--pg-fg)] page-md:mb-8 page-md:text-4xl">
      <StyledText style={style} part="heading">
        {text}
      </StyledText>
    </h2>
  );
}

function Carousel({ block, ctx }: BlockRenderProps<'gallery'>) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selected, setSelected] = useState(0);
  const items = block.config.images;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    onSelect();
    if (ctx.mode !== 'public' || items.length < 2) {
      return () => {
        emblaApi.off('select', onSelect);
      };
    }
    const timer = window.setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    // Si la persona toma el control, el carrusel deja de avanzar solo
    const stop = () => window.clearInterval(timer);
    emblaApi.on('pointerDown', stop);
    return () => {
      window.clearInterval(timer);
      emblaApi.off('select', onSelect);
      emblaApi.off('pointerDown', stop);
    };
  }, [emblaApi, ctx.mode, items.length]);

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-[var(--pg-radius)]"
        ref={emblaRef}
      >
        <div className="flex">
          {items.map((item, index) => (
            <figure
              key={itemKey(item, index)}
              className="relative min-w-0 flex-[0_0_100%]"
            >
              <MediaImg
                slot={item}
                ctx={ctx}
                alt={item.caption || ''}
                showPrice={block.config.showPrice}
                className="aspect-[16/10] page-md:aspect-[16/8]"
              />
              {item.caption && (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 pb-5 pt-12 text-base font-medium text-white">
                  {item.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      </div>
      {items.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Anterior"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur page-md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow-lg backdrop-blur page-md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="mt-4 flex justify-center gap-2">
            {items.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`Imagen ${index + 1}`}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                  'h-2 rounded-full transition-all duration-300',
                  index === selected
                    ? 'w-7 bg-[var(--pg-primary)]'
                    : 'w-2 bg-[var(--pg-border)]'
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Grid({ block, ctx }: BlockRenderProps<'gallery'>) {
  const [open, setOpen] = useState<number | null>(null);
  const items = block.config.images;
  const canZoom = ctx.mode === 'public';

  const move = useCallback(
    (delta: number) =>
      setOpen((current) =>
        current === null
          ? null
          : (current + delta + items.length) % items.length
      ),
    [items.length]
  );

  useEffect(() => {
    if (open === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(null);
      if (event.key === 'ArrowRight') move(1);
      if (event.key === 'ArrowLeft') move(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, move]);

  const current = open === null ? null : items[open];

  return (
    <>
      <div
        className={cn(
          'grid grid-cols-2 gap-3 page-md:gap-4',
          items.length >= 3 && 'page-md:grid-cols-3'
        )}
      >
        {items.map((item, index) => (
          <Reveal
            key={itemKey(item, index)}
            enabled={ctx.mode === 'public'}
            delay={Math.min(index, 5) * 0.06}
          >
            {item.productId ? (
              // Un producto abre su ficha, no la vista ampliada
              <div>
                <MediaImg
                  slot={item}
                  ctx={ctx}
                  alt={item.caption || ''}
                  showPrice={block.config.showPrice}
                  className="aspect-[4/3] overflow-hidden rounded-[var(--pg-radius)] bg-[var(--pg-surface)]"
                />
                <p className="mt-2 text-sm text-[var(--pg-muted)]">
                  {item.caption || ctx.products[item.productId]?.name}
                </p>
              </div>
            ) : (
              <button
                type="button"
                disabled={!canZoom}
                onClick={() => setOpen(index)}
                className="group block w-full text-left"
              >
                <div className="aspect-[4/3] overflow-hidden rounded-[var(--pg-radius)] bg-[var(--pg-surface)]">
                  <PageImg
                    image={resolveMedia(item, ctx).image}
                    alt={item.caption || ''}
                    className="transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                {item.caption && (
                  <p className="mt-2 text-sm text-[var(--pg-muted)]">
                    {item.caption}
                  </p>
                )}
              </button>
            )}
          </Reveal>
        ))}
      </div>
      <AnimatePresence>
        {current && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(null)}
            role="dialog"
            aria-modal
          >
            <button
              type="button"
              aria-label="Cerrar"
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.figure
              key={open}
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="max-h-full max-w-5xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="max-h-[80vh] overflow-hidden rounded-xl">
                <PageImg
                  image={resolveMedia(current, ctx).image}
                  alt={current.caption || ''}
                  className="max-h-[80vh] object-contain"
                />
              </div>
              {current.caption && (
                <figcaption className="mt-3 text-center text-white/85">
                  {current.caption}
                </figcaption>
              )}
            </motion.figure>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Anterior"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(-1);
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  aria-label="Siguiente"
                  onClick={(event) => {
                    event.stopPropagation();
                    move(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Galería aún sin fotos: solo se ve en el editor, como guía */
function EmptyGallery() {
  return (
    <div className="grid grid-cols-2 gap-3 page-md:grid-cols-3 page-md:gap-4">
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className="flex aspect-[4/3] items-center justify-center rounded-[var(--pg-radius)] text-sm font-medium text-white/80"
          style={{ background: 'var(--pg-placeholder)' }}
        >
          {index === 0 ? 'Agrega fotos' : ''}
        </div>
      ))}
    </div>
  );
}

export function GalleryBlockRender(props: BlockRenderProps<'gallery'>) {
  const empty = props.block.config.images.length === 0;
  if (empty && props.ctx.mode === 'public') return null;
  return (
    <section className="mx-auto max-w-6xl px-5 py-10 page-md:px-8 page-md:py-16">
      <Heading text={props.block.config.heading} style={props.block.style} />
      {empty ? (
        <EmptyGallery />
      ) : props.block.variant === 'carousel' ? (
        <Carousel {...props} />
      ) : (
        <Grid {...props} />
      )}
    </section>
  );
}
