'use client';

import React from 'react';

import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';

interface FieldProps {
  label: string;
  hint?: string;
  max?: number;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  id: string;
}

/** Campo de texto con etiqueta y contador cuando hay límite */
export function TextField({
  label,
  hint,
  max,
  value,
  onChange,
  placeholder,
  multiline,
  rows = 4,
  id,
}: FieldProps) {
  const over = max !== undefined && value.length > max;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {max !== undefined && (
          <span
            className={cn(
              'text-xs tabular-nums',
              over ? 'text-red-600' : 'text-gray-400'
            )}
          >
            {value.length}/{max}
          </span>
        )}
      </div>
      {multiline ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <Input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

interface ChoiceOption<V extends string> {
  value: V;
  label: string;
  hint?: string;
}

interface ChoiceGroupProps<V extends string> {
  label: string;
  value: V;
  options: ChoiceOption<V>[];
  onChange: (value: V) => void;
}

/** Elección entre pocas opciones, como tarjetas (variantes, alineación) */
export function ChoiceGroup<V extends string>({
  label,
  value,
  options,
  onChange,
}: ChoiceGroupProps<V>) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <div
        className={cn(
          'grid gap-2',
          options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
        )}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-start gap-0.5 rounded-lg border-2 px-3 py-2 text-left transition-colors',
              value === option.value
                ? 'border-[#ff8635] bg-orange-50'
                : 'border-gray-200 hover:border-gray-300'
            )}
          >
            <span className="text-sm font-medium">{option.label}</span>
            {option.hint && (
              <span className="text-xs text-gray-500">{option.hint}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Interruptor simple con etiqueta */
export function ToggleField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3">
      <span className="flex flex-col">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-xs text-gray-500">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[#ff8635]' : 'bg-gray-300'
        )}
      >
        <span
          className={cn(
            'absolute left-0 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          )}
        />
      </button>
    </label>
  );
}
