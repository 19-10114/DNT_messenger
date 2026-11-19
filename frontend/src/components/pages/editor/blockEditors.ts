import type { ComponentType } from 'react';

import { BlockType } from '@/services/pages/types';
import { CtaBlockEditor } from '../blocks/cta/ctaBlock.editor';
import { BlockEditorProps } from '../blocks/editorProps';
import { GalleryBlockEditor } from '../blocks/gallery/galleryBlock.editor';
import { HeroBlockEditor } from '../blocks/hero/heroBlock.editor';
import { MediaBlockEditor } from '../blocks/media/mediaBlock.editor';
import { ProductsBlockEditor } from '../blocks/products/productsBlock.editor';
import { SurveyBlockEditor } from '../blocks/survey/surveyBlock.editor';
import { TextBlockEditor } from '../blocks/text/textBlock.editor';

/** Formulario de cada tipo de bloque (solo se carga en el editor) */
export const BLOCK_EDITORS: {
  [K in BlockType]: ComponentType<BlockEditorProps<K>>;
} = {
  hero: HeroBlockEditor,
  text: TextBlockEditor,
  media: MediaBlockEditor,
  gallery: GalleryBlockEditor,
  products: ProductsBlockEditor,
  cta: CtaBlockEditor,
  survey: SurveyBlockEditor,
};
