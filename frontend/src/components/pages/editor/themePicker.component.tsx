'use client';

import React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { PageThemeKey } from '@/services/pages/types';
import { PAGE_THEMES, THEME_ORDER } from '../themes';

interface ThemePickerProps {
  value: PageThemeKey;
  onChange: (theme: PageThemeKey) => void;
  compact?: boolean;
}

/** Tarjetas de tema con una muestra de sus colores */
export function ThemePicker({ value, onChange, compact }: ThemePickerProps) {
  return (
    <div
      className={cn('grid gap-2', compact ? 'grid-cols-3' : 'sm:grid-cols-3')}
    >
      {THEME_ORDER.map((key) => {
        const theme = PAGE_THEMES[key];
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              'relative flex flex-col overflow-hidden rounded-xl border-2 text-left transition-all',
              active
                ? 'border-[#ff8635] shadow-md'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <div
              className="relative h-16"
              style={{ background: theme.vars.placeholder }}
            >
              <div
                className="absolute bottom-2 left-2 right-2 flex items-center gap-1.5 rounded-md p-1.5"
                style={{ background: theme.vars.bg }}
              >
                <span
                  className="h-2 flex-1 rounded-full"
                  style={{ background: theme.vars.fg, opacity: 0.8 }}
                />
                <span
                  className="h-3 w-6 rounded-full"
                  style={{ background: theme.vars.primary }}
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 p-2">
              <span className="text-sm font-semibold">{theme.name}</span>
              {!compact && (
                <span className="text-xs text-gray-500">
                  {theme.description}
                </span>
              )}
            </div>
            {active && (
              <span className="absolute right-1.5 top-1.5 rounded-full bg-[#ff8635] p-0.5 text-white">
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
