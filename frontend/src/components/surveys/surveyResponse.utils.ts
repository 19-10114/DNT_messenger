import { AnswerValue, SurveyResponse } from '@/services/surveys/types';

/**
 * Helpers de estado de una respuesta.
 *
 * El backend puntúa siempre sobre el `totalPossibleScore` completo de la
 * versión, preguntas de staff incluidas. Mientras el revisor no las conteste,
 * `totalScore` queda bajo por construcción: no es una mala evaluación, es una
 * evaluación sin terminar. Por eso todo lo que dependa del puntaje final
 * (por ejemplo el justiprecio de una moto usada) se condiciona a `isComplete`.
 */

/**
 * `true` si ya no queda ninguna pregunta obligatoria sin responder.
 *
 * Las respuestas guardadas antes de esta funcionalidad no traen `isComplete`;
 * se asumen completas para no bloquear flujos que ya funcionaban.
 */
export function isResponseComplete(response?: SurveyResponse): boolean {
  if (!response) return false;
  return response.meta.isComplete !== false;
}

/** Preguntas de staff que el revisor todavía tiene pendientes */
export function getPendingQuestionIds(response?: SurveyResponse): number[] {
  return response?.meta.pendingQuestionIds ?? [];
}

/** `true` si el valor tiene contenido suficiente para enviarse como respuesta */
export function isAnswerFilled(value: AnswerValue | undefined): boolean {
  if (!value) return false;

  if ('selected' in value) {
    return Array.isArray(value.selected)
      ? value.selected.length > 0
      : !!value.selected;
  }

  return value.value !== '' && value.value !== undefined;
}

/** Compara dos valores de respuesta para saber si hace falta enviarlos */
export function isSameAnswerValue(
  a: AnswerValue | undefined,
  b: AnswerValue | undefined
): boolean {
  if (!a || !b) return a === b;

  if ('selected' in a && 'selected' in b) {
    if (Array.isArray(a.selected) && Array.isArray(b.selected)) {
      return (
        a.selected.length === b.selected.length &&
        a.selected.every((item, index) => item === b.selected[index])
      );
    }
    return a.selected === b.selected;
  }

  if ('value' in a && 'value' in b) return a.value === b.value;

  return false;
}
