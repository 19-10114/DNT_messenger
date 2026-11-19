'use client';

import React from 'react';

import { Input } from '@/components/ui/input.component';
import { QuestionConfig } from '@/services/surveys/types';
import { DraftQuestion } from './surveyDraft';
import { OptionsEditor } from './optionsEditor.component';

interface QuestionConfigEditorProps {
  question: DraftQuestion;
  onChange: (config: QuestionConfig) => void;
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

/** Convierte el valor de un input numérico opcional a número o `undefined` */
function toOptionalNumber(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Editor de la `config` de una pregunta. Cada tipo tiene su propio formulario,
 * con las mismas claves camelCase que espera el backend.
 */
export function QuestionConfigEditor({
  question,
  onChange,
}: QuestionConfigEditorProps) {
  switch (question.type) {
    case 'single_select':
      return (
        <OptionsEditor
          options={question.config.options}
          onChange={(options) => onChange({ options })}
        />
      );

    case 'multi_select': {
      const config = question.config;
      return (
        <div className="flex flex-col gap-4">
          <OptionsEditor
            options={config.options}
            onChange={(options) => onChange({ ...config, options })}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Mínimo de selecciones" hint="Opcional">
              <Input
                type="number"
                value={config.minSelections ?? ''}
                onChange={(event) =>
                  onChange({
                    ...config,
                    minSelections: toOptionalNumber(event.target.value),
                  })
                }
                className="h-9"
              />
            </Field>
            <Field
              label="Máximo de selecciones"
              hint="Define el puntaje máximo de la pregunta"
            >
              <Input
                type="number"
                value={config.maxSelections ?? ''}
                onChange={(event) =>
                  onChange({
                    ...config,
                    maxSelections: toOptionalNumber(event.target.value),
                  })
                }
                className="h-9"
              />
            </Field>
          </div>
        </div>
      );
    }

    case 'range': {
      const config = question.config;
      return (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Mínimo">
            <Input
              type="number"
              value={config.min}
              onChange={(event) =>
                onChange({ ...config, min: Number(event.target.value) || 0 })
              }
              className="h-9"
            />
          </Field>
          <Field label="Máximo">
            <Input
              type="number"
              value={config.max}
              onChange={(event) =>
                onChange({ ...config, max: Number(event.target.value) || 0 })
              }
              className="h-9"
            />
          </Field>
          <Field label="Paso">
            <Input
              type="number"
              value={config.step ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  step: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Puntaje en el mínimo">
            <Input
              type="number"
              value={config.minScore ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  minScore: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Puntaje en el máximo">
            <Input
              type="number"
              value={config.maxScore ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  maxScore: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
        </div>
      );
    }

    case 'number': {
      const config = question.config;
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Mínimo" hint="Opcional">
            <Input
              type="number"
              value={config.min ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  min: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Máximo" hint="Opcional">
            <Input
              type="number"
              value={config.max ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  max: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Puntaje" hint="0 = pregunta informativa">
            <Input
              type="number"
              value={config.score ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  score: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
        </div>
      );
    }

    case 'text': {
      const config = question.config;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Largo máximo" hint="Opcional">
            <Input
              type="number"
              value={config.maxLength ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  maxLength: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Puntaje" hint="Se otorga si la respuesta no está vacía">
            <Input
              type="number"
              value={config.score ?? ''}
              onChange={(event) =>
                onChange({
                  ...config,
                  score: toOptionalNumber(event.target.value),
                })
              }
              className="h-9"
            />
          </Field>
        </div>
      );
    }

    case 'boolean':
    default: {
      const config = question.config;
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field label="Puntaje si responde Sí">
            <Input
              type="number"
              value={config.trueScore ?? 0}
              onChange={(event) =>
                onChange({
                  ...config,
                  trueScore: Number(event.target.value) || 0,
                })
              }
              className="h-9"
            />
          </Field>
          <Field label="Puntaje si responde No">
            <Input
              type="number"
              value={config.falseScore ?? 0}
              onChange={(event) =>
                onChange({
                  ...config,
                  falseScore: Number(event.target.value) || 0,
                })
              }
              className="h-9"
            />
          </Field>
        </div>
      );
    }
  }
}
