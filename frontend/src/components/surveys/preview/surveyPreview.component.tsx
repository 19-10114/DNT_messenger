'use client';

import React from 'react';

import { Badge } from '@/components/ui/badge.component';
import { SurveyVersion } from '@/services/surveys/types';
import {
  DraftQuestion,
  DraftSection,
  estimateMaxScore,
  estimateTotalPossibleScore,
  groupDraftBySections,
} from '../builder/surveyDraft';
import {
  QuestionRenderer,
  RenderableQuestion,
} from './questionRenderer.component';

interface PreviewSection {
  section: string;
  questions: RenderableQuestion[];
}

interface SurveyPreviewProps {
  title: string;
  description?: string;
  sections: PreviewSection[];
  totalPossibleScore: number;
  /** `true` cuando el puntaje se calculó en el cliente (borrador sin guardar) */
  isEstimated?: boolean;
}

function resolveMaxScore(question: RenderableQuestion): number {
  if ('maxScore' in question) return question.maxScore;
  return estimateMaxScore(question);
}

/** Render en modo lectura de una versión de encuesta */
export function SurveyPreview({
  title,
  description,
  sections,
  totalPossibleScore,
  isEstimated = false,
}: SurveyPreviewProps) {
  let position = 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant="secondary">
            Puntaje total {isEstimated ? 'estimado' : ''}: {totalPossibleScore}
          </Badge>
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
        {isEstimated ? (
          <p className="text-xs text-muted-foreground">
            Los puntajes mostrados son una estimación local; el valor definitivo
            lo calcula el servidor al guardar.
          </p>
        ) : null}
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          Esta versión no tiene preguntas.
        </p>
      ) : (
        sections.map((section) => (
          <div key={section.section} className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {section.section}
            </h3>
            <div className="flex flex-col gap-3">
              {section.questions.map((question) => {
                position += 1;
                return (
                  <QuestionRenderer
                    key={
                      'id' in question
                        ? `q-${question.id}`
                        : (question as DraftQuestion).localId
                    }
                    question={question}
                    position={position}
                    maxScore={resolveMaxScore(question)}
                  />
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

interface VersionPreviewProps {
  title: string;
  description?: string;
  version: SurveyVersion | null | undefined;
}

/** Vista previa a partir de una versión devuelta por el backend */
export function SurveyVersionPreview({
  title,
  description,
  version,
}: VersionPreviewProps) {
  if (!version) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No hay ninguna versión para mostrar.
      </p>
    );
  }

  return (
    <SurveyPreview
      title={title}
      description={description}
      sections={version.sections.map((section) => ({
        section: section.section,
        questions: [...section.questions].sort((a, b) => a.order - b.order),
      }))}
      totalPossibleScore={version.totalPossibleScore}
    />
  );
}

interface DraftPreviewProps {
  title: string;
  description?: string;
  draft: DraftQuestion[];
  sections: DraftSection[];
}

/** Vista previa a partir del borrador en edición */
export function SurveyDraftPreview({
  title,
  description,
  draft,
  sections,
}: DraftPreviewProps) {
  return (
    <SurveyPreview
      title={title}
      description={description}
      sections={groupDraftBySections(draft, sections)}
      totalPossibleScore={estimateTotalPossibleScore(draft)}
      isEstimated
    />
  );
}
