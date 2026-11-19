import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { PageRenderer } from '@/components/pages/public/pageRenderer.component';
import { getPublicPage } from '@/services/pages/publicPage.server';

// Las URLs de las imágenes son firmadas y vencen a los 5 minutos: cada
// visita pide la página fresca al backend.
export const dynamic = 'force-dynamic';

interface PublicPageRouteProps {
  params: { slug: string };
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export async function generateMetadata({
  params,
}: PublicPageRouteProps): Promise<Metadata> {
  const page = await getPublicPage(params.slug);
  if (!page) return { title: 'Página no disponible | Moto Candela' };

  const title = page.seoTitle || page.title;
  const description =
    page.seoDescription || 'Moto Candela: motos, repuestos y servicio.';
  return {
    // Sin `NEXT_PUBLIC_SITE_URL`, Next usa la URL de producción de Vercel
    ...(SITE_URL ? { metadataBase: new URL(SITE_URL) } : {}),
    title: `${title} | Moto Candela`,
    description,
    robots: { index: true, follow: true },
    // La imagen la pone `opengraph-image.tsx` de esta misma ruta
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: 'Moto Candela',
      locale: 'es_VE',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

/** Página pública armada con el módulo de Páginas */
export default async function PublicPageRoute({
  params,
}: PublicPageRouteProps) {
  const page = await getPublicPage(params.slug);
  if (!page) notFound();

  return (
    <PageRenderer
      mode="public"
      theme={page.theme}
      accentColor={page.accentColor}
      slug={page.slug}
      products={page.products ?? []}
      chrome={{
        showLogo: page.showLogo,
        headerStyle: page.headerStyle ?? 'logo',
        logo: page.logoImage,
        showFooter: page.showFooter,
        footerStyle: page.footerStyle ?? 'simple',
        footerText: page.footerText,
        socialLinks: page.socialLinks,
      }}
      blocks={page.blocks.map((block, index) => ({
        key: String(block.id ?? index),
        block,
      }))}
      images={page.images}
      surveys={page.surveys}
      className="min-h-screen"
    />
  );
}
