'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Input } from '@/components/ui/input.component';
import { Textarea } from '@/components/ui/textarea.component';
import { SurveyQuestion } from '@/services/surveys/types';
import { DraftQuestion } from '../builder/surveyDraft';

/** La vista previa acepta tanto preguntas del backend como del borrador */
export type RenderableQuestion = SurveyQuestion | DraftQuestion;

interface QuestionRendererProps {
  question: RenderableQuestion;
  position: number;
  /** Puntaje máximo a mostrar; en el borrador es una estimación local */
  maxScore?: number;
  showScores?: boolean;
}

/**
 * Render de una pregunta en modo lectura, con los controles reales
 * deshabilitados. Sirve para previsualizar cómo se verá la encuesta.
 */
export function QuestionRenderer({
  question,
  position,
  maxScore,
  showScores = true,
}: QuestionRendererProps) {
  const renderControl = () => {
    switch (question.type) {
      case 'single_select':
        return (
          <div className="flex flex-col gap-2">
            {question.config.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <input type="radio" disabled className="h-4 w-4" />
                <span>{option.label || <em>(sin texto)</em>}</span>
                {showScores && option.score !== 0 ? (
                  <Badge variant="outline">{option.score} pts</Badge>
                ) : null}
              </label>
            ))}
          </div>
        );

      case 'multi_select':
        return (
          <div className="flex flex-col gap-2">
            {question.config.options.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <input type="checkbox" disabled className="h-4 w-4" />
                <span>{option.label || <em>(sin texto)</em>}</span>
                {showScores && option.score !== 0 ? (
                  <Badge variant="outline">{option.score} pts</Badge>
                ) : null}
              </label>
            ))}
            {question.config.minSelections || question.config.maxSelections ? (
              <p className="text-xs text-muted-foreground">
                Selecciona
                {question.config.minSelections
                  ? ` al menos ${question.config.minSelections}`
                  : ''}
                {question.config.minSelections && question.config.maxSelections
                  ? ' y'
                  : ''}
                {question.config.maxSelections
                  ? ` como máximo ${question.config.maxSelections}`
                  : ''}
                {' opción(es).'}
              </p>
            ) : null}
          </div>
        );

      case 'range': {
        const { min, max, step } = question.config;
        return (
          <div className="flex flex-col gap-1">
            <input
              type="range"
              min={min}
              max={max}
              step={step ?? 1}
              defaultValue={min}
              disabled
              className="w-full h-2 appearance-none rounded-full bg-muted accent-primary cursor-not-allowed"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{min}</span>
              <span>{max}</span>
            </div>
          </div>
        );
      }

      case 'number':
        return (
          <Input
            type="number"
            disabled
            placeholder={
              question.config.min !== undefined ||
              question.config.max !== undefined
                ? `Entre ${question.config.min ?? '-∞'} y ${
                    question.config.max ?? '∞'
                  }`
                : 'Respuesta numérica'
            }
          />
        );

      case 'text':
        return (
          <Textarea
            disabled
            placeholder="Respuesta abierta"
            maxLength={question.config.maxLength}
          />
        );

      case 'boolean':
      default:
        return (
          <div className="flex gap-4 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              <input type="radio" disabled className="h-4 w-4" />
              Sí
              {showScores && question.config.trueScore ? (
                <Badge variant="outline">{question.config.trueScore} pts</Badge>
              ) : null}
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" disabled className="h-4 w-4" />
              No
              {showScores && question.config.falseScore ? (
                <Badge variant="outline">
                  {question.config.falseScore} pts
                </Badge>
              ) : null}
            </label>
          </div>
        );
    }
  };

  return (
    <div className="rounded-md border bg-background p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">
          {position}. {question.text || <em>(sin enunciado)</em>}
          {question.required ? (
            <span className="text-destructive ml-1">*</span>
          ) : null}
        </p>
        <div className="flex items-center gap-1 shrink-0">
          {question.staffOnly ? (
            <Badge variant="outline" className="gap-1 whitespace-nowrap">
              <ShieldCheck className="h-3 w-3" />
              Solo staff
            </Badge>
          ) : null}
          {showScores && maxScore !== undefined ? (
            <Badge variant="secondary" className="whitespace-nowrap">
              máx. {maxScore} pts
            </Badge>
          ) : null}
        </div>
      </div>
      {question.description ? (
        <p className="text-xs text-muted-foreground -mt-2">
          {question.description}
        </p>
      ) : null}
      {renderControl()}
    </div>
  );
}
