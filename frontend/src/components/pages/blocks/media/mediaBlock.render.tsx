'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { BlockStyle } from '@/services/pages/types';
import { paragraphs } from '../../pages.utils';
import { BlockRenderProps } from '../blockContext';
import { photoTone } from '../hero/heroBlock.render';
import { ButtonRow, MediaImg } from '../media.component';
import { Reveal, StyledText, textStyle } from '../shared.component';

function Body({
  text,
  className,
  style,
}: {
  text: string;
  className?: string;
  style?: BlockStyle;
}) {
  const css = textStyle(style, 'body');
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {paragraphs(text).map((paragraph, index) => (
        <p key={index} className="whitespace-pre-line" style={css}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}

/**
 * "Texto e imagen": una foto (o un producto, que abre su ficha) al lado del
 * texto, o el texto encima de la foto. Para una ficha larga se encadenan
 * varios alternando el lado.
 */
export function MediaBlockRender({ block, ctx }: BlockRenderProps<'media'>) {
  const { heading, body, buttons, showPrice } = block.config;
  const animate = ctx.mode === 'public';

  if (block.variant === 'overlay') {
    const tone = photoTone(block.style?.tone);
    return (
      <section className="relative isolate flex min-h-[460px] overflow-hidden page-md:min-h-[540px]">
        <div className="absolute inset-0 -z-10">
          <MediaImg
            slot={block.config}
            ctx={{ ...ctx, onOpenProduct: undefined }}
            alt={heading || ''}
            className="h-full"
          />
          <div className={cn('absolute inset-0', tone.gradient)} />
        </div>
        <Reveal
          enabled={animate}
          className={cn(
            'mx-auto flex w-full max-w-6xl flex-col justify-end gap-4 px-5 pb-12 pt-24 page-md:px-8 page-md:pb-16',
            tone.text
          )}
        >
          {heading && (
            <h2 className="max-w-3xl text-3xl font-extrabold tracking-tight page-md:text-5xl">
              <StyledText style={block.style} part="heading">
                {heading}
              </StyledText>
            </h2>
          )}
          <Body
            style={block.style}
            text={body}
            className={cn('max-w-2xl text-lg leading-relaxed', tone.soft)}
          />
          <ButtonRow
            buttons={buttons}
            onPhoto={tone.onPhoto}
            className="mt-2"
          />
        </Reveal>
      </section>
    );
  }

  const imageRight = block.variant === 'image-right';
  return (
    <section className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-10 page-md:grid-cols-2 page-md:gap-14 page-md:px-8 page-md:py-16">
      <Reveal enabled={animate} className={cn(imageRight && 'page-md:order-2')}>
        <MediaImg
          slot={block.config}
          ctx={ctx}
          alt={heading || ''}
          showPrice={showPrice}
          className="aspect-[4/3] overflow-hidden rounded-[var(--pg-radius)] shadow-xl ring-1 ring-black/5"
        />
      </Reveal>
      <Reveal enabled={animate} delay={0.1} className="flex flex-col gap-4">
        {heading && (
          <h2 className="text-3xl font-bold tracking-tight text-[var(--pg-fg)] page-md:text-4xl">
            <StyledText style={block.style} part="heading">
              {heading}
            </StyledText>
          </h2>
        )}
        <Body
          style={block.style}
          text={body}
          className="text-lg leading-relaxed text-[var(--pg-muted)]"
        />
        <ButtonRow buttons={buttons} className="mt-2" />
      </Reveal>
    </section>
  );
}
