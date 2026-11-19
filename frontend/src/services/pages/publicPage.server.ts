import { PagesEnvelope, PublicPage } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

/**
 * Página pública para `/p/[slug]`, pedida desde el servidor de Next (sin
 * token, sin axios). `null` cuando no existe, no está publicada o venció.
 *
 * `no-store`: las URLs de las imágenes son firmadas y vencen a los 5
 * minutos, así que un HTML cacheado terminaría con imágenes rotas. Dentro de
 * un mismo render, Next deduplica la llamada entre `generateMetadata`, la
 * página y la imagen para compartir.
 */
export async function getPublicPage(slug: string): Promise<PublicPage | null> {
  try {
    const response = await fetch(
      `${API_URL}/pages/public/${encodeURIComponent(slug)}`,
      { cache: 'no-store' }
    );
    if (!response.ok) return null;
    const body = (await response.json()) as PagesEnvelope<PublicPage>;
    return body.data;
  } catch {
    return null;
  }
}
