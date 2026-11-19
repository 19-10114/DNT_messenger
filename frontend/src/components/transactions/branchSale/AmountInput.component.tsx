'use client';

import React from 'react';

import { Input } from '@/components/ui/input.component';
import { cn } from '@/lib/utils';

interface AmountInputProps {
  /** El monto tal cual se escribe; el padre decide cómo guardarlo */
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
}

/**
 * Sólo dígitos y un punto decimal. El input es de texto —y no `number`— para
 * que el navegador no dibuje sus flechitas, así que el filtro va acá.
 */
const NUMERIC_PATTERN = /^\d*\.?\d*$/;

/** Campo de monto, editable únicamente escribiendo. */
export function AmountInput({
  value,
  onChange,
  id,
  className,
}: AmountInputProps) {
  return (
    <Input
      id={id}
      type="text"
      inputMode="decimal"
      className={cn('h-6 text-xs text-center', className)}
      value={value}
      onChange={(e) => {
        if (NUMERIC_PATTERN.test(e.target.value)) onChange(e.target.value);
      }}
    />
  );
}
