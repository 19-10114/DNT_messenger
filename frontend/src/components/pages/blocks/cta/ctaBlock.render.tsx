'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';
import { whatsappUrl } from '../../pages.utils';
import { BlockRenderProps } from '../blockContext';
import { ButtonRow } from '../media.component';
import { Reveal, WhatsappIcon, linkTarget } from '../shared.component';

const WHATSAPP_GREEN = '#25D366';

export function CtaBlockRender({ block, ctx }: BlockRenderProps<'cta'>) {
  // Variante `floating`: un solo botón (kind/label/phone/message/url).
  // Variante `button`: `buttons` en fila y `sublabel`.
  const { kind, label = '', sublabel, phone, message, url } = block.config;
  const isWhatsapp = kind === 'whatsapp';
  const href = isWhatsapp ? whatsappUrl(phone, message) : url || '#';
  const target = isWhatsapp
    ? { target: '_blank', rel: 'noopener noreferrer' }
    : linkTarget(href);
  const Icon = isWhatsapp ? WhatsappIcon : ArrowUpRight;

  if (block.variant === 'floating') {
    // En la vista previa el editor lo dibuja sobre el marco, abajo
    const isPreview = ctx.mode === 'preview';
    return (
      <div
        className={cn(
          'pointer-events-none z-40 flex justify-end px-5',
          isPreview ? 'pb-5 pt-2' : 'fixed bottom-5 right-0'
        )}
      >
        <motion.a
          href={href}
          {...target}
          initial={isPreview ? false : { scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            delay: 0.8,
            type: 'spring',
            stiffness: 260,
            damping: 18,
          }}
          className={cn(
            'pointer-events-auto group flex items-center gap-3 rounded-full py-3 pl-3 pr-5 text-white shadow-2xl ring-4 ring-white/40 transition-transform hover:-translate-y-0.5',
            !isWhatsapp && 'bg-[var(--pg-primary)] text-[var(--pg-primary-fg)]'
          )}
          style={isWhatsapp ? { backgroundColor: WHATSAPP_GREEN } : undefined}
        >
          <span className="relative flex h-9 w-9 items-center justify-center">
            {isWhatsapp && !isPreview && (
              <span className="absolute inset-0 animate-ping rounded-full bg-white/40" />
            )}
            <Icon className="relative h-7 w-7" />
          </span>
          <span className="text-base font-semibold">{label}</span>
        </motion.a>
      </div>
    );
  }

  return (
    <section className="px-5 py-12 page-md:py-16">
      <Reveal
        enabled={ctx.mode === 'public'}
        className="flex flex-col items-center gap-3 text-center"
      >
        <ButtonRow
          buttons={block.config.buttons}
          align="center"
          size="lg"
          whatsappGreen
        />
        {sublabel && (
          <p className="text-sm text-[var(--pg-muted)]">{sublabel}</p>
        )}
      </Reveal>
    </section>
  );
}
