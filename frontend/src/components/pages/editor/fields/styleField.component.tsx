'use client';

import React from 'react';
import { Check, RotateCcw } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label.component';
import {
  BlockBackground,
  BlockStyle,
  BlockTone,
  PageThemeKey,
  TextSize,
} from '@/services/pages/types';
import { ChoiceGroup } from './editorFields.component';
import { blockBackgroundStyle, themeStyle } from '../../themes';

const BACKGROUNDS: { value: BlockBackground; label: string }[] = [
  { value: 'theme', label: 'Del tema' },
  { value: 'surface', label: 'Suave' },
  { value: 'accent', label: 'Acento' },
  { value: 'dark', label: 'Oscuro' },
  { value: 'light', label: 'Claro' },
];

interface StyleFieldProps {
  value: BlockStyle | undefined;
  onChange: (style: BlockStyle) => void;
  theme: PageThemeKey;
  accentColor: string;
  /** Mostrar "Texto sobre la foto" (portada completa, texto sobre la foto) */
  withTone?: boolean;
  /** Qué textos del bloque se pueden ajustar (tamaño y color) */
  textParts?: ('heading' | 'body')[];
}

const SIZES: { value: TextSize; label: string }[] = [
  { value: 'sm', label: 'Pequeño' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Grande' },
  { value: 'xl', label: 'Muy grande' },
];

/** Tamaño (escala) y color libre de un título o texto */
function TextRow({
  label,
  size,
  color,
  onSize,
  onColor,
}: {
  label: string;
  size: TextSize;
  color: string | undefined;
  onSize: (size: TextSize) => void;
  onColor: (color: string | undefined) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {color && (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            onClick={() => onColor(undefined)}
          >
            <RotateCcw className="h-3 w-3" />
            Color automático
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-1 rounded-md bg-gray-100 p-0.5">
          {SIZES.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSize(option.value)}
              className={cn(
                'flex-1 rounded px-1 py-1 text-[11px] font-medium transition-colors',
                size === option.value ? 'bg-white shadow-sm' : 'text-gray-600'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <label
          title={color ? `Color ${color}` : 'Color: el del tema'}
          className="relative h-8 w-10 shrink-0 cursor-pointer overflow-hidden rounded-md border"
          style={
            color
              ? undefined
              : {
                  background:
                    'repeating-conic-gradient(#e5e7eb 0% 25%, #fff 0% 50%) 50% / 10px 10px',
                }
          }
        >
          <input
            type="color"
            value={color ?? '#000000'}
            onChange={(event) => onColor(event.target.value.toUpperCase())}
            className={cn(
              'absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer',
              !color && 'opacity-0'
            )}
          />
        </label>
      </div>
    </div>
  );
}

/**
 * Fondo del bloque (lista cerrada; el texto se adapta solo y siempre se lee)
 * y, si el texto va sobre una foto, si es claro u oscuro.
 */
export function StyleField({
  value,
  onChange,
  theme,
  accentColor,
  withTone,
  textParts = [],
}: StyleFieldProps) {
  const background = value?.background ?? 'theme';
  const set = (patch: BlockStyle) => {
    const next = { ...value, ...patch };
    if (next.background === 'theme') delete next.background;
    if (next.tone === 'auto') delete next.tone;
    if (next.headingSize === 'md') delete next.headingSize;
    if (next.bodySize === 'md') delete next.bodySize;
    if (!next.headingColor) delete next.headingColor;
    if (!next.bodyColor) delete next.bodyColor;
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label>Fondo</Label>
        <div className="grid grid-cols-5 gap-1.5">
          {BACKGROUNDS.map((option) => {
            const swatch = {
              ...themeStyle(theme, accentColor),
              ...blockBackgroundStyle(option.value, theme, accentColor),
            };
            const active = background === option.value;
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                onClick={() => set({ background: option.value })}
                className="flex flex-col items-center gap-1"
              >
                <span
                  style={swatch}
                  className={cn(
                    'relative flex h-10 w-full items-center justify-center rounded-md border bg-[var(--pg-bg)] text-[var(--pg-fg)] ring-offset-1 transition-shadow',
                    active
                      ? 'ring-2 ring-[#ff8635]'
                      : 'hover:ring-2 hover:ring-gray-300'
                  )}
                >
                  <span className="text-sm font-bold">Aa</span>
                  {active && (
                    <Check className="absolute right-0.5 top-0.5 h-3 w-3 text-[var(--pg-fg)]" />
                  )}
                </span>
                <span className="text-[11px] text-gray-600">
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      {textParts.includes('heading') && (
        <TextRow
          label="Título"
          size={value?.headingSize ?? 'md'}
          color={value?.headingColor}
          onSize={(headingSize) => set({ headingSize })}
          onColor={(headingColor) => set({ headingColor })}
        />
      )}
      {textParts.includes('body') && (
        <TextRow
          label="Texto"
          size={value?.bodySize ?? 'md'}
          color={value?.bodyColor}
          onSize={(bodySize) => set({ bodySize })}
          onColor={(bodyColor) => set({ bodyColor })}
        />
      )}
      {withTone && (
        <ChoiceGroup<BlockTone>
          label="Texto sobre la foto"
          value={value?.tone ?? 'auto'}
          options={[
            { value: 'auto', label: 'Claro', hint: 'Para fotos oscuras' },
            { value: 'dark', label: 'Oscuro', hint: 'Para fotos claras' },
          ]}
          onChange={(tone) => set({ tone })}
        />
      )}
    </div>
  );
}
