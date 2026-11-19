'use client';

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Film,
  ImageOff,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { SupportAttachment } from '@/services/support/types';
import { formatFileSize } from './support.utils';

interface AttachmentGalleryProps {
  attachments: SupportAttachment[];
  /**
   * Las URLs pueden estar firmadas por pocos minutos: si una deja de cargar se
   * pide el reporte de nuevo para obtener URLs frescas.
   */
  onExpired?: () => void;
}

/** Miniaturas de los adjuntos; al hacer clic, visor a pantalla completa con flechas */
export function AttachmentGallery({
  attachments,
  onExpired,
}: AttachmentGalleryProps) {
  const [index, setIndex] = React.useState<number | null>(null);
  // URL que falló por adjunto. Si el refresco trae otra (firma nueva), se
  // vuelve a intentar; si trae la misma, queda el marcador.
  const [failed, setFailed] = React.useState<Record<number, string>>({});
  const refreshed = React.useRef(false);

  const handleError = (attachment: SupportAttachment) => {
    setFailed((current) => ({
      ...current,
      [attachment.id]: attachment.url ?? '',
    }));
    // Las URLs firmadas vencen a los pocos minutos: se piden nuevas una vez
    if (!refreshed.current) {
      refreshed.current = true;
      onExpired?.();
    }
  };
  const isBroken = (attachment: SupportAttachment) =>
    !attachment.url || failed[attachment.id] === attachment.url;

  if (attachments.length === 0) return null;
  const current = index !== null ? attachments[index] : null;

  const move = (delta: number) =>
    setIndex((value) =>
      value === null
        ? value
        : (value + delta + attachments.length) % attachments.length
    );

  return (
    <>
      <ul className="flex flex-wrap gap-2">
        {attachments.map((attachment, i) => (
          <li key={attachment.id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="block h-20 w-20 overflow-hidden rounded-md border bg-gray-50 hover:ring-2 hover:ring-primary/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title={`${attachment.originalName} · ${formatFileSize(attachment.size)}`}
            >
              {attachment.isImage && !isBroken(attachment) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={attachment.url ?? undefined}
                  alt={attachment.originalName}
                  className="h-full w-full object-cover"
                  onError={() => handleError(attachment)}
                  loading="lazy"
                />
              ) : attachment.isImage ? (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-gray-400">
                  <ImageOff className="h-6 w-6" aria-hidden />
                  <span className="text-[10px]">No disponible</span>
                </span>
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-gray-500">
                  <Film className="h-6 w-6" aria-hidden />
                  <span className="w-full truncate text-center text-[10px]">
                    {attachment.originalName}
                  </span>
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={current !== null}
        onOpenChange={(open) => !open && setIndex(null)}
      >
        <DialogContent
          width="min(1100px, 96vw)"
          maxHeight="94vh"
          className="p-3"
        >
          {current && (
            <div
              className="flex flex-col gap-2"
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') move(1);
                if (event.key === 'ArrowLeft') move(-1);
              }}
            >
              <DialogTitle className="pr-8 text-sm font-medium">
                {current.originalName}
                <span className="ml-2 font-normal text-gray-400">
                  {formatFileSize(current.size)}
                  {attachments.length > 1 &&
                    ` · ${(index ?? 0) + 1} de ${attachments.length}`}
                </span>
              </DialogTitle>
              <div className="relative flex items-center justify-center rounded bg-gray-900/95">
                {current.isVideo && current.url ? (
                  <video
                    key={current.id}
                    src={current.url}
                    controls
                    className="max-h-[78vh] w-full"
                    onError={() => handleError(current)}
                  />
                ) : current.url && !isBroken(current) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.url}
                    alt={current.originalName}
                    className="max-h-[78vh] w-auto object-contain"
                    onError={() => handleError(current)}
                  />
                ) : (
                  <span className="flex h-64 w-full flex-col items-center justify-center gap-2 text-gray-400">
                    <ImageOff className="h-10 w-10" aria-hidden />
                    <span className="text-sm">
                      No se pudo cargar el archivo
                    </span>
                  </span>
                )}
                {attachments.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => move(-1)}
                      className="absolute left-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      aria-label="Anterior"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(1)}
                      className="absolute right-2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70"
                      aria-label="Siguiente"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
              {current.url && (
                <a
                  href={current.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" aria-hidden />
                  Abrir en otra pestaña
                </a>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
