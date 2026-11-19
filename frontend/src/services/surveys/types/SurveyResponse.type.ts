import { AnswerValue, SurveyQuestion } from './SurveyQuestion.type';

/** Snapshot autocontenido que el backend guarda junto a la respuesta */
export interface SurveyResponseMeta {
  surveyName: string;
  versionNumber: number;
  rawScore: number;
  maxScore: number;
  /**
   * Preguntas de staff todavía sin responder: la lista de pendientes del
   * revisor. Ausente en respuestas guardadas antes de esta funcionalidad.
   */
  pendingQuestionIds?: number[];
  /** `false` mientras quede alguna pregunta obligatoria sin responder */
  isComplete?: boolean;
  /** Último revisor que hizo un PATCH sobre la respuesta */
  reviewedBy?: number | null;
  reviewedByUsername?: string | null;
  reviewedAt?: string | null;
}

export interface SurveyAnswer {
  id: number;
  question: SurveyQuestion;
  value: AnswerValue;
  /** Puntaje calculado por el backend */
  score: number;
}

export interface SurveyResponse {
  id: number;
  survey: number;
  surveyVersion: number;
  versionNumber: number;
  /** `null` en envíos anónimos */
  respondent: number | null;
  /** Porcentaje 0-100 sobre el `totalPossibleScore` de la versión */
  totalScore: number;
  meta: SurveyResponseMeta;
  submittedAt: string;
  answers: SurveyAnswer[];
}
