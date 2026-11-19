import {
  BlockType,
  PageBlock,
  PageImage,
  PageProductRef,
  PageSurveyRef,
} from '@/services/pages/types';

/**
 * Lo que un bloque necesita para renderizarse, igual en la página pública y
 * en la vista previa del editor.
 */
export interface BlockRenderContext {
  /** `preview`: sin animaciones de scroll ni envíos reales */
  mode: 'public' | 'preview';
  pageSlug: string;
  images: Record<number, PageImage>;
  surveys: Record<number, PageSurveyRef>;
  /** Productos del catálogo resueltos por el backend, por id */
  products: Record<number, PageProductRef>;
  /** Solo en público: abre la ficha de un producto (modal) */
  onOpenProduct?: (productId: number) => void;
}

export type BlockOf<T extends BlockType> = Extract<PageBlock, { type: T }>;

export interface BlockRenderProps<T extends BlockType> {
  block: BlockOf<T>;
  ctx: BlockRenderContext;
}
