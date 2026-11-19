'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { SelectOption } from '@/services/surveys/types';

interface OptionsEditorProps {
  options: SelectOption[];
  onChange: (options: SelectOption[]) => void;
}

/** Sugiere un id libre */
function nextOptionId(options: SelectOption[]): string {
  const used = new Set(options.map((option) => option.id));
  for (let index = 0; index < 26; index += 1) {
    const candidate = String.fromCharCode(97 + index);
    if (!used.has(candidate)) return candidate;
  }
  return `opt${options.length + 1}`;
}

/**
 * Editor de opciones para preguntas de selección simple y múltiple.
 * El `score` de cada opción es lo que el backend usa para puntuar.
 */
export function OptionsEditor({ options, onChange }: OptionsEditorProps) {
  const updateOption = (index: number, patch: Partial<SelectOption>) => {
    onChange(
      options.map((option, position) =>
        position === index ? { ...option, ...patch } : option
      )
    );
  };

  const removeOption = (index: number) => {
    onChange(options.filter((_option, position) => position !== index));
  };

  const addOption = () => {
    onChange([...options, { id: nextOptionId(options), label: '', score: 0 }]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="hidden md:grid grid-cols-[80px_1fr_100px_40px] gap-2 text-xs font-medium text-muted-foreground">
        <span>Id</span>
        <span>Texto</span>
        <span>Puntaje</span>
        <span />
      </div>

      {options.map((option, index) => (
        <div
          key={`${index}-${option.id}`}
          className="grid grid-cols-[80px_1fr_100px_40px] gap-2 items-center"
        >
          <Input
            value={option.id}
            onChange={(event) =>
              updateOption(index, { id: event.target.value })
            }
            placeholder="id"
            className="h-9"
          />
          <Input
            value={option.label}
            onChange={(event) =>
              updateOption(index, { label: event.target.value })
            }
            placeholder="Texto de la opción"
            className="h-9"
          />
          <Input
            type="number"
            value={option.score}
            onChange={(event) =>
              updateOption(index, { score: Number(event.target.value) || 0 })
            }
            className="h-9"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive"
            onClick={() => removeOption(index)}
            disabled={options.length <= 1}
            title="Eliminar opción"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      <div>
        <Button type="button" variant="outline" size="sm" onClick={addOption}>
          <Plus className="h-4 w-4 mr-1" />
          Agregar opción
        </Button>
      </div>
    </div>
  );
}
