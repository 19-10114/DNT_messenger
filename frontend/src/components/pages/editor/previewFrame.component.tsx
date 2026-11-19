'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  usePageEditorActions,
  usePageEditorBlocks,
  usePageEditorImages,
  usePageEditorMeta,
  usePageEditorSelectedChrome,
  usePageEditorProducts,
  usePageEditorSelectedKey,
  usePageEditorSurveys,
} from '@/stores/pages/pageEditor.store';
import {
  PageRenderer,
  isFloatingBlock,
} from '../public/pageRenderer.component';
import { CtaBlockRender } from '../blocks/cta/ctaBlock.render';
import { themeStyle } from '../themes';

type Device = 'mobile' | 'desktop';
const DEVICE_WIDTH: Record<Device, number> = { mobile: 390, desktop: 1280 };

/**
 * Vista previa en vivo del borrador, con el mismo `PageRenderer` que la
 * página pública. El escritorio se dibuja a 1280 px y se escala para caber;
 * los bloques responden al ancho del marco (container queries), no al de la
 * ventana.
 */
export function PreviewFrame() {
  const [device, setDevice] = useState<Device>('desktop');
  const meta = usePageEditorMeta();
  const blocks = usePageEditorBlocks();
  const images = usePageEditorImages();
  const surveys = usePageEditorSurveys();
  const products = usePageEditorProducts();
  const selectedKey = usePageEditorSelectedKey();
  const { select, selectChrome } = usePageEditorActions();
  const selectedChrome = usePageEditorSelectedChrome();
  const outer = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    const element = outer.current;
    const inner = content.current;
    if (!element || !inner) return;
    const observer = new ResizeObserver(() => {
      setAvailable(element.clientWidth);
      // offsetHeight ignora el `transform`: es el alto sin escalar
      setContentHeight(inner.offsetHeight);
    });
    observer.observe(element);
    observer.observe(inner);
    return () => observer.disconnect();
  }, []);

  // Al elegir un bloque en la lista, la vista previa lo muestra
  useEffect(() => {
    if (!selectedKey || !scroller.current) return;
    const target = scroller.current.querySelector<HTMLElement>(
      `[data-block-key="${selectedKey}"]`
    );
    target?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedKey]);

  const floating = blocks.find(
    ({ block }) => block.isVisible && isFloatingBlock(block)
  );
  const width = DEVICE_WIDTH[device];
  const scale = available ? Math.min(1, (available - 32) / width) : 1;

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-center gap-1 rounded-full bg-white p-1 shadow-sm ring-1 ring-gray-200 self-center">
        {(['mobile', 'desktop'] as Device[]).map((option) => {
          const Icon = option === 'mobile' ? Smartphone : Monitor;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setDevice(option)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors',
                device === option
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              <Icon className="h-4 w-4" />
              {option === 'mobile' ? 'Celular' : 'Escritorio'}
            </button>
          );
        })}
      </div>
      <div ref={outer} className="flex min-h-0 flex-1 justify-center">
        <div
          className={cn(
            'relative overflow-hidden bg-white shadow-2xl ring-1 ring-black/10',
            device === 'mobile'
              ? 'rounded-[2.5rem] border-[10px] border-gray-900'
              : 'rounded-xl'
          )}
          style={{
            width: width * scale + (device === 'mobile' ? 20 : 0),
            height: '100%',
          }}
        >
          <div
            ref={scroller}
            className="h-full overflow-y-auto overflow-x-hidden"
            style={{ width: width * scale }}
          >
            {/* El transform no cambia el alto que ocupa: esta caja lo
                ajusta. `overflow: clip` y no `hidden`, que rompería el
                botón flotante (sticky) dentro de la vista previa. */}
            <div
              style={{
                height: contentHeight ? contentHeight * scale : undefined,
                overflow: 'clip',
              }}
            >
              <div
                ref={content}
                style={{
                  width,
                  transform: `scale(${scale})`,
                  transformOrigin: 'top left',
                }}
              >
                <PageRenderer
                  mode="preview"
                  theme={meta.theme}
                  accentColor={meta.accentColor}
                  slug={meta.slug}
                  products={products}
                  chrome={{
                    showLogo: meta.showLogo,
                    headerStyle: meta.headerStyle,
                    logo: meta.logoImageId ? images[meta.logoImageId] : null,
                    showFooter: meta.showFooter,
                    footerStyle: meta.footerStyle,
                    footerText: meta.footerText,
                    socialLinks: meta.socialLinks,
                  }}
                  blocks={blocks.map(({ key, block }) => ({ key, block }))}
                  images={images}
                  surveys={surveys}
                  excludeFloating
                  selectedKey={selectedKey}
                  onSelectBlock={select}
                  onSelectChrome={selectChrome}
                  selectedChrome={selectedChrome}
                />
              </div>
            </div>
          </div>
          {floating?.block.type === 'cta' && (
            <div
              style={{
                ...themeStyle(meta.theme, meta.accentColor),
                zoom: scale,
              }}
              className={cn(
                'absolute bottom-0 right-0 cursor-pointer rounded-full',
                selectedKey === floating.key &&
                  'ring-2 ring-[#ff8635] ring-offset-2'
              )}
              onClickCapture={(event) => {
                event.preventDefault();
                select(floating.key);
              }}
            >
              <CtaBlockRender
                block={floating.block}
                ctx={{
                  mode: 'preview',
                  pageSlug: meta.slug,
                  images,
                  surveys,
                  products,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
