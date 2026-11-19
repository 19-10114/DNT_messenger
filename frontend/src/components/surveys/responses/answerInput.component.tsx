'use client';

import React from 'react';

import { Input } from '@/components/ui/input.component';
import { Textarea } from '@/components/ui/textarea.component';
import { AnswerValue, SurveyQuestion } from '@/services/surveys/types';

interface AnswerInputProps {
  question: SurveyQuestion;
  /** Valor actual; `undefined` mientras la pregunta esté sin responder */
  value?: AnswerValue;
  disabled?: boolean;
  onChange: (value: AnswerValue) => void;
}

/** Opción seleccionada de un `single_select` */
function selectedId(value?: AnswerValue): string | undefined {
  if (!value || !('selected' in value)) return undefined;
  return Array.isArray(value.selected) ? undefined : value.selected;
}

/** Opciones seleccionadas de un `multi_select` */
function selectedIds(value?: AnswerValue): string[] {
  if (!value || !('selected' in value)) return [];
  return Array.isArray(value.selected) ? value.selected : [value.selected];
}

/** Valor escalar (range / number / text / boolean) */
function scalarValue(
  value?: AnswerValue
): number | string | boolean | undefined {
  if (!value || !('value' in value)) return undefined;
  return value.value;
}

/**
 * Control editable de una respuesta, con la forma que exige el `type` de la
 * pregunta. Se usa en la revisión de staff, donde sí se escriben respuestas
 * (la vista previa del constructor tiene su propio render deshabilitado).
 */
export function AnswerInput({
  question,
  value,
  disabled = false,
  onChange,
}: AnswerInputProps) {
  switch (question.type) {
    case 'single_select': {
      const selected = selectedId(value);

      return (
        <div className="flex flex-col gap-2">
          {question.config.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="radio"
                className="h-4 w-4"
                name={`question-${question.id}`}
                checked={selected === option.id}
                disabled={disabled}
                onChange={() => onChange({ selected: option.id })}
              />
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.score} pts
              </span>
            </label>
          ))}
        </div>
      );
    }

    case 'multi_select': {
      const selected = selectedIds(value);

      return (
        <div className="flex flex-col gap-2">
          {question.config.options.map((option) => (
            <label
              key={option.id}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={selected.includes(option.id)}
                disabled={disabled}
                onChange={(event) =>
                  onChange({
                    selected: event.target.checked
                      ? [...selected, option.id]
                      : selected.filter((id) => id !== option.id),
                  })
                }
              />
              <span>{option.label}</span>
              <span className="text-xs text-muted-foreground">
                {option.score} pts
              </span>
            </label>
          ))}
        </div>
      );
    }

    case 'range': {
      const { min, max, step } = question.config;
      const current = scalarValue(value);
      const numeric = typeof current === 'number' ? current : min;

      return (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={min}
            max={max}
            step={step ?? 1}
            value={numeric}
            disabled={disabled}
            onChange={(event) =>
              onChange({ value: Number(event.target.value) })
            }
            className="w-full h-2 appearance-none rounded-full bg-muted accent-primary"
          />
          <span className="text-sm font-medium w-10 text-right">{numeric}</span>
        </div>
      );
    }

    case 'number': {
      const current = scalarValue(value);

      return (
        <Input
          type="number"
          min={question.config.min}
          max={question.config.max}
          value={current === undefined ? '' : String(current)}
          disabled={disabled}
          onChange={(event) =>
            onChange({
              // Vacío no es 0: se envía como '' y el revisor lo deja pendiente
              value:
                event.target.value === '' ? '' : Number(event.target.value),
            })
          }
        />
      );
    }

    case 'text': {
      const current = scalarValue(value);

      return (
        <Textarea
          rows={3}
          maxLength={question.config.maxLength}
          value={current === undefined ? '' : String(current)}
          disabled={disabled}
          onChange={(event) => onChange({ value: event.target.value })}
        />
      );
    }

    case 'boolean':
    default: {
      const current = scalarValue(value);

      return (
        <div className="flex gap-4 text-sm">
          {[true, false].map((option) => (
            <label
              key={String(option)}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="radio"
                className="h-4 w-4"
                name={`question-${question.id}`}
                checked={current === option}
                disabled={disabled}
                onChange={() => onChange({ value: option })}
              />
              {option ? 'Sí' : 'No'}
            </label>
          ))}
        </div>
      );
    }
  }
}
