'use client';

import React, { useState } from 'react';

import { cn } from '@/lib/utils';
import {
  BlockType,
  PageBlock,
  PageImage,
  PageProductRef,
  PageSurveyRef,
  PageThemeKey,
} from '@/services/pages/types';
import { BlockRenderContext, BlockRenderProps } from '../blocks/blockContext';
import { DEFAULT_WHATSAPP } from '../blocks/catalog';
import { BLOCK_RENDERERS } from '../blocks/renderers';
import { blockBackgroundStyle, themeStyle } from '../themes';
import { PageProductModal } from './pageProductModal.component';
import {
  DEFAULT_CHROME,
  PageChrome,
  PublicFooter,
  PublicHeader,
} from './publicChrome.component';

export interface RenderableBlock {
  /** Clave estable para React (id del servidor o clave del borrador) */
  key: string;
  block: PageBlock;
}

interface PageRendererProps {
  theme: PageThemeKey;
  slug: string;
  blocks: RenderableBlock[];
  images: PageImage[] | Record<number, PageImage>;
  surveys: PageSurveyRef[] | Record<number, PageSurveyRef>;
  mode: BlockRenderContext['mode'];
  /** Acento propio de la página (`#RRGGBB`); vacío = el del tema */
  accentColor?: string;
  /** Productos del catálogo que usan los bloques (lista o mapa por id) */
  products?: PageProductRef[] | Record<number, PageProductRef>;
  /** Cabecera y pie; por defecto el logo de Moto Candela y el pie visibles */
  chrome?: PageChrome;
  /**
   * Sin el botón flotante: la vista previa lo dibuja aparte, sobre el marco,
   * porque dentro del contenido escalado no quedaría fijo abajo.
   */
  excludeFloating?: boolean;
  /** Vista previa: bloque resaltado y clic para seleccionarlo en el editor */
  selectedKey?: string | null;
  onSelectBlock?: (key: string) => void;
  /** Vista previa: clic en la cabecera o el pie los selecciona */
  onSelectChrome?: (part: 'header' | 'footer') => void;
  selectedChrome?: 'header' | 'footer' | null;
  className?: string;
}

const toMap = <T extends { id: number }>(items: T[] | Record<number, T>) =>
  Array.isArray(items)
    ? Object.fromEntries(items.map((item) => [item.id, item]))
    : items;

function RenderBlock<T extends BlockType>({
  block,
  ctx,
}: {
  block: Extract<PageBlock, { type: T }>;
  ctx: BlockRenderContext;
}) {
  const Component = BLOCK_RENDERERS[block.type as T] as React.ComponentType<
    BlockRenderProps<T>
  >;
  return <Component block={block} ctx={ctx} />;
}

/** Si la ficha de un producto abierta desde este bloque muestra el precio */
function blockShowsPrice(block: PageBlock): boolean {
  if (block.type === 'products') return block.config.showPrice ?? true;
  if (
    block.type === 'hero' ||
    block.type === 'media' ||
    block.type === 'gallery'
  ) {
    return !!block.config.showPrice;
  }
  return false;
}

/** Número para "Consultar por WhatsApp": el del botón flotante, si hay */
function pagePhone(blocks: RenderableBlock[]): string {
  for (const { block } of blocks) {
    if (
      block.type === 'cta' &&
      block.variant === 'floating' &&
      block.config.kind === 'whatsapp' &&
      block.config.phone
    ) {
      return block.config.phone;
    }
  }
  return DEFAULT_WHATSAPP;
}

/**
 * Página completa: tema, cabecera, bloques visibles y pie. La usan tanto
 * `/p/[slug]` como la vista previa del editor, así lo que se ve al editar es
 * exactamente lo que se publica.
 *
 * El contenedor declara `container-name: page`; los bloques usan las
 * variantes `page-md:`/`page-lg:` (container queries) en vez de `md:`, para
 * que la vista previa de celular se vea como un celular.
 */
export const isFloatingBlock = (block: PageBlock) =>
  block.type === 'cta' && block.variant === 'floating';

export function PageRenderer({
  theme,
  slug,
  blocks,
  images,
  surveys,
  mode,
  accentColor,
  products = [],
  chrome = DEFAULT_CHROME,
  excludeFloating = false,
  selectedKey,
  onSelectBlock,
  onSelectChrome,
  selectedChrome,
  className,
}: PageRendererProps) {
  const isPreview = mode === 'preview';
  const [openProduct, setOpenProduct] = useState<{
    id: number;
    showPrice: boolean;
  } | null>(null);
  const ctx: BlockRenderContext = {
    mode,
    pageSlug: slug,
    images: toMap(images),
    surveys: toMap(surveys),
    products: toMap(products),
  };
  // Cada bloque abre la ficha con su propia preferencia de precio
  const ctxFor = (block: PageBlock): BlockRenderContext =>
    isPreview
      ? ctx
      : {
          ...ctx,
          onOpenProduct: (id) =>
            setOpenProduct({ id, showPrice: blockShowsPrice(block) }),
        };
  const backgroundOf = (block: PageBlock) =>
    isFloatingBlock(block)
      ? undefined
      : blockBackgroundStyle(block.style?.background, theme, accentColor);
  const isFloating = ({ block }: RenderableBlock) => isFloatingBlock(block);
  // El botón flotante no ocupa lugar en el flujo: va siempre al final
  const shown = blocks.filter(({ block }) => block.isVisible);
  const visible = [
    ...shown.filter((item) => !isFloating(item)),
    ...(excludeFloating ? [] : shown.filter(isFloating)),
  ];
  const hasFullHeroFirst =
    visible[0]?.block.type === 'hero' && visible[0].block.variant === 'full';

  return (
    <div
      style={themeStyle(theme, accentColor)}
      className={cn(
        'relative min-h-full bg-[var(--pg-bg)] font-sans text-[var(--pg-fg)] antialiased [container-name:page] [container-type:inline-size]',
        className
      )}
    >
      <ChromeTarget
        preview={isPreview}
        onSelect={onSelectChrome && (() => onSelectChrome('header'))}
        selected={selectedChrome === 'header'}
        title="Cabecera: clic para editar"
      >
        <PublicHeader interactive={!isPreview} chrome={chrome} />
      </ChromeTarget>
      <main
        className={cn(
          // La píldora del logo flota sobre el primer bloque; la barra del
          // sitio ocupa su propio lugar y no necesita el espacio extra
          !hasFullHeroFirst &&
            chrome.showLogo &&
            chrome.headerStyle !== 'site' &&
            'pt-20'
        )}
      >
        {visible.map(({ key, block }) =>
          isPreview ? (
            <div
              key={key}
              data-block-key={key}
              onClickCapture={(event) => {
                // En la vista previa los enlaces no navegan: seleccionan
                if ((event.target as HTMLElement).closest('a')) {
                  event.preventDefault();
                }
                onSelectBlock?.(key);
              }}
              style={backgroundOf(block)}
              className={cn(
                'relative cursor-pointer outline-2 -outline-offset-2 transition-[outline-color]',
                selectedKey === key
                  ? 'outline outline-[var(--pg-primary)]'
                  : 'outline-transparent hover:outline hover:outline-[var(--pg-primary)]/40'
              )}
            >
              <RenderBlock block={block} ctx={ctxFor(block)} />
            </div>
          ) : backgroundOf(block) ? (
            <div key={key} style={backgroundOf(block)}>
              <RenderBlock block={block} ctx={ctxFor(block)} />
            </div>
          ) : (
            <RenderBlock key={key} block={block} ctx={ctxFor(block)} />
          )
        )}
      </main>
      {chrome.showFooter && (
        <ChromeTarget
          preview={isPreview}
          onSelect={onSelectChrome && (() => onSelectChrome('footer'))}
          selected={selectedChrome === 'footer'}
          title="Pie de página: clic para editar"
        >
          <PublicFooter
            theme={theme}
            interactive={!isPreview}
            chrome={chrome}
          />
        </ChromeTarget>
      )}
      {!isPreview && (
        <PageProductModal
          product={openProduct ? (ctx.products[openProduct.id] ?? null) : null}
          showPrice={openProduct?.showPrice ?? false}
          onClose={() => setOpenProduct(null)}
          theme={theme}
          accentColor={accentColor}
          pageSlug={slug}
          phone={pagePhone(blocks)}
        />
      )}
    </div>
  );
}

/** En la vista previa, la cabecera y el pie se seleccionan como un bloque */
function ChromeTarget({
  preview,
  onSelect,
  selected,
  title,
  children,
}: {
  preview: boolean;
  onSelect?: () => void;
  selected?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  if (!preview || !onSelect) return <>{children}</>;
  return (
    <div
      title={title}
      // `contents`: la cabecera es absoluta sobre el primer bloque y no debe
      // ganar una caja propia que empuje el contenido
      className={cn(
        'contents cursor-pointer [&>*]:cursor-pointer [&>*]:outline-2 [&>*]:-outline-offset-2 [&>*:hover]:outline [&>*:hover]:outline-[var(--pg-primary)]/40',
        selected && '[&>*]:outline [&>*]:outline-[var(--pg-primary)]'
      )}
      onClickCapture={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
    >
      {children}
    </div>
  );
}
