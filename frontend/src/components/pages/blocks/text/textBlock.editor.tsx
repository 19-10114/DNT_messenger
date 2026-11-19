'use client';

import React from 'react';

import { BLOCK_CATALOG } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import {
  ChoiceGroup,
  TextField,
} from '../../editor/fields/editorFields.component';

export function TextBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'text'>) {
  const { config } = block;
  const set = (patch: Partial<typeof config>) =>
    onChange({ ...block, config: { ...config, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <ChoiceGroup
        label="Estilo"
        value={block.variant}
        options={BLOCK_CATALOG.text.variants}
        onChange={(variant) => onChange({ ...block, variant })}
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
        rows={7}
        value={config.body}
        onChange={(body) => set({ body })}
      />
    </div>
  );
}
