'use client';

import React from 'react';
import { format } from 'date-fns';

import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import {
  usePageEditorActions,
  usePageEditorMeta,
} from '@/stores/pages/pageEditor.store';
import { TextField } from './fields/editorFields.component';
import { ImageField } from './fields/imageField.component';
import { ThemePicker } from './themePicker.component';
import { AccentColorField } from './fields/accentColorField.component';

/** Lo que el backend acepta en un slug; él termina de normalizarlo */
const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .slice(0, 140);

const toLocalInput = (iso: string | null) =>
  iso ? format(new Date(iso), "yyyy-MM-dd'T'HH:mm") : '';

/** Datos de la página: título, link, tema, compartir y vencimiento */
export function PageSettingsPanel() {
  const meta = usePageEditorMeta();
  const { setMeta } = usePageEditorActions();

  return (
    <div className="flex flex-col gap-6">
      <TextField
        id="page-title"
        label="Nombre de la página"
        hint="Solo lo ves tú en el listado. Cambiarlo no cambia el link."
        max={120}
        value={meta.title}
        onChange={(title) => setMeta({ title })}
      />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="page-slug">Link</Label>
        <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
          <span className="select-none whitespace-nowrap pl-3 text-sm text-gray-400">
            /p/
          </span>
          <Input
            id="page-slug"
            className="border-0 pl-0.5 focus-visible:ring-0 focus-visible:ring-offset-0"
            value={meta.slug}
            onChange={(event) =>
              setMeta({ slug: sanitizeSlug(event.target.value) })
            }
          />
        </div>
        <p className="text-xs text-gray-500">
          Si ya compartiste el link, cambiarlo hace que el anterior deje de
          funcionar.
        </p>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Tema</Label>
        <ThemePicker
          compact
          value={meta.theme}
          onChange={(theme) => setMeta({ theme })}
        />
      </div>
      <AccentColorField
        theme={meta.theme}
        value={meta.accentColor}
        onChange={(accentColor) => setMeta({ accentColor })}
      />
      <div className="flex flex-col gap-4 border-t pt-5">
        <div>
          <h3 className="text-sm font-semibold">Al compartir el link</h3>
          <p className="text-xs text-gray-500">
            Lo que muestran WhatsApp, Instagram y Facebook. Vacío = el nombre y
            la foto de la portada.
          </p>
        </div>
        <TextField
          id="page-seo-title"
          label="Título"
          max={70}
          value={meta.seoTitle}
          placeholder={meta.title}
          onChange={(seoTitle) => setMeta({ seoTitle })}
        />
        <TextField
          id="page-seo-description"
          label="Descripción"
          max={160}
          multiline
          rows={2}
          value={meta.seoDescription}
          onChange={(seoDescription) => setMeta({ seoDescription })}
        />
        <ImageField
          label="Imagen"
          hint="Horizontal, JPG o PNG (WebP no se ve en la tarjeta)."
          value={meta.ogImageId}
          onChange={(ogImageId) => setMeta({ ogImageId })}
        />
      </div>
      <div className="flex flex-col gap-1.5 border-t pt-5">
        <Label htmlFor="page-expires">Vence (opcional)</Label>
        <div className="flex gap-2">
          <Input
            id="page-expires"
            type="datetime-local"
            value={toLocalInput(meta.expiresAt)}
            onChange={(event) =>
              setMeta({
                expiresAt: event.target.value
                  ? new Date(event.target.value).toISOString()
                  : null,
              })
            }
          />
          {meta.expiresAt && (
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-gray-800"
              onClick={() => setMeta({ expiresAt: null })}
            >
              Quitar
            </button>
          )}
        </div>
        <p className="text-xs text-gray-500">
          Desde ese momento el link muestra “Esta página ya no está disponible”.
        </p>
      </div>
    </div>
  );
}
