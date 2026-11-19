'use client';

import React from 'react';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';
import { BlockTone } from '@/services/pages/types';
import { BlockRenderProps } from '../blockContext';
import { ButtonRow, MediaImg } from '../media.component';
import { Reveal, StyledText } from '../shared.component';

/**
 * Texto sobre una foto: claro con degradado oscuro (por defecto) u oscuro con
 * degradado claro, para fotos muy claras. Lo usan la portada y "Texto e
 * imagen" encima de la foto.
 */
export function photoTone(tone: BlockTone | undefined) {
  const dark = tone === 'dark';
  return {
    onPhoto: (dark ? 'dark' : 'light') as 'light' | 'dark',
    text: dark ? 'text-neutral-900' : 'text-white',
    soft: dark ? 'text-neutral-800' : 'text-white/85',
    gradient: dark
      ? 'bg-gradient-to-t from-white/90 via-white/50 to-white/10'
      : 'bg-gradient-to-t from-black/85 via-black/35 to-black/10',
  };
}

/** Título que entra palabra por palabra */
function AnimatedTitle({ text, animate }: { text: string; animate: boolean }) {
  if (!animate) return <>{text}</>;
  return (
    <>
      {text.split(' ').map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline-block"
          initial={{ opacity: 0, y: '0.6em', filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{
            duration: 0.55,
            delay: 0.08 * index,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {word}
          {' '}
        </motion.span>
      ))}
    </>
  );
}

export function HeroBlockRender({ block, ctx }: BlockRenderProps<'hero'>) {
  const { title, subtitle, align = 'left', buttons, showPrice } = block.config;
  // Foto para celular: por debajo de 768 px. En público, `<picture>` (se
  // descarga una sola); en la vista previa, por container query.
  const mobileImage = block.config.mobileImageId
    ? ctx.images[block.config.mobileImageId]
    : undefined;
  const hasMobile = !!mobileImage;
  const animate = ctx.mode === 'public';
  const centered = align === 'center';

  if (block.variant === 'split') {
    return (
      <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 page-md:grid-cols-2 page-md:gap-14 page-md:px-8 page-md:py-20">
        <Reveal enabled={animate} className="page-md:order-2">
          <MediaImg
            slot={block.config}
            ctx={ctx}
            alt={title}
            priority
            showPrice={showPrice}
            mobileImage={mobileImage}
            className={cn(
              'overflow-hidden rounded-[var(--pg-radius)] shadow-2xl ring-1 ring-black/5',
              // En celular la foto propia es vertical
              hasMobile ? 'aspect-[4/5] page-md:aspect-[4/3]' : 'aspect-[4/3]'
            )}
          />
        </Reveal>
        <div
          className={cn(
            'flex flex-col gap-5',
            centered && 'items-center text-center'
          )}
        >
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight text-[var(--pg-fg)] page-md:text-5xl page-lg:text-6xl">
            <StyledText style={block.style} part="heading">
              <AnimatedTitle text={title} animate={animate} />
            </StyledText>
          </h1>
          {subtitle && (
            <Reveal enabled={animate} delay={0.25}>
              <p className="max-w-xl text-lg leading-relaxed text-[var(--pg-muted)]">
                <StyledText style={block.style} part="body">
                  {subtitle}
                </StyledText>
              </p>
            </Reveal>
          )}
          <Reveal enabled={animate} delay={0.4}>
            <ButtonRow buttons={buttons} align={centered ? 'center' : 'left'} />
          </Reveal>
        </div>
      </section>
    );
  }

  const tone = photoTone(block.style?.tone);
  return (
    <section className="relative isolate flex min-h-[560px] overflow-hidden page-md:min-h-[680px]">
      <div className="absolute inset-0 -z-10">
        {/* De fondo, la foto no abre la ficha: el texto va encima */}
        <MediaImg
          slot={block.config}
          ctx={{ ...ctx, onOpenProduct: undefined }}
          alt={title}
          priority
          mobileImage={mobileImage}
          className="h-full"
          imgClassName={animate ? 'animate-pg-zoom' : undefined}
        />
        <div className={cn('absolute inset-0', tone.gradient)} />
      </div>
      <div
        className={cn(
          'mx-auto flex w-full max-w-6xl flex-col justify-end gap-5 px-5 pb-14 pt-32 page-md:px-8 page-md:pb-20',
          tone.text,
          centered && 'items-center justify-center text-center'
        )}
      >
        <h1 className="max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-tight drop-shadow-sm page-md:text-6xl page-lg:text-7xl">
          <StyledText style={block.style} part="heading">
            <AnimatedTitle text={title} animate={animate} />
          </StyledText>
        </h1>
        {subtitle && (
          <Reveal enabled={animate} delay={0.3}>
            <p
              className={cn(
                'max-w-2xl text-lg leading-relaxed page-md:text-xl',
                tone.soft
              )}
            >
              <StyledText style={block.style} part="body">
                {subtitle}
              </StyledText>
            </p>
          </Reveal>
        )}
        <Reveal enabled={animate} delay={0.45}>
          <ButtonRow
            buttons={buttons}
            onPhoto={tone.onPhoto}
            align={centered ? 'center' : 'left'}
          />
        </Reveal>
      </div>
    </section>
  );
}
