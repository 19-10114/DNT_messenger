'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Save, ShieldCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { useToast } from '@/components/ui/use-toast';
import { useSurveyVersion, useUpdateSurveyResponse } from '@/hooks/surveys';
import { cn } from '@/lib/utils';
import {
  AnswerValue,
  SubmitAnswerPayload,
  SurveyQuestion,
  SurveyResponse,
} from '@/services/surveys/types';
import { useToken } from '@/stores/auth/auth.store';
import { getSurveyErrorMessage } from '../surveyError';
import {
  getPendingQuestionIds,
  isAnswerFilled,
  isResponseComplete,
  isSameAnswerValue,
} from '../surveyResponse.utils';
import { AnswerInput } from './answerInput.component';

interface ResponseReviewProps {
  response: SurveyResponse;
  /** Se dispara con la respuesta ya recalculada por el backend */
  onSaved?: (response: SurveyResponse) => void;
  className?: string;
}

/** Respuestas ya guardadas, indexadas por pregunta */
function answersByQuestion(
  response: SurveyResponse
): Record<number, AnswerValue> {
  return response.answers.reduce<Record<number, AnswerValue>>(
    (accumulator, answer) => {
      accumulator[answer.question.id] = answer.value;
      return accumulator;
    },
    {}
  );
}

/**
 * Revisión de staff de una respuesta enviada.
 *
 * Las preguntas de staff sin responder no vienen en la respuesta —solo sus ids
 * en `meta.pendingQuestionIds`—, así que el cuestionario se toma de la versión,
 * que para un usuario staff sí las incluye.
 *
 * El PATCH es un upsert: se envía únicamente lo que cambió y el backend vuelve
 * a puntuar la respuesta completa.
 */
export function ResponseReview({
  response,
  onSaved,
  className,
}: ResponseReviewProps) {
  const token = useToken();
  const { toast } = useToast();

  const { version, isLoadingVersion, isErrorVersion } = useSurveyVersion(
    token,
    response.survey,
    response.versionNumber
  );
  const { updateResponse, isUpdatingResponse } = useUpdateSurveyResponse(token);

  const saved = useMemo(() => answersByQuestion(response), [response]);
  const [draft, setDraft] = useState<Record<number, AnswerValue>>(saved);

  // Tras guardar, la respuesta recalculada llega por props y reemplaza el borrador
  useEffect(() => setDraft(saved), [saved]);

  const pendingIds = getPendingQuestionIds(response);
  const isComplete = isResponseComplete(response);

  /** Solo lo que cambió respecto de lo guardado y tiene contenido */
  const changedAnswers: SubmitAnswerPayload[] = Object.entries(draft)
    .filter(
      ([questionId, value]) =>
        isAnswerFilled(value) && !isSameAnswerValue(value, saved[+questionId])
    )
    .map(([questionId, value]) => ({ questionId: Number(questionId), value }));

  const handleSave = async () => {
    if (!changedAnswers.length) {
      toast({
        title: 'Sin cambios',
        description: 'No hay respuestas nuevas ni corregidas que guardar.',
      });
      return;
    }

    try {
      const updated = await updateResponse({
        responseId: response.id,
        answers: changedAnswers,
      });

      toast({
        title: 'Revisión guardada',
        description: updated.meta.isComplete
          ? `La respuesta quedó completa: ${updated.totalScore.toFixed(1)}%.`
          : `Quedan ${
              updated.meta.pendingQuestionIds?.length ?? 0
            } pregunta(s) por responder.`,
      });
      onSaved?.(updated);
    } catch (error) {
      toast({
        title: 'No se pudo guardar la revisión',
        description: getSurveyErrorMessage(
          error,
          'Ocurrió un error al guardar las respuestas.'
        ),
        variant: 'destructive',
      });
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const isPending = pendingIds.includes(question.id);

    return (
      <div
        key={question.id}
        className={cn(
          'rounded-md border p-3 flex flex-col gap-2',
          question.staffOnly && 'border-primary/40 bg-primary/5'
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-medium">
            {question.text}
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
            {isPending ? (
              <Badge variant="secondary" className="whitespace-nowrap">
                Pendiente
              </Badge>
            ) : null}
            <Badge variant="outline" className="whitespace-nowrap">
              máx. {question.maxScore} pts
            </Badge>
          </div>
        </div>

        {question.description ? (
          <p className="text-xs text-muted-foreground">
            {question.description}
          </p>
        ) : null}

        <AnswerInput
          question={question}
          value={draft[question.id]}
          disabled={isUpdatingResponse}
          onChange={(value) =>
            setDraft((current) => ({ ...current, [question.id]: value }))
          }
        />
      </div>
    );
  };

  if (isLoadingVersion) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        Cargando el cuestionario de revisión...
      </p>
    );
  }

  if (isErrorVersion || !version) {
    return (
      <p className="text-sm text-destructive py-4 text-center">
        No se pudo cargar el cuestionario de esta versión.
      </p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="rounded-md border border-dashed p-3 flex flex-col gap-1">
        <p className="text-sm font-medium">
          {isComplete
            ? 'Revisión completa'
            : `Revisión pendiente · ${pendingIds.length} pregunta(s) sin responder`}
        </p>
        <p className="text-xs text-muted-foreground">
          {isComplete
            ? `Puntaje final: ${response.totalScore.toFixed(1)}% (${
                response.meta.rawScore
              } de ${response.meta.maxScore} pts).`
            : `El puntaje se calcula siempre sobre los ${response.meta.maxScore} pts de la versión, así que el ${response.totalScore.toFixed(
                1
              )}% actual es provisional hasta terminar la revisión.`}
        </p>
        {response.meta.reviewedByUsername ? (
          <p className="text-xs text-muted-foreground">
            Última revisión: {response.meta.reviewedByUsername}
            {response.meta.reviewedAt
              ? ` · ${new Date(response.meta.reviewedAt).toLocaleString(
                  'es-VE'
                )}`
              : ''}
          </p>
        ) : null}
      </div>

      {version.sections.map((section) => (
        <div key={section.section} className="flex flex-col gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {section.section}
          </h4>
          {[...section.questions]
            .sort((a, b) => a.order - b.order)
            .map(renderQuestion)}
        </div>
      ))}

      <div className="flex items-center justify-end gap-3">
        <span className="text-xs text-muted-foreground">
          {changedAnswers.length} respuesta(s) por guardar
        </span>
        <Button
          type="button"
          onClick={handleSave}
          disabled={isUpdatingResponse || !changedAnswers.length}
        >
          <Save className="h-4 w-4 mr-1" />
          {isUpdatingResponse ? 'Guardando...' : 'Guardar revisión'}
        </Button>
      </div>
    </div>
  );
}

interface ResponseReviewModalProps {
  /** Sin respuesta el modal queda cerrado */
  response?: SurveyResponse;
  title?: string;
  onOpenChange: (open: boolean) => void;
  onSaved?: (response: SurveyResponse) => void;
}

/** La misma revisión, en un modal, para abrirla desde otro flujo */
export function ResponseReviewModal({
  response,
  title = 'Revisión de la respuesta',
  onOpenChange,
  onSaved,
}: ResponseReviewModalProps) {
  return (
    <Dialog open={!!response} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Completa las preguntas internas y corrige lo que haga falta. Al
            guardar, el backend vuelve a puntuar la respuesta.
          </DialogDescription>
        </DialogHeader>

        {response ? (
          <ResponseReview response={response} onSaved={onSaved} />
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
