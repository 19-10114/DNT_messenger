'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

import { Label } from '@/components/ui/label.component';
import { PageThemeKey } from '@/services/pages/types';
import { getTheme, isHexColor, readableOn } from '../../themes';

interface AccentColorFieldProps {
  theme: PageThemeKey;
  /** `#RRGGBB`, o vacío = el del tema */
  value: string;
  onChange: (value: string) => void;
}

/**
 * Color de acento de la página: botones, precios, barras y franjas. El texto
 * encima se calcula para que siempre se lea.
 */
export function AccentColorField({
  theme,
  value,
  onChange,
}: AccentColorFieldProps) {
  const themeAccent = getTheme(theme).vars.primary;
  const current = isHexColor(value) ? value : themeAccent;
  const custom = isHexColor(value);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label htmlFor="page-accent">Color de acento</Label>
        {custom ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800"
            onClick={() => onChange('')}
          >
            <RotateCcw className="h-3 w-3" />
            Volver al del tema
          </button>
        ) : (
          <span className="text-xs text-gray-400">El del tema</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        <label className="relative h-10 w-14 shrink-0 cursor-pointer overflow-hidden rounded-md border">
          <input
            id="page-accent"
            type="color"
            value={current}
            onChange={(event) => onChange(event.target.value.toUpperCase())}
            className="absolute -inset-2 h-[calc(100%+1rem)] w-[calc(100%+1rem)] cursor-pointer"
          />
        </label>
        <span
          className="rounded-full px-4 py-2 text-sm font-semibold shadow-sm"
          style={{ backgroundColor: current, color: readableOn(current) }}
        >
          Así se ve un botón
        </span>
        <span className="font-mono text-xs text-gray-500">{current}</span>
      </div>
      <p className="text-xs text-gray-500">
        Botones, precios y franjas de acento. El color del texto se ajusta solo
        para que siempre se lea.
      </p>
    </div>
  );
}
