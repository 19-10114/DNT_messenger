'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { BlockStyle } from '@/services/pages/types';
import { paragraphs } from '../../pages.utils';
import { BlockRenderProps } from '../blockContext';
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

export function TextBlockRender({ block, ctx }: BlockRenderProps<'text'>) {
  const { heading, body } = block.config;
  const animate = ctx.mode === 'public';

  // Texto simple con fondo propio: una franja, centrada y con letra grande
  // (antes era la variante `highlight`; el fondo lo pone el contenedor)
  const background = block.style?.background;
  if (block.variant === 'plain' && background && background !== 'theme') {
    return (
      <section className="text-[var(--pg-fg)]">
        <Reveal
          enabled={animate}
          className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-5 py-16 text-center page-md:py-24"
        >
          {heading && (
            <h2 className="text-3xl font-extrabold tracking-tight page-md:text-5xl">
              <StyledText style={block.style} part="heading">
                {heading}
              </StyledText>
            </h2>
          )}
          <Body
            style={block.style}
            text={body}
            className="text-lg leading-relaxed opacity-90 page-md:text-xl"
          />
        </Reveal>
      </section>
    );
  }

  if (block.variant === 'card') {
    return (
      <section className="px-5 py-8 page-md:px-8 page-md:py-12">
        <Reveal
          enabled={animate}
          className="mx-auto max-w-3xl rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] p-7 shadow-sm page-md:p-10"
        >
          {heading && (
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-[var(--pg-fg)] page-md:text-3xl">
              <StyledText style={block.style} part="heading">
                {heading}
              </StyledText>
            </h2>
          )}
          <Body
            style={block.style}
            text={body}
            className="text-base leading-relaxed text-[var(--pg-muted)] page-md:text-lg"
          />
        </Reveal>
      </section>
    );
  }

  return (
    <section className="px-5 py-10 page-md:px-8 page-md:py-16">
      <Reveal enabled={animate} className="mx-auto max-w-2xl">
        {heading && (
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-[var(--pg-fg)] page-md:text-4xl">
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
      </Reveal>
    </section>
  );
}
