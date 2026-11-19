'use client';

import React from 'react';

import { BLOCK_CATALOG } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import { ButtonsField } from '../../editor/fields/buttonsField.component';
import {
  ChoiceGroup,
  TextField,
} from '../../editor/fields/editorFields.component';
import { ImageField } from '../../editor/fields/imageField.component';
import { MediaField } from '../../editor/fields/mediaField.component';

export function HeroBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'hero'>) {
  const { config } = block;
  const set = (patch: Partial<typeof config>) =>
    onChange({ ...block, config: { ...config, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <ChoiceGroup
        label="Diseño"
        value={block.variant}
        options={BLOCK_CATALOG.hero.variants}
        onChange={(variant) => onChange({ ...block, variant })}
      />
      <MediaField
        label="Foto"
        hint={
          block.variant === 'full'
            ? 'Horizontal y de buena calidad, mínimo 1600 px de ancho.'
            : 'Horizontal, proporción 4:3. Un producto del catálogo abre su ficha al tocarlo.'
        }
        value={config}
        onChange={(slot) => set(slot)}
        showPrice={config.showPrice}
        onShowPriceChange={
          block.variant === 'split'
            ? (showPrice) => set({ showPrice })
            : undefined
        }
      />
      <ImageField
        label="Foto para celular (opcional)"
        hint="Vertical, proporción 4:5 o 9:16. Sin ella, en celular se recorta la foto principal."
        value={config.mobileImageId}
        onChange={(mobileImageId) => set({ mobileImageId })}
      />
      <TextField
        id={`${blockKey}-title`}
        label="Título"
        max={80}
        value={config.title}
        onChange={(title) => set({ title })}
      />
      <TextField
        id={`${blockKey}-subtitle`}
        label="Frase"
        max={160}
        multiline
        rows={2}
        value={config.subtitle ?? ''}
        onChange={(subtitle) => set({ subtitle })}
      />
      <ChoiceGroup
        label="Alineación"
        value={config.align ?? 'left'}
        options={[
          { value: 'left', label: 'Izquierda' },
          { value: 'center', label: 'Centrada' },
        ]}
        onChange={(align) => set({ align })}
      />
      <ButtonsField
        value={config.buttons}
        onChange={(buttons) => set({ buttons })}
      />
    </div>
  );
}
