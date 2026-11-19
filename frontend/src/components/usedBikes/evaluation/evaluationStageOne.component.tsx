'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { cn } from '@/lib/utils';
import { SurveyQuestion, SurveyVersion } from '@/services/surveys/types';
import { optionStyle } from './evaluationOptions';

interface EvaluationStageOneProps {
  version: SurveyVersion;
  answers: Record<number, string>;
  /** La evaluación ya enviada no se edita */
  readOnly?: boolean;
  onSelect: (questionId: number, optionId: string) => void;
}

interface QuestionRowProps {
  question: SurveyQuestion;
  selected?: string;
  readOnly: boolean;
  onSelect: (questionId: number, optionId: string) => void;
}

function QuestionRow({
  question,
  selected,
  readOnly,
  onSelect,
}: QuestionRowProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-b border-gray-200 last:border-b-0">
      <p className="text-sm">
        {question.text}
        {question.required ? (
          <span className="text-destructive ml-1">*</span>
        ) : null}
        {question.maxScore ? (
          <span className="ml-2 text-xs text-gray-400">
            {question.maxScore}pts
          </span>
        ) : null}
      </p>

      {question.type === 'single_select' ? (
        <div className="flex items-center gap-2 shrink-0">
          {question.config.options.map((option) => {
            const style = optionStyle(option.label);
            const isSelected = selected === option.id;

            return (
              <button
                key={option.id}
                type="button"
                disabled={readOnly}
                onClick={() => onSelect(question.id, option.id)}
                className={cn(
                  'h-9 min-w-[2.5rem] rounded-md border px-3 text-sm font-semibold transition-colors',
                  isSelected ? style.active : style.idle,
                  // En lectura se conserva el color, pero sin afordancia de
                  // click. La seleccionada mantiene su fondo: limpiarlo dejaba
                  // el texto blanco sobre transparente al pasar el mouse.
                  readOnly && 'cursor-default',
                  readOnly && !isSelected && 'opacity-40 hover:bg-transparent'
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground italic shrink-0">
          Tipo de pregunta no soportado en esta vista
        </span>
      )}
    </div>
  );
}

/** Etapa 1: cuestionario de estado de la unidad */
export function EvaluationStageOne({
  version,
  answers,
  readOnly = false,
  onSelect,
}: EvaluationStageOneProps) {
  return (
    <div className="flex flex-col gap-4">
      {version.sections.map((section) => (
        <Card key={section.section} className="overflow-hidden">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">{section.section}</CardTitle>
          </CardHeader>
          <CardContent>
            {[...section.questions]
              .sort((a, b) => a.order - b.order)
              .map((question) => (
                <QuestionRow
                  key={question.id}
                  question={question}
                  selected={answers[question.id]}
                  readOnly={readOnly}
                  onSelect={onSelect}
                />
              ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
