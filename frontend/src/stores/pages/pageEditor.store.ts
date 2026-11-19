import { create } from 'zustand';

import {
  BlockType,
  PageBlockPayload,
  PageDetail,
  PageImage,
  PageProductRef,
  PageSurveyRef,
  PageThemeKey,
  FooterStyle,
  HeaderStyle,
  SocialLink,
} from '@/services/pages/types';
import { BLOCK_CATALOG } from '@/components/pages/blocks/catalog';

/**
 * Borrador del editor de Páginas. No espeja la API: es lo que la persona
 * está editando y todavía no guardó. Se respalda en `localStorage` (ver
 * `pageEditorDraft`) para que cerrar la pestaña no pierda cambios.
 */

export interface EditorBlock {
  /** Clave estable en el navegador (arrastrar, seleccionar) */
  key: string;
  block: PageBlockPayload;
}

export interface EditorMeta {
  title: string;
  slug: string;
  theme: PageThemeKey;
  /** `#RRGGBB` o vacío = el acento del tema */
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  expiresAt: string | null;
  ogImageId: number | null;
  showLogo: boolean;
  headerStyle: HeaderStyle;
  logoImageId: number | null;
  showFooter: boolean;
  footerStyle: FooterStyle;
  footerText: string;
  socialLinks: SocialLink[] | null;
}

export interface PageEditorDraft {
  pageId: number;
  /** `updatedAt` del servidor sobre el que se hizo el borrador */
  baseUpdatedAt: string;
  meta: EditorMeta;
  blocks: EditorBlock[];
  images: Record<number, PageImage>;
  surveys: Record<number, PageSurveyRef>;
  /** Productos del catálogo usados en los bloques, por id */
  products: Record<number, PageProductRef>;
}

export type EditorPanel = 'blocks' | 'settings';
/** Cabecera o pie seleccionados en el editor; se editan como un bloque */
export type ChromePart = 'header' | 'footer';

interface State extends PageEditorDraft {
  /** Pestaña izquierda del editor; la vista previa también la cambia */
  panel: EditorPanel;
  selectedKey: string | null;
  selectedChrome: ChromePart | null;
  dirty: boolean;
  /** Errores del backend por clave de bloque, tras un guardado fallido */
  serverErrors: Record<string, string[]>;
}

interface Actions {
  load: (page: PageDetail) => void;
  /**
   * Tras guardar: toma del servidor lo que pudo cambiar (slug con sufijo,
   * URLs de imágenes, encuestas) sin perder las claves ni la selección.
   */
  markSaved: (page: PageDetail) => void;
  restore: (draft: PageEditorDraft) => void;
  setMeta: (patch: Partial<EditorMeta>) => void;
  addBlock: (type: BlockType, afterKey?: string | null) => string;
  updateBlock: (key: string, block: PageBlockPayload) => void;
  removeBlock: (key: string) => void;
  duplicateBlock: (key: string) => void;
  moveBlock: (fromKey: string, toKey: string) => void;
  select: (key: string | null) => void;
  /** Selecciona la cabecera o el pie: su panel reemplaza la lista */
  selectChrome: (part: ChromePart | null) => void;
  setPanel: (panel: EditorPanel) => void;
  addImage: (image: PageImage) => void;
  addSurvey: (survey: PageSurveyRef) => void;
  addProduct: (product: PageProductRef) => void;
  setServerErrors: (errors: Record<string, string[]>) => void;
}

let counter = 0;
const newKey = () => `b${Date.now().toString(36)}${(counter++).toString(36)}`;

const toMap = <T extends { id: number }>(items: T[]) =>
  Object.fromEntries(items.map((item) => [item.id, item])) as Record<number, T>;

const emptyMeta: EditorMeta = {
  title: '',
  slug: '',
  theme: 'candela',
  accentColor: '',
  seoTitle: '',
  seoDescription: '',
  expiresAt: null,
  ogImageId: null,
  showLogo: true,
  headerStyle: 'logo',
  logoImageId: null,
  showFooter: true,
  footerStyle: 'simple',
  footerText: '',
  socialLinks: null,
};

export const usePageEditorStore = create<State & { actions: Actions }>()(
  (set) => ({
    pageId: 0,
    baseUpdatedAt: '',
    meta: emptyMeta,
    blocks: [],
    images: {},
    surveys: {},
    products: {},
    panel: 'blocks',
    selectedKey: null,
    selectedChrome: null,
    dirty: false,
    serverErrors: {},
    actions: {
      load: (page) =>
        set({
          pageId: page.id,
          baseUpdatedAt: page.updatedAt,
          meta: {
            title: page.title,
            slug: page.slug,
            theme: page.theme,
            accentColor: page.accentColor ?? '',
            seoTitle: page.seoTitle,
            seoDescription: page.seoDescription,
            expiresAt: page.expiresAt,
            ogImageId: page.ogImageId,
            showLogo: page.showLogo,
            headerStyle: page.headerStyle ?? 'logo',
            logoImageId: page.logoImageId,
            showFooter: page.showFooter,
            footerStyle: page.footerStyle ?? 'simple',
            footerText: page.footerText,
            socialLinks: page.socialLinks,
          },
          blocks: page.blocks.map(({ id: _id, ...block }) => ({
            key: newKey(),
            block: block as PageBlockPayload,
          })),
          images: toMap(page.images),
          surveys: toMap(page.surveys),
          products: toMap(page.products ?? []),
          selectedKey: null,
          selectedChrome: null,
          dirty: false,
          serverErrors: {},
        }),
      markSaved: (page) =>
        set((state) => ({
          baseUpdatedAt: page.updatedAt,
          meta: { ...state.meta, slug: page.slug, title: page.title },
          blocks:
            page.blocks.length === state.blocks.length
              ? state.blocks.map((entry, index) => {
                  const { id: _id, ...block } = page.blocks[index];
                  return { key: entry.key, block: block as PageBlockPayload };
                })
              : state.blocks,
          images: toMap(page.images),
          surveys: { ...state.surveys, ...toMap(page.surveys) },
          products: { ...state.products, ...toMap(page.products ?? []) },
          dirty: false,
          serverErrors: {},
        })),
      restore: (draft) =>
        set({ ...draft, selectedKey: null, dirty: true, serverErrors: {} }),
      setMeta: (patch) =>
        set((state) => ({ meta: { ...state.meta, ...patch }, dirty: true })),
      addBlock: (type, afterKey) => {
        const key = newKey();
        set((state) => {
          const item = { key, block: BLOCK_CATALOG[type].create() };
          const index = afterKey
            ? state.blocks.findIndex((entry) => entry.key === afterKey) + 1
            : state.blocks.length;
          const blocks = [...state.blocks];
          blocks.splice(index, 0, item as EditorBlock);
          return { blocks, selectedKey: key, dirty: true };
        });
        return key;
      },
      updateBlock: (key, block) =>
        set((state) => {
          const { [key]: _cleared, ...serverErrors } = state.serverErrors;
          return {
            blocks: state.blocks.map((entry) =>
              entry.key === key ? { key, block } : entry
            ),
            serverErrors,
            dirty: true,
          };
        }),
      removeBlock: (key) =>
        set((state) => ({
          blocks: state.blocks.filter((entry) => entry.key !== key),
          selectedKey: state.selectedKey === key ? null : state.selectedKey,
          dirty: true,
        })),
      duplicateBlock: (key) =>
        set((state) => {
          const index = state.blocks.findIndex((entry) => entry.key === key);
          if (index < 0) return {};
          const copy: EditorBlock = {
            key: newKey(),
            block: structuredClone(state.blocks[index].block),
          };
          const blocks = [...state.blocks];
          blocks.splice(index + 1, 0, copy);
          return { blocks, selectedKey: copy.key, dirty: true };
        }),
      moveBlock: (fromKey, toKey) =>
        set((state) => {
          const from = state.blocks.findIndex((entry) => entry.key === fromKey);
          const to = state.blocks.findIndex((entry) => entry.key === toKey);
          if (from < 0 || to < 0 || from === to) return {};
          const blocks = [...state.blocks];
          const [moved] = blocks.splice(from, 1);
          blocks.splice(to, 0, moved);
          return { blocks, dirty: true };
        }),
      select: (key) =>
        set({ selectedKey: key, selectedChrome: null, panel: 'blocks' }),
      selectChrome: (part) =>
        set({ selectedChrome: part, selectedKey: null, panel: 'blocks' }),
      setPanel: (panel) => set({ panel }),
      addImage: (image) =>
        set((state) => ({ images: { ...state.images, [image.id]: image } })),
      addProduct: (product) =>
        set((state) => ({
          products: { ...state.products, [product.id]: product },
        })),
      addSurvey: (survey) =>
        set((state) => ({
          surveys: { ...state.surveys, [survey.id]: survey },
        })),
      setServerErrors: (serverErrors) => set({ serverErrors }),
    },
  })
);

export const usePageEditorMeta = () =>
  usePageEditorStore((state) => state.meta);
export const usePageEditorBlocks = () =>
  usePageEditorStore((state) => state.blocks);
export const usePageEditorImages = () =>
  usePageEditorStore((state) => state.images);
export const usePageEditorProducts = () =>
  usePageEditorStore((state) => state.products);
export const usePageEditorSurveys = () =>
  usePageEditorStore((state) => state.surveys);
export const usePageEditorSelectedKey = () =>
  usePageEditorStore((state) => state.selectedKey);
export const usePageEditorDirty = () =>
  usePageEditorStore((state) => state.dirty);
export const usePageEditorServerErrors = () =>
  usePageEditorStore((state) => state.serverErrors);
export const usePageEditorSelectedChrome = () =>
  usePageEditorStore((state) => state.selectedChrome);
export const usePageEditorPanel = () =>
  usePageEditorStore((state) => state.panel);
export const usePageEditorPageId = () =>
  usePageEditorStore((state) => state.pageId);
export const usePageEditorActions = () =>
  usePageEditorStore((state) => state.actions);

/* ------------------------- Respaldo en localStorage ------------------------ */

const draftKey = (pageId: number) => `page-editor:${pageId}`;

export const pageEditorDraft = {
  read(pageId: number): PageEditorDraft | null {
    try {
      const raw = window.localStorage.getItem(draftKey(pageId));
      return raw ? (JSON.parse(raw) as PageEditorDraft) : null;
    } catch {
      return null;
    }
  },
  write(draft: PageEditorDraft) {
    try {
      window.localStorage.setItem(
        draftKey(draft.pageId),
        JSON.stringify(draft)
      );
    } catch {
      // Sin espacio o almacenamiento bloqueado: se pierde solo el respaldo
    }
  },
  clear(pageId: number) {
    try {
      window.localStorage.removeItem(draftKey(pageId));
    } catch {
      // nada que hacer
    }
  },
};
