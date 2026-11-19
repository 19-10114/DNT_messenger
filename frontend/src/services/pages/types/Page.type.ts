/**
 * Tipos de la API de Páginas (`/api/pages/`). La API viaja en camelCase,
 * también dentro de `config`: el backend convierte las claves en ambos
 * sentidos, así que estos tipos no necesitan mapeo.
 */

export interface PagesEnvelope<T> {
  message: string;
  data: T;
  errors?: unknown;
}

export type PageStatus = 'draft' | 'published' | 'archived';

/** Qué muestra la cabecera de una página cuando está visible */
export type HeaderStyle = 'logo' | 'site';

/** Qué pie usa una página: el propio (`simple`) o el de la web (`site`) */
export type FooterStyle = 'simple' | 'site';

/** Temas disponibles; las paletas viven en `components/pages/themes.ts` */
export type PageThemeKey = 'candela' | 'dark' | 'light';

export type BlockType =
  | 'hero'
  | 'text'
  | 'media'
  | 'gallery'
  | 'products'
  | 'cta'
  | 'survey';

/** Un botón. Hasta 3 por bloque (portada, texto e imagen, bloque Botón). */
export interface PageButton {
  label: string;
  kind: 'whatsapp' | 'link';
  /** Solo `whatsapp`: número con código de país, p. ej. `+584141234567` */
  phone?: string;
  /** Solo `whatsapp`: mensaje que se precarga en el chat */
  message?: string;
  /** Solo `link` */
  url?: string;
  style?: 'primary' | 'outline';
}

/**
 * Hueco de imagen: una foto subida a la página **o** un producto del
 * catálogo (su foto vigente; al tocarlo se abre su ficha). Nunca ambos.
 */
export interface MediaSlot {
  imageId?: number | null;
  productId?: number | null;
}

export interface HeroBlockConfig extends MediaSlot {
  /** Foto opcional para celular (vertical); sin ella se recorta la principal */
  mobileImageId?: number | null;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
  buttons?: PageButton[];
  showPrice?: boolean;
}

export interface TextBlockConfig {
  heading?: string;
  body: string;
}

/** "Texto e imagen": una foto o producto junto a (o bajo) un texto */
export interface MediaBlockConfig extends MediaSlot {
  heading?: string;
  body: string;
  buttons?: PageButton[];
  showPrice?: boolean;
}

export interface GalleryBlockConfig {
  heading?: string;
  showPrice?: boolean;
  images: (MediaSlot & { caption?: string })[];
}

export interface ProductsBlockConfig {
  heading?: string;
  showPrice?: boolean;
  products: { productId: number; caption?: string }[];
}

/**
 * Variante `button`: `buttons` (1 a 3) y `sublabel`. Variante `floating`:
 * un solo botón redondo con `kind`, `label`, `phone`/`message` o `url`.
 */
export interface CtaBlockConfig {
  buttons?: PageButton[];
  sublabel?: string;
  kind?: 'whatsapp' | 'link';
  label?: string;
  phone?: string;
  message?: string;
  url?: string;
}

export interface SurveyBlockConfig {
  surveyId: number;
  thanks: string;
  title?: string;
  intro?: string;
  buttonLabel?: string;
}

export interface BlockConfigByType {
  hero: HeroBlockConfig;
  text: TextBlockConfig;
  media: MediaBlockConfig;
  gallery: GalleryBlockConfig;
  products: ProductsBlockConfig;
  cta: CtaBlockConfig;
  survey: SurveyBlockConfig;
}

export interface BlockVariantByType {
  hero: 'full' | 'split';
  text: 'plain' | 'card';
  media: 'image-left' | 'image-right' | 'overlay';
  gallery: 'grid' | 'carousel';
  products: 'grid' | 'carousel';
  cta: 'button' | 'floating';
  survey: 'flow' | 'inline';
}

/** Fondo de un bloque: lista cerrada, el texto siempre se lee */
export type BlockBackground = 'theme' | 'surface' | 'accent' | 'dark' | 'light';
/** Tono del texto sobre una foto (portada y texto e imagen) */
export type BlockTone = 'auto' | 'light' | 'dark';

/** Tamaño de título o texto, relativo al tamaño propio del bloque */
export type TextSize = 'sm' | 'md' | 'lg' | 'xl';

export interface BlockStyle {
  background?: BlockBackground;
  tone?: BlockTone;
  /** Color libre (`#RRGGBB`); sin él, el del tema */
  headingColor?: string;
  headingSize?: TextSize;
  bodyColor?: string;
  bodySize?: TextSize;
}

interface BaseBlock<T extends BlockType> {
  /** Solo en bloques que ya vienen del servidor */
  id?: number;
  type: T;
  variant: BlockVariantByType[T];
  isVisible: boolean;
  config: BlockConfigByType[T];
  style?: BlockStyle;
}

/** Bloque, como unión discriminada por `type` para estrechar `config` */
export type PageBlock = { [K in BlockType]: BaseBlock<K> }[BlockType];

export interface PageImage {
  id: number;
  /** URL firmada del bucket: vence a los 5 minutos, nunca se guarda */
  url: string;
  width: number | null;
  height: number | null;
}

/** Producto del catálogo tal como lo ve un visitante (sin costo) */
export interface PageProductRef {
  id: number;
  sku: string;
  name: string;
  brand: string;
  model: string;
  /** 1 = moto, 2 = repuesto */
  category: number;
  description: string;
  /** `null` si el producto no tiene precio de venta */
  price: number | null;
  /** Fotos visibles, la destacada primero (URLs firmadas) */
  images: string[];
}

/** Resultado del buscador de productos del editor */
export interface PageProductSearchItem extends PageProductRef {
  imageUrl: string | null;
}

/** Encuesta a la que apunta un bloque `survey` */
export interface PageSurveyRef {
  id: number;
  slug: string;
  title: string;
  /** `false` si dejó de estar publicada o pasó a requerir sesión */
  isPublic: boolean;
}

export interface PageListItem {
  id: number;
  title: string;
  slug: string;
  status: PageStatus;
  theme: PageThemeKey;
  templateKey: string;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  blockCount: number;
  thumbnailUrl: string | null;
  /** Publicada y sin vencer: responde en `/p/<slug>` */
  isLive: boolean;
  updatedByName: string | null;
}

export type SocialKind =
  | 'instagram'
  | 'facebook'
  | 'whatsapp'
  | 'tiktok'
  | 'youtube'
  | 'website';

export interface SocialLink {
  kind: SocialKind;
  url: string;
}

export interface PageDetail extends PageListItem {
  /** Acento propio de la página (`#RRGGBB`); vacío = el del tema */
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  ogImageId: number | null;
  /** Cabecera: mostrar el logo y, si se eligió, cuál (si no, el de Moto Candela) */
  showLogo: boolean;
  /** `logo` = el logo en una píldora; `site` = la barra de navegación de Moto Candela */
  headerStyle: HeaderStyle;
  logoImageId: number | null;
  showFooter: boolean;
  footerStyle: FooterStyle;
  /** Vacío = "© <año> Moto Candela" */
  footerText: string;
  /** `null` = las redes de Moto Candela; `[]` = ninguna */
  socialLinks: SocialLink[] | null;
  blocks: PageBlock[];
  images: PageImage[];
  surveys: PageSurveyRef[];
  /** Productos del catálogo que muestran los bloques, ya resueltos */
  products: PageProductRef[];
}

/** `GET /pages/public/<slug>`: solo lo visible */
export interface PublicPage {
  id: number;
  title: string;
  slug: string;
  theme: PageThemeKey;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: PageImage | null;
  showLogo: boolean;
  /** `logo` = el logo en una píldora; `site` = la barra de navegación de Moto Candela */
  headerStyle: HeaderStyle;
  /** `null` = logo de Moto Candela (o nada, si `showLogo` es falso) */
  logoImage: PageImage | null;
  showFooter: boolean;
  footerStyle: FooterStyle;
  footerText: string;
  socialLinks: SocialLink[] | null;
  blocks: PageBlock[];
  images: PageImage[];
  surveys: PageSurveyRef[];
  /** Productos del catálogo que muestran los bloques, ya resueltos */
  products: PageProductRef[];
}

/* -------------------------------- Payloads -------------------------------- */

export type PageListStatusFilter = PageStatus | 'live' | 'all';

export interface GetPagesQueryParams {
  page?: number;
  pageSize?: number;
  status?: PageListStatusFilter;
  search?: string;
}

/**
 * Bloque tal como se envía: sin `id`. Distributivo, para que siga siendo una
 * unión discriminada por `type` (`Omit` sobre la unión la aplanaría).
 */
export type PageBlockPayload = {
  [K in BlockType]: Omit<BaseBlock<K>, 'id'>;
}[BlockType];

export interface CreatePagePayload {
  title: string;
  slug?: string;
  theme: PageThemeKey;
  templateKey?: string;
  blocks?: PageBlockPayload[];
}

export interface UpdatePageMetaPayload {
  title?: string;
  slug?: string;
  theme?: PageThemeKey;
  accentColor?: string;
  seoTitle?: string;
  seoDescription?: string;
  expiresAt?: string | null;
  ogImageId?: number | null;
  showLogo?: boolean;
  headerStyle?: HeaderStyle;
  logoImageId?: number | null;
  showFooter?: boolean;
  footerStyle?: FooterStyle;
  footerText?: string;
  socialLinks?: SocialLink[] | null;
}

/**
 * Errores de validación del backend al guardar bloques: por índice del
 * bloque en la lista enviada.
 */
export interface PageBlockErrors {
  blocks?: Record<string, string[]>;
}
