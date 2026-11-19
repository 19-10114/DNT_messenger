import type { ComponentType } from 'react';

import { BlockType } from '@/services/pages/types';
import { BlockRenderProps } from './blockContext';
import { CtaBlockRender } from './cta/ctaBlock.render';
import { GalleryBlockRender } from './gallery/galleryBlock.render';
import { HeroBlockRender } from './hero/heroBlock.render';
import { MediaBlockRender } from './media/mediaBlock.render';
import { ProductsBlockRender } from './products/productsBlock.render';
import { SurveyBlockRender } from './survey/surveyBlock.render';
import { TextBlockRender } from './text/textBlock.render';

/**
 * Render de cada tipo de bloque. Es el mismo en la página pública y en la
 * vista previa del editor. Agregar un tipo = una carpeta + una línea aquí,
 * en `catalog.ts` y en `editor/blockEditors.ts`.
 */
export const BLOCK_RENDERERS: {
  [K in BlockType]: ComponentType<BlockRenderProps<K>>;
} = {
  hero: HeroBlockRender,
  text: TextBlockRender,
  media: MediaBlockRender,
  gallery: GalleryBlockRender,
  products: ProductsBlockRender,
  cta: CtaBlockRender,
  survey: SurveyBlockRender,
};
