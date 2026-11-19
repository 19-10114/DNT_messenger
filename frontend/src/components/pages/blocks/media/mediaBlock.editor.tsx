'use client';

import React from 'react';

import { BLOCK_CATALOG } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import { ButtonsField } from '../../editor/fields/buttonsField.component';
import {
  ChoiceGroup,
  TextField,
} from '../../editor/fields/editorFields.component';
import { MediaField } from '../../editor/fields/mediaField.component';

export function MediaBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'media'>) {
  const { config } = block;
  const set = (patch: Partial<typeof config>) =>
    onChange({ ...block, config: { ...config, ...patch } });
  const overlay = block.variant === 'overlay';

  return (
    <div className="flex flex-col gap-5">
      <ChoiceGroup
        label="Diseño"
        value={block.variant}
        options={BLOCK_CATALOG.media.variants}
        onChange={(variant) => onChange({ ...block, variant })}
      />
      <MediaField
        label="Foto o producto"
        hint={
          overlay
            ? 'Horizontal y de buena calidad: el texto va encima.'
            : 'Proporción 4:3. Para una ficha larga, agrega otro bloque con la foto al otro lado.'
        }
        value={config}
        onChange={(slot) => set(slot)}
        showPrice={config.showPrice}
        onShowPriceChange={
          overlay ? undefined : (showPrice) => set({ showPrice })
        }
      />
      <TextField
        id={`${blockKey}-heading`}
        label="Título (opcional)"
        max={80}
        value={config.heading ?? ''}
        onChange={(heading) => set({ heading })}
      />
      <TextField
        id={`${blockKey}-body`}
        label="Texto"
        hint="Deja una línea en blanco para separar párrafos."
        max={1200}
        multiline
        rows={6}
        value={config.body}
        onChange={(body) => set({ body })}
      />
      <ButtonsField
        value={config.buttons}
        onChange={(buttons) => set({ buttons })}
      />
    </div>
  );
}
