'use client';

import React, { useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useSubmitSurveyResponse, useSurveyBySlug } from '@/hooks/surveys';
import { useToken } from '@/stores/auth/auth.store';
import { AnswerValue, SurveyQuestion } from '@/services/surveys/types';
import { isAnswerFilled } from '@/components/surveys/surveyResponse.utils';
import { getSurveyErrorMessage } from '@/components/surveys/surveyError';
import { BlockRenderProps } from '../blockContext';
import { Reveal } from '../shared.component';
import { PublicAnswerInput } from './publicAnswerInput.component';

const AUTO_ADVANCE_MS = 380;

function submitErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.status === 429) {
    return 'Recibimos muchas respuestas desde tu conexión. Intenta de nuevo más tarde.';
  }
  return getSurveyErrorMessage(
    error,
    'No pudimos enviar tus respuestas. Intenta de nuevo.'
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-[var(--pg-radius)] border border-[var(--pg-border)] bg-[var(--pg-surface)] shadow-xl">
      {children}
    </div>
  );
}

function Thanks({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-4 px-6 py-14 text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 14, delay: 0.1 }}
      >
        <CheckCircle2 className="h-16 w-16 text-[var(--pg-primary)]" />
      </motion.div>
      <p className="max-w-md whitespace-pre-line text-xl font-semibold text-[var(--pg-fg)]">
        {text}
      </p>
    </motion.div>
  );
}

function QuestionTitle({
  question,
  index,
  total,
}: {
  question: SurveyQuestion;
  index: number;
  total: number;
}) {
  return (
    <div className="mb-5 flex flex-col gap-1.5">
      <span className="text-sm font-semibold uppercase tracking-wider text-[var(--pg-primary)]">
        {index + 1} de {total}
      </span>
      <h3 className="text-2xl font-bold leading-snug text-[var(--pg-fg)]">
        {question.text}
        {!question.required && (
          <span className="ml-2 text-sm font-normal text-[var(--pg-muted)]">
            (opcional)
          </span>
        )}
      </h3>
      {question.description && (
        <p className="text-[var(--pg-muted)]">{question.description}</p>
      )}
    </div>
  );
}

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-full bg-[var(--pg-primary)] px-6 py-3 text-base font-semibold text-[var(--pg-primary-fg)] shadow-md transition-all hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-40';

export function SurveyBlockRender({ block, ctx }: BlockRenderProps<'survey'>) {
  const { surveyId, title, intro, thanks, buttonLabel } = block.config;
  const ref = ctx.surveys[surveyId];
  const isPreview = ctx.mode === 'preview';
  // En la vista previa del editor hay sesión; en la página pública no
  const token = useToken();
  const { survey, isLoadingSurvey, isErrorSurvey } = useSurveyBySlug(
    ref?.slug,
    isPreview ? token : undefined
  );
  const { submitResponse, isSubmittingResponse } =
    useSubmitSurveyResponse(undefined);

  const questions = useMemo(
    () =>
      (survey?.version?.sections ?? [])
        .flatMap((section) => section.questions)
        // Igual que lo ve un visitante: sin preguntas internas
        .filter((question) => !question.staffOnly),
    [survey]
  );

  const [answers, setAnswers] = useState<Record<number, AnswerValue>>({});
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const advanceTimer = useRef<number>();

  if (!ref) return null;

  const missingRequired = questions.filter(
    (question) => question.required && !isAnswerFilled(answers[question.id])
  );

  const submit = async () => {
    setError(null);
    if (missingRequired.length > 0) {
      setError('Responde las preguntas obligatorias antes de enviar.');
      return;
    }
    if (isPreview) {
      setDone(true);
      return;
    }
    try {
      await submitResponse({
        surveyId,
        answers: questions
          .filter((question) => isAnswerFilled(answers[question.id]))
          .map((question) => ({
            questionId: question.id,
            value: answers[question.id],
          })),
        source: { type: 'page', slug: ctx.pageSlug },
      });
      setDone(true);
    } catch (submitError) {
      setError(submitErrorMessage(submitError));
    }
  };

  const setAnswer = (questionId: number, value: AnswerValue) => {
    setError(null);
    setAnswers((current) => ({ ...current, [questionId]: value }));
  };

  const header = (title || intro) && (
    <div className="mb-8 flex flex-col items-center gap-3 text-center">
      {title && (
        <h2 className="text-3xl font-bold tracking-tight text-[var(--pg-fg)] page-md:text-4xl">
          {title}
        </h2>
      )}
      {intro && (
        <p className="max-w-xl text-lg text-[var(--pg-muted)]">{intro}</p>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (isLoadingSurvey) {
    body = (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--pg-muted)]" />
      </div>
    );
  } else if (isErrorSurvey || questions.length === 0) {
    body = (
      <p className="px-6 py-12 text-center text-[var(--pg-muted)]">
        {isPreview
          ? 'Esta encuesta no se puede mostrar: revisa que esté publicada y sea anónima.'
          : 'Esta encuesta no está disponible por ahora.'}
      </p>
    );
  } else if (done) {
    body = <Thanks text={thanks} />;
  } else if (block.variant === 'inline') {
    body = (
      <div className="flex flex-col gap-8 p-6 page-md:p-9">
        {questions.map((question, index) => (
          <div key={question.id}>
            <QuestionTitle
              question={question}
              index={index}
              total={questions.length}
            />
            <PublicAnswerInput
              question={question}
              value={answers[question.id]}
              onChange={(value) => setAnswer(question.id, value)}
            />
          </div>
        ))}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="button"
          className={primaryButton}
          disabled={isSubmittingResponse}
          onClick={submit}
        >
          {isSubmittingResponse && <Loader2 className="h-4 w-4 animate-spin" />}
          {buttonLabel || 'Enviar'}
        </button>
      </div>
    );
  } else {
    const question = questions[Math.min(step, questions.length - 1)];
    const isLast = step >= questions.length - 1;
    const canContinue =
      !question.required || isAnswerFilled(answers[question.id]);
    const go = (delta: number) => {
      window.clearTimeout(advanceTimer.current);
      setDirection(delta);
      setStep((current) =>
        Math.max(0, Math.min(questions.length - 1, current + delta))
      );
    };
    body = (
      <>
        <div className="h-1.5 bg-[var(--pg-border)]">
          <motion.div
            className="h-full bg-[var(--pg-primary)]"
            animate={{ width: `${((step + 1) / questions.length) * 100}%` }}
            transition={{ ease: 'easeOut', duration: 0.4 }}
          />
        </div>
        <div className="relative min-h-[320px] overflow-hidden p-6 page-md:p-9">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={question.id}
              custom={direction}
              initial={{ opacity: 0, x: direction * 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -40 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <QuestionTitle
                question={question}
                index={step}
                total={questions.length}
              />
              <PublicAnswerInput
                question={question}
                value={answers[question.id]}
                onChange={(value) => setAnswer(question.id, value)}
                onPicked={
                  isLast
                    ? undefined
                    : () => {
                        window.clearTimeout(advanceTimer.current);
                        advanceTimer.current = window.setTimeout(
                          () => go(1),
                          AUTO_ADVANCE_MS
                        );
                      }
                }
              />
            </motion.div>
          </AnimatePresence>
          {error && (
            <p className="mt-4 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[var(--pg-border)] px-6 py-4 page-md:px-9">
          <button
            type="button"
            onClick={() => go(-1)}
            className={cn(
              'inline-flex items-center gap-1.5 text-sm font-medium text-[var(--pg-muted)] transition-opacity',
              step === 0 && 'pointer-events-none opacity-0'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>
          {isLast ? (
            <button
              type="button"
              className={primaryButton}
              disabled={!canContinue || isSubmittingResponse}
              onClick={submit}
            >
              {isSubmittingResponse && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              {buttonLabel || 'Enviar'}
            </button>
          ) : (
            <button
              type="button"
              className={primaryButton}
              disabled={!canContinue}
              onClick={() => go(1)}
            >
              Siguiente
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </>
    );
  }

  return (
    <section
      className={cn(
        'px-5 py-12 page-md:px-8 page-md:py-16',
        isPreview && 'scroll-mt-4'
      )}
    >
      <Reveal enabled={!isPreview}>
        {header}
        <Card>{body}</Card>
        {isPreview && !done && (
          <p className="mt-3 text-center text-xs text-[var(--pg-muted)]">
            Vista previa: al enviar no se guarda ninguna respuesta.
          </p>
        )}
      </Reveal>
    </section>
  );
}
