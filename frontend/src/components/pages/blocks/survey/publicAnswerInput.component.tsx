'use client';

import React from 'react';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils';
import { AnswerValue, SurveyQuestion } from '@/services/surveys/types';

interface PublicAnswerInputProps {
  question: SurveyQuestion;
  value?: AnswerValue;
  onChange: (value: AnswerValue) => void;
  /** Una opción única elegida: el flujo puede avanzar solo */
  onPicked?: () => void;
}

const optionClass = (active: boolean) =>
  cn(
    'flex w-full items-center gap-3 rounded-[calc(var(--pg-radius)*0.7)] border-2 px-4 py-3.5 text-left text-base font-medium transition-all duration-150',
    active
      ? 'border-[var(--pg-primary)] bg-[var(--pg-primary)]/10 text-[var(--pg-fg)] shadow-sm'
      : 'border-[var(--pg-border)] bg-[var(--pg-surface)] text-[var(--pg-fg)] hover:border-[var(--pg-muted)]'
  );

function Mark({ active, square }: { active: boolean; square?: boolean }) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 shrink-0 items-center justify-center border-2 transition-colors',
        square ? 'rounded-md' : 'rounded-full',
        active
          ? 'border-[var(--pg-primary)] bg-[var(--pg-primary)] text-[var(--pg-primary-fg)]'
          : 'border-[var(--pg-border)]'
      )}
    >
      {active && <Check className="h-4 w-4" strokeWidth={3} />}
    </span>
  );
}

const fieldClass =
  'w-full rounded-[calc(var(--pg-radius)*0.7)] border-2 border-[var(--pg-border)] bg-[var(--pg-surface)] px-4 py-3 text-base text-[var(--pg-fg)] outline-none transition-colors placeholder:text-[var(--pg-muted)] focus:border-[var(--pg-primary)]';

/**
 * Control de respuesta para quien visita una página pública: opciones
 * grandes y fáciles de tocar, con los colores del tema y sin puntajes.
 */
export function PublicAnswerInput({
  question,
  value,
  onChange,
  onPicked,
}: PublicAnswerInputProps) {
  switch (question.type) {
    case 'single_select': {
      const selected =
        value && 'selected' in value && !Array.isArray(value.selected)
          ? value.selected
          : undefined;
      return (
        <div className="flex flex-col gap-2.5">
          {question.config.options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={optionClass(selected === option.id)}
              onClick={() => {
                onChange({ selected: option.id });
                onPicked?.();
              }}
            >
              <Mark active={selected === option.id} />
              {option.label}
            </button>
          ))}
        </div>
      );
    }

    case 'multi_select': {
      const selected =
        value && 'selected' in value
          ? ([] as string[]).concat(value.selected)
          : [];
      const max = question.config.maxSelections;
      return (
        <div className="flex flex-col gap-2.5">
          {max ? (
            <p className="text-sm text-[var(--pg-muted)]">Elige hasta {max}.</p>
          ) : (
            <p className="text-sm text-[var(--pg-muted)]">
              Puedes elegir varias.
            </p>
          )}
          {question.config.options.map((option) => {
            const active = selected.includes(option.id);
            const blocked = !active && !!max && selected.length >= max;
            return (
              <button
                key={option.id}
                type="button"
                disabled={blocked}
                className={cn(optionClass(active), blocked && 'opacity-50')}
                onClick={() =>
                  onChange({
                    selected: active
                      ? selected.filter((id) => id !== option.id)
                      : [...selected, option.id],
                  })
                }
              >
                <Mark active={active} square />
                {option.label}
              </button>
            );
          })}
        </div>
      );
    }

    case 'range': {
      const { min, max, step } = question.config;
      const current =
        value && 'value' in value && typeof value.value === 'number'
          ? value.value
          : undefined;
      return (
        <div className="flex flex-col gap-3">
          <div className="text-center text-5xl font-extrabold tabular-nums text-[var(--pg-fg)]">
            {current ?? '—'}
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step ?? 1}
            value={current ?? Math.round((min + max) / 2)}
            onChange={(event) =>
              onChange({ value: Number(event.target.value) })
            }
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[var(--pg-border)] accent-[var(--pg-primary)]"
          />
          <div className="flex justify-between text-sm text-[var(--pg-muted)]">
            <span>{min}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }

    case 'number': {
      const current = value && 'value' in value ? value.value : '';
      return (
        <input
          type="number"
          inputMode="decimal"
          min={question.config.min}
          max={question.config.max}
          value={current === undefined ? '' : String(current)}
          onChange={(event) =>
            onChange({
              value:
                event.target.value === '' ? '' : Number(event.target.value),
            })
          }
          className={fieldClass}
        />
      );
    }

    case 'text': {
      const current = value && 'value' in value ? String(value.value) : '';
      return (
        <textarea
          rows={4}
          maxLength={question.config.maxLength}
          value={current}
          placeholder="Escribe tu respuesta…"
          onChange={(event) => onChange({ value: event.target.value })}
          className={cn(fieldClass, 'resize-none')}
        />
      );
    }

    case 'boolean':
    default: {
      const current = value && 'value' in value ? value.value : undefined;
      return (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map((option) => (
            <button
              key={String(option)}
              type="button"
              className={cn(
                optionClass(current === option),
                'justify-center py-5 text-lg'
              )}
              onClick={() => {
                onChange({ value: option });
                onPicked?.();
              }}
            >
              {option ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      );
    }
  }
}
