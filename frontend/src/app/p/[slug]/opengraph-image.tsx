import { ImageResponse } from 'next/og';

import { getPublicPage } from '@/services/pages/publicPage.server';
import { MediaSlot, PageImage, PublicPage } from '@/services/pages/types';

export const alt = 'Moto Candela';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const dynamic = 'force-dynamic';

/** Satori (el motor de ImageResponse) no lee WebP */
const isDrawable = (image: PageImage) =>
  /\.(png|jpe?g)$/i.test(new URL(image.url).pathname);

function shareImage(page: PublicPage): PageImage | undefined {
  const byId = new Map(page.images.map((image) => [image.id, image]));
  const products = new Map((page.products ?? []).map((p) => [p.id, p]));
  // Un hueco puede ser una foto subida o un producto (su foto destacada)
  const fromSlot = (slot: MediaSlot): PageImage | undefined => {
    if (slot.imageId) return byId.get(slot.imageId);
    const url = slot.productId
      ? products.get(slot.productId)?.images[0]
      : undefined;
    return url ? { id: 0, url, width: null, height: null } : undefined;
  };
  const candidates: (PageImage | undefined)[] = [page.ogImage ?? undefined];
  for (const block of page.blocks) {
    if (block.type === 'hero' || block.type === 'media') {
      candidates.push(fromSlot(block.config));
    }
    if (block.type === 'gallery') {
      block.config.images.forEach((item) => candidates.push(fromSlot(item)));
    }
    if (block.type === 'products') {
      block.config.products.forEach((item) => candidates.push(fromSlot(item)));
    }
  }
  return candidates.find(
    (image): image is PageImage => !!image && isDrawable(image)
  );
}

/**
 * Tarjeta que muestran WhatsApp, Instagram y compañía al compartir el link.
 * Se genera en el servidor en cada pedido: la URL de la tarjeta es estable
 * aunque las de las fotos del bucket venzan a los 5 minutos.
 */
export default async function OpenGraphImage({
  params,
}: {
  params: { slug: string };
}) {
  const page = await getPublicPage(params.slug);
  const title = page ? page.seoTitle || page.title : 'Moto Candela';
  const description = page?.seoDescription ?? '';
  const photo = page ? shareImage(page) : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          background:
            'radial-gradient(circle at 80% 20%, #ff8635 0%, transparent 45%), linear-gradient(135deg, #2b1a10 0%, #141210 100%)',
        }}
      >
        {photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo.url}
            alt=""
            width={1200}
            height={630}
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            background:
              'linear-gradient(0deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 64,
            right: 64,
            bottom: 56,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
            color: 'white',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 6,
            }}
          >
            <div
              style={{
                width: 44,
                height: 8,
                borderRadius: 4,
                background: '#ff8635',
              }}
            />
            MOTO CANDELA
          </div>
          <div
            style={{
              fontSize: title.length > 40 ? 64 : 80,
              fontWeight: 800,
              lineHeight: 1.04,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 30, color: 'rgba(255,255,255,0.82)' }}>
              {description}
            </div>
          )}
        </div>
      </div>
    ),
    size
  );
}
