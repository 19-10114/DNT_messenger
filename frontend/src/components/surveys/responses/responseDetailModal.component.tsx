'use client';

import React, { useEffect, useState } from 'react';
import { ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { useSurveyResponse } from '@/hooks/surveys';
import {
  SurveyAnswer,
  SurveyQuestion,
  AnswerValue,
} from '@/services/surveys/types';
import { useIsStaff, useToken } from '@/stores/auth/auth.store';
import {
  getPendingQuestionIds,
  isResponseComplete,
} from '../surveyResponse.utils';
import { ResponseReview } from './responseReview.component';

interface ResponseDetailModalProps {
  responseId?: number;
  onOpenChange: (open: boolean) => void;
}

/** Convierte el `value` crudo en un texto legible según el tipo de pregunta */
export function formatAnswerValue(
  question: SurveyQuestion,
  value: AnswerValue
): string {
  switch (question.type) {
    case 'single_select': {
      const selected = (value as { selected?: string }).selected;
      const option = question.config.options.find(
        (item) => item.id === selected
      );
      return option?.label ?? selected ?? '-';
    }
    case 'multi_select': {
      const selected = (value as { selected?: string[] }).selected ?? [];
      if (!selected.length) return '-';
      return selected
        .map(
          (id) =>
            question.config.options.find((option) => option.id === id)?.label ??
            id
        )
        .join(', ');
    }
    case 'boolean': {
      const raw = (value as { value?: unknown }).value;
      return raw ? 'Sí' : 'No';
    }
    default: {
      const raw = (value as { value?: unknown }).value;
      if (raw === undefined || raw === null || raw === '') return '-';
      return String(raw);
    }
  }
}

function AnswerRow({ answer }: { answer: SurveyAnswer }) {
  return (
    <div className="rounded-md border p-3 flex flex-col gap-1">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium">{answer.question.text}</p>
        <div className="flex items-center gap-1 shrink-0">
          {answer.question.staffOnly ? (
            <Badge variant="outline" className="gap-1 whitespace-nowrap">
              <ShieldCheck className="h-3 w-3" />
              Solo staff
            </Badge>
          ) : null}
          <Badge variant="secondary" className="whitespace-nowrap">
            {answer.score} / {answer.question.maxScore} pts
          </Badge>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">{answer.question.section}</p>
      {answer.question.description ? (
        <p className="text-xs text-muted-foreground">
          {answer.question.description}
        </p>
      ) : null}
      <p className="text-sm">
        {formatAnswerValue(answer.question, answer.value)}
      </p>
    </div>
  );
}

/** Detalle de una respuesta con su puntaje por pregunta */
export function ResponseDetailModal({
  responseId,
  onOpenChange,
}: ResponseDetailModalProps) {
  const token = useToken();
  const isStaff = useIsStaff();
  const { response, isLoadingResponse, isErrorResponse } = useSurveyResponse(
    token,
    responseId
  );
  const [isReviewing, setIsReviewing] = useState(false);

  // Cada respuesta se abre en modo lectura
  useEffect(() => setIsReviewing(false), [responseId]);

  const isComplete = isResponseComplete(response);
  const pendingCount = getPendingQuestionIds(response).length;

  return (
    <Dialog open={!!responseId} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Respuesta #{responseId}
            {response && !isComplete ? (
              <Badge variant="secondary">Pendiente de revisión</Badge>
            ) : null}
          </DialogTitle>
          <DialogDescription>
            {response
              ? `${response.meta.surveyName} · versión ${response.meta.versionNumber}`
              : 'Detalle de la respuesta'}
          </DialogDescription>
        </DialogHeader>

        {isLoadingResponse ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Cargando respuesta...
          </p>
        ) : null}

        {isErrorResponse ? (
          <p className="text-sm text-destructive py-6 text-center">
            No se pudo cargar la respuesta.
          </p>
        ) : null}

        {response ? (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md border p-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {/* El puntaje siempre se mide contra el total de la versión:
                      con preguntas de staff sin responder queda bajo */}
                  {isComplete ? 'Puntaje' : 'Puntaje provisional'}
                </p>
                <p className="text-sm font-semibold">
                  {response.totalScore.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Bruto</p>
                <p className="text-sm font-semibold">
                  {response.meta.rawScore} / {response.meta.maxScore}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Respondiente</p>
                <p className="text-sm font-semibold">
                  {response.respondent ?? 'Anónimo'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Enviada</p>
                <p className="text-sm font-semibold">
                  {new Date(response.submittedAt).toLocaleString('es-VE')}
                </p>
              </div>
            </div>

            {/* Solo un usuario staff puede completar o corregir respuestas */}
            {isStaff ? (
              <div className="flex items-center justify-between gap-3 rounded-md border border-dashed p-3">
                <p className="text-xs text-muted-foreground">
                  {isComplete
                    ? 'La respuesta está completa; aún así puedes corregir lo respondido.'
                    : `Quedan ${pendingCount} pregunta(s) de staff por responder.`}
                </p>
                <Button
                  type="button"
                  variant={isReviewing ? 'outline' : 'default'}
                  size="sm"
                  onClick={() => setIsReviewing((current) => !current)}
                >
                  {isReviewing ? 'Ver respuestas' : 'Revisar'}
                </Button>
              </div>
            ) : null}

            {isReviewing ? (
              <ResponseReview response={response} />
            ) : (
              <div className="flex flex-col gap-2">
                {response.answers.map((answer) => (
                  <AnswerRow key={answer.id} answer={answer} />
                ))}
              </div>
            )}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
