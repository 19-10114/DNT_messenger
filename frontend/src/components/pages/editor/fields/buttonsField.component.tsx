'use client';

import React from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { cn } from '@/lib/utils';
import { PageButton } from '@/services/pages/types';
import { newButton } from '../../blocks/catalog';

const MAX_BUTTONS = 3;

interface ButtonsFieldProps {
  value: PageButton[] | undefined;
  onChange: (buttons: PageButton[]) => void;
  /** Mínimo de botones (el bloque Botón necesita al menos uno) */
  min?: number;
}

function Segmented<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex rounded-md bg-gray-100 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'flex-1 rounded px-2 py-1 text-xs font-medium transition-colors',
            value === option.value ? 'bg-white shadow-sm' : 'text-gray-600'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Hasta 3 botones: texto, WhatsApp o enlace, y estilo relleno o contorno */
export function ButtonsField({ value, onChange, min = 0 }: ButtonsFieldProps) {
  const buttons = value ?? [];
  const update = (index: number, patch: Partial<PageButton>) =>
    onChange(buttons.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  const move = (index: number, delta: number) => {
    const next = [...buttons];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <Label>Botones</Label>
        <span className="text-xs text-gray-400">
          {buttons.length}/{MAX_BUTTONS}
        </span>
      </div>
      {buttons.map((button, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-lg border bg-gray-50/60 p-2.5"
        >
          <div className="flex items-center gap-1.5">
            <Input
              className="h-9 bg-white"
              placeholder="Texto del botón"
              maxLength={24}
              value={button.label}
              onChange={(event) => update(index, { label: event.target.value })}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp className="h-4 w-4" />
              <span className="sr-only">Subir</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              disabled={index === buttons.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown className="h-4 w-4" />
              <span className="sr-only">Bajar</span>
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              disabled={buttons.length <= min}
              onClick={() => onChange(buttons.filter((_, i) => i !== index))}
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Quitar</span>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Segmented
              value={button.kind}
              options={[
                { value: 'whatsapp', label: 'WhatsApp' },
                { value: 'link', label: 'Enlace' },
              ]}
              onChange={(kind) =>
                update(
                  index,
                  kind === 'whatsapp'
                    ? {
                        kind,
                        phone: button.phone || newButton().phone,
                        url: undefined,
                      }
                    : {
                        kind,
                        url: button.url || 'https://',
                        phone: undefined,
                        message: undefined,
                      }
                )
              }
            />
            <Segmented
              value={button.style ?? 'primary'}
              options={[
                { value: 'primary', label: 'Relleno' },
                { value: 'outline', label: 'Contorno' },
              ]}
              onChange={(style) => update(index, { style })}
            />
          </div>
          {button.kind === 'whatsapp' ? (
            <div className="flex flex-col gap-2">
              <Input
                className="h-9 bg-white"
                placeholder="+584141234567"
                value={button.phone ?? ''}
                onChange={(event) =>
                  update(index, {
                    phone: event.target.value.replace(/[^0-9+]/g, ''),
                  })
                }
              />
              <Input
                className="h-9 bg-white"
                placeholder="Mensaje precargado (opcional)"
                maxLength={200}
                value={button.message ?? ''}
                onChange={(event) =>
                  update(index, { message: event.target.value })
                }
              />
            </div>
          ) : (
            <Input
              className="h-9 bg-white"
              placeholder="https://… o /p/otra-pagina"
              value={button.url ?? ''}
              onChange={(event) =>
                update(index, { url: event.target.value.trim() })
              }
            />
          )}
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="self-start"
        disabled={buttons.length >= MAX_BUTTONS}
        onClick={() =>
          onChange([
            ...buttons,
            newButton(
              buttons.length === 0 ? 'whatsapp' : 'link',
              buttons.length === 0 ? 'primary' : 'outline'
            ),
          ])
        }
      >
        <Plus className="mr-1.5 h-4 w-4" />
        Agregar botón
      </Button>
    </div>
  );
}
