import {
  SubmitAnswerPayload,
  SurveyResponse,
  SurveyVersion,
} from '@/services/surveys/types';
import { UsedBikeProductPrice } from '@/services/products/types/UsedBike.type';
import {
  AssignedProductCatalogEntry,
  EvaluationIssue,
  EvaluationScore,
  buildAssignedProducts,
} from '@/stores/usedBikeEvaluation/usedBikeEvaluation.store';
import {
  ISSUE_LABELS,
  defaultOptionId,
  labelOf,
  normalizeLabel,
} from './evaluationOptions';

/**
 * Reconstruye una versión renderizable a partir de una respuesta ya enviada.
 *
 * Se usa la respuesta y no la versión publicada actual porque la encuesta pudo
 * haber cambiado después: así se ve exactamente lo que se contestó.
 */
export function versionFromResponse(
  response: SurveyResponse | undefined
): SurveyVersion | null {
  if (!response) return null;

  const sections: SurveyVersion['sections'] = [];

  [...response.answers]
    .sort((a, b) => a.question.order - b.question.order)
    .forEach((answer) => {
      const existing = sections.find(
        (section) => section.section === answer.question.section
      );
      if (existing) {
        existing.questions.push(answer.question);
        return;
      }
      sections.push({
        section: answer.question.section,
        questions: [answer.question],
      });
    });

  return {
    id: response.surveyVersion,
    versionNumber: response.versionNumber,
    status: 'published',
    totalPossibleScore: response.meta.maxScore,
    createdAt: response.submittedAt,
    sections,
  };
}

/** Respuestas ya enviadas, en el formato local `questionId -> optionId` */
export function answersFromResponse(
  response: SurveyResponse | undefined
): Record<number, string> {
  if (!response) return {};

  return response.answers.reduce<Record<number, string>>((acc, answer) => {
    const selected = (answer.value as { selected?: string }).selected;
    if (selected) acc[answer.question.id] = selected;
    return acc;
  }, {});
}

/**
 * Respuestas que difieren de lo ya guardado, listas para el PATCH de revisión.
 *
 * El endpoint es un upsert: lo que no se menciona conserva su valor, así que
 * solo se envían las correcciones.
 */
export function changedAnswers(
  response: SurveyResponse | undefined,
  answers: Record<number, string>
): SubmitAnswerPayload[] {
  const saved = answersFromResponse(response);

  return Object.entries(answers)
    .filter(([questionId, optionId]) => saved[Number(questionId)] !== optionId)
    .map(([questionId, optionId]) => ({
      questionId: Number(questionId),
      value: { selected: optionId },
    }));
}

/**
 * Resuelve las respuestas finales de la etapa 1.
 * Lo que el evaluador no marcó se asume B.
 */
export function resolveStageOne(
  version: SurveyVersion,
  answers: Record<number, string>
): {
  answers: Record<number, string>;
  issues: Omit<EvaluationIssue, 'products'>[];
  score: EvaluationScore;
} {
  const resolved: Record<number, string> = {};
  const issues: Omit<EvaluationIssue, 'products'>[] = [];
  let rawScore = 0;
  let maxScore = 0;

  version.sections.forEach((section) => {
    [...section.questions]
      .sort((a, b) => a.order - b.order)
      .forEach((question) => {
        if (question.type !== 'single_select') return;

        const optionId = answers[question.id] ?? defaultOptionId(question);
        if (!optionId) return;

        resolved[question.id] = optionId;

        // Misma fórmula que el backend: puntos obtenidos sobre los posibles
        const optionScore =
          question.config.options.find((option) => option.id === optionId)
            ?.score ?? 0;
        rawScore += optionScore;
        maxScore += question.maxScore;

        const label = labelOf(question, optionId);
        if (!ISSUE_LABELS.includes(normalizeLabel(label))) return;

        issues.push({
          questionId: question.id,
          section: section.section,
          questionText: question.text,
          optionId,
          optionLabel: normalizeLabel(label),
          score: optionScore,
          maxScore: question.maxScore,
        });
      });
  });

  return { answers: resolved, issues, score: { rawScore, maxScore } };
}

/**
 * Hallazgos y puntaje de una evaluación ya enviada, sin pasar por el store.
 * Para vistas de solo lectura: el store es del asistente de dos etapas.
 */
export function evaluationFromResponse(response: SurveyResponse | undefined): {
  issues: Omit<EvaluationIssue, 'products'>[];
  score: EvaluationScore;
} {
  const version = versionFromResponse(response);
  if (!version) return { issues: [], score: { rawScore: 0, maxScore: 0 } };

  const { issues, score } = resolveStageOne(
    version,
    answersFromResponse(response)
  );
  return { issues, score };
}

/**
 * Cuelga de cada hallazgo los repuestos guardados que le corresponden.
 * @param issues - Hallazgos R/M resueltos de la respuesta
 * @param saved - `productPrices` de la moto usada; se enlazan por `questionId`
 * @param catalog - Productos resueltos por id, para poder mostrar nombres
 */
export function attachSavedProducts(
  issues: Omit<EvaluationIssue, 'products'>[],
  saved: UsedBikeProductPrice[],
  catalog?: ReadonlyMap<number, AssignedProductCatalogEntry>
): EvaluationIssue[] {
  return issues.map((issue) => ({
    ...issue,
    products: buildAssignedProducts(saved, issue.questionId, catalog),
  }));
}
