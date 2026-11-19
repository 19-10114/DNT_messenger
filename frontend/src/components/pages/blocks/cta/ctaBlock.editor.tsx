'use client';

import React from 'react';

import { CtaBlockConfig } from '@/services/pages/types';
import { BLOCK_CATALOG, DEFAULT_WHATSAPP, newButton } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import { ButtonsField } from '../../editor/fields/buttonsField.component';
import {
  ChoiceGroup,
  TextField,
} from '../../editor/fields/editorFields.component';

/** Pasar de botones en fila a flotante (y al revés) conserva el primero */
function convert(
  config: CtaBlockConfig,
  to: 'button' | 'floating'
): CtaBlockConfig {
  if (to === 'floating') {
    const first = config.buttons?.[0] ?? newButton();
    return {
      kind: first.kind,
      label: first.label.slice(0, 30) || 'Escríbenos',
      phone: first.phone,
      message: first.message,
      url: first.url,
    };
  }
  return {
    buttons: [
      {
        label: (config.label ?? 'Escríbenos').slice(0, 24),
        kind: config.kind ?? 'whatsapp',
        phone: config.phone,
        message: config.message,
        url: config.url,
        style: 'primary',
      },
    ],
  };
}

export function CtaBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'cta'>) {
  const { config } = block;
  const set = (patch: Partial<CtaBlockConfig>) =>
    onChange({ ...block, config: { ...config, ...patch } });
  const floating = block.variant === 'floating';

  return (
    <div className="flex flex-col gap-5">
      <ChoiceGroup
        label="Estilo"
        value={block.variant}
        options={BLOCK_CATALOG.cta.variants}
        onChange={(variant) =>
          variant !== block.variant &&
          onChange({ ...block, variant, config: convert(config, variant) })
        }
      />
      {!floating ? (
        <>
          <ButtonsField
            value={config.buttons}
            min={1}
            onChange={(buttons) => set({ buttons })}
          />
          <TextField
            id={`${blockKey}-sublabel`}
            label="Texto de apoyo (opcional)"
            max={60}
            value={config.sublabel ?? ''}
            onChange={(sublabel) => set({ sublabel })}
          />
        </>
      ) : (
        <>
          <ChoiceGroup
            label="Tipo"
            value={config.kind ?? 'whatsapp'}
            options={[
              { value: 'whatsapp', label: 'WhatsApp', hint: 'Abre un chat' },
              { value: 'link', label: 'Enlace', hint: 'Lleva a otra página' },
            ]}
            onChange={(kind) =>
              set(
                kind === 'whatsapp'
                  ? {
                      kind,
                      phone: config.phone || DEFAULT_WHATSAPP,
                      url: undefined,
                    }
                  : {
                      kind,
                      url: config.url || 'https://',
                      phone: undefined,
                      message: undefined,
                    }
              )
            }
          />
          <TextField
            id={`${blockKey}-label`}
            label="Texto del botón"
            max={30}
            value={config.label ?? ''}
            onChange={(label) => set({ label })}
          />
          {config.kind !== 'link' ? (
            <>
              <TextField
                id={`${blockKey}-phone`}
                label="Número de WhatsApp"
                hint="Con código de país y sin espacios: +584141234567"
                value={config.phone ?? ''}
                onChange={(phone) =>
                  set({ phone: phone.replace(/[^0-9+]/g, '') })
                }
              />
              <TextField
                id={`${blockKey}-message`}
                label="Mensaje precargado (opcional)"
                hint="Lo que el cliente verá escrito al abrir el chat."
                max={200}
                multiline
                rows={2}
                value={config.message ?? ''}
                onChange={(message) => set({ message })}
              />
            </>
          ) : (
            <TextField
              id={`${blockKey}-url`}
              label="Enlace"
              hint="https://… o una ruta del sitio como /p/otra-pagina"
              value={config.url ?? ''}
              onChange={(url) => set({ url })}
            />
          )}
        </>
      )}
    </div>
  );
}
