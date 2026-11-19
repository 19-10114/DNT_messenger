'use client';

import * as React from 'react';
import { Input, InputProps } from '@/components/ui/input.component';

export type MoneyLocale = 'USD' | 'BS';

/** Separadores de cada moneda, como los muestra el resto de la app. */
const SEPARATORS: Record<MoneyLocale, { group: string; decimal: string }> = {
  USD: { group: ',', decimal: '.' },
  BS: { group: '.', decimal: ',' },
};

/**
 * Lo escrito → número en texto plano ("1234.56"), listo para `Number()` y
 * para guardar. Acepta los dos separadores en cualquier moneda: el último
 * punto o coma con como máximo dos dígitos detrás es el decimal; todo lo demás
 * son separadores de miles. Así "1.234,56", "1,234.56", "1234,5" y "1234.5"
 * valen igual, también desde el teclado numérico del celular, que no tiene
 * los dos.
 */
export function parseMoneyInput(text: string): string {
  const cleaned = text.replace(/[^\d.,]/g, '');
  if (!cleaned) return '';
  const lastSeparator = Math.max(
    cleaned.lastIndexOf('.'),
    cleaned.lastIndexOf(',')
  );
  const decimalsLength = cleaned.length - lastSeparator - 1;
  const hasDecimal = lastSeparator >= 0 && decimalsLength <= 2;
  const integer = (
    hasDecimal ? cleaned.slice(0, lastSeparator) : cleaned
  ).replace(/[.,]/g, '');
  const decimals = hasDecimal ? cleaned.slice(lastSeparator + 1) : '';
  // Conservar el separador mientras se escribe ("12," todavía no tiene
  // decimales) para no borrárselo al usuario.
  const trailing = hasDecimal && decimals === '' ? '.' : '';
  return `${integer || (hasDecimal ? '0' : '')}${
    decimals ? `.${decimals}` : trailing
  }`;
}

/** Número en texto plano → como se muestra: "1234.56" → "1,234.56" o "1.234,56". */
export function formatMoneyInput(raw: string, locale: MoneyLocale): string {
  if (!raw) return '';
  const { group, decimal } = SEPARATORS[locale];
  const [integer = '', decimals] = raw.split('.');
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  if (decimals === undefined) return grouped;
  return `${grouped}${decimal}${decimals}`;
}

export interface MoneyInputProps
  extends Omit<InputProps, 'value' | 'onChange' | 'type' | 'inputMode'> {
  /** Número en texto plano ("1234.56"), lo que guarda el formulario. */
  value: string;
  onChange: (raw: string) => void;
  /** Qué separadores mostrar. */
  locale: MoneyLocale;
}

const MAX_DECIMALS = 2;

/**
 * Una edición del campo → el nuevo número en texto plano y dónde queda el
 * caret, medido en caracteres de ese número (dígitos y punto).
 *
 * Interpreta solo lo que el usuario acaba de hacer, no el texto entero desde
 * cero: el texto mostrado ya está en los separadores de `locale`, así que:
 * - Teclear un punto o una coma (cualquiera de los dos, el teclado del
 *   celular trae uno solo) pone el separador decimal ahí; si ya hay uno, se
 *   ignora.
 * - Teclear dígitos o borrar se lee con los separadores de `locale`: el de
 *   miles se descarta y el decimal se respeta. Así borrar en "1,234" da "123"
 *   (no 1.23) y un tercer decimal se descarta (no convierte "1,234.56" en
 *   1,234,567).
 * - Pegar varios caracteres usa `parseMoneyInput`, que acepta "1.234,56" y
 *   "1,234.56".
 */
export function applyMoneyEdit(
  previousDisplay: string,
  typed: string,
  caret: number,
  locale: MoneyLocale
): { raw: string; rawCaret: number } {
  const { decimal } = SEPARATORS[locale];
  const inserted = typed.length - previousDisplay.length;
  // Una tecla, o el campo entero reemplazado por un separador.
  const typedChar =
    inserted === 1 || /^[.,]$/.test(typed) ? typed[caret - 1] : undefined;

  if (typedChar === '.' || typedChar === ',') {
    if (previousDisplay.includes(decimal)) {
      // Ya hay decimal: la tecla no cambia nada.
      return {
        raw: parseStrict(previousDisplay, locale).raw,
        rawCaret: parseStrict(previousDisplay.slice(0, caret - 1), locale).raw
          .length,
      };
    }
    const integer =
      typed
        .slice(0, caret - 1)
        .replace(/\D/g, '')
        .replace(/^0+(?=\d)/, '') || '0';
    const decimals = typed
      .slice(caret)
      .replace(/\D/g, '')
      .slice(0, MAX_DECIMALS);
    return { raw: `${integer}.${decimals}`, rawCaret: integer.length + 1 };
  }

  if (inserted > 1) {
    const raw = parseMoneyInput(typed);
    return { raw, rawCaret: raw.length };
  }

  const { raw } = parseStrict(typed, locale);
  const rawCaret = Math.min(
    parseStrict(typed.slice(0, caret), locale, false).raw.length,
    raw.length
  );
  return { raw, rawCaret };
}

/**
 * Texto con los separadores de `locale` → número en texto plano: sin el de
 * miles, el primer decimal como punto, a lo sumo dos decimales (si
 * `truncate`).
 */
function parseStrict(
  text: string,
  locale: MoneyLocale,
  truncate: boolean = true
): { raw: string } {
  const { decimal } = SEPARATORS[locale];
  let integer = '';
  let decimals: string | undefined;
  for (const char of text) {
    if (/\d/.test(char)) {
      if (decimals === undefined) integer += char;
      else decimals += char;
    } else if (char === decimal && decimals === undefined) {
      decimals = '';
    }
  }
  if (decimals === undefined) return { raw: integer };
  const kept = truncate ? decimals.slice(0, MAX_DECIMALS) : decimals;
  return { raw: `${integer || '0'}.${kept}` };
}

/** Posición en el texto mostrado tras `rawCaret` caracteres del número. */
export function displayCaret(
  display: string,
  rawCaret: number,
  locale: MoneyLocale
): number {
  if (rawCaret <= 0) return 0;
  const { decimal } = SEPARATORS[locale];
  let seen = 0;
  for (let index = 0; index < display.length; index += 1) {
    if (/\d/.test(display[index]) || display[index] === decimal) seen += 1;
    if (seen === rawCaret) return index + 1;
  }
  return display.length;
}

/**
 * Campo de monto que muestra separador de miles mientras se escribe
 * (SAL-161) y entrega al formulario un número en texto plano. Mantiene el
 * caret donde estaba, contando dígitos, para que escribir en medio del número
 * no lo mande al final.
 */
export const MoneyInput = React.forwardRef<HTMLInputElement, MoneyInputProps>(
  ({ value, onChange, locale, onBlur, ...props }, forwardedRef) => {
    const innerRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };
    const [caret, setCaret] = React.useState<number | null>(null);

    const display = formatMoneyInput(value, locale);

    React.useLayoutEffect(() => {
      if (caret === null || !innerRef.current) return;
      innerRef.current.setSelectionRange(caret, caret);
      setCaret(null);
    }, [caret, display]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const typed = event.target.value;
      const { raw, rawCaret } = applyMoneyEdit(
        display,
        typed,
        event.target.selectionStart ?? typed.length,
        locale
      );
      setCaret(displayCaret(formatMoneyInput(raw, locale), rawCaret, locale));
      onChange(raw);
    };

    return (
      <Input
        {...props}
        ref={setRefs}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={display}
        onChange={handleChange}
        onBlur={(event) => {
          // Al salir, sin separador decimal colgando ("12," → "12").
          if (value.endsWith('.')) onChange(value.slice(0, -1));
          onBlur?.(event);
        }}
      />
    );
  }
);
MoneyInput.displayName = 'MoneyInput';
