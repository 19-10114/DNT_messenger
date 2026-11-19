import { AnswerValue, QuestionDefinition } from './SurveyQuestion.type';

/** POST /surveys/ — crea la encuesta y su primera versión (draft v1) */
export interface CreateSurveyPayload {
  title: string;
  /** Sin él, el backend lo deriva del título */
  slug?: string;
  description: string;
  requiresAuthentication?: boolean;
  questions: QuestionDefinition[];
}

/**
 * Pregunta "editada": el backend crea una pregunta nueva que reemplaza a
 * `fromQuestionId`. Hay que enviar la definición completa, no un parcial.
 */
export interface UpdatedQuestionDefinition extends QuestionDefinition {
  fromQuestionId: number;
}

/**
 * PATCH /surveys/<id> — dos mitades independientes en la misma llamada:
 *
 * - El diff de preguntas (`deleted` / `updated` / `added`) construye una nueva
 *   versión draft; las preguntas no mencionadas se reutilizan sin cambios.
 * - Los datos generales (`title`, `slug`, `description`,
 *   `requiresAuthentication`) se aplican en el momento y **no** generan versión.
 *
 * Se puede enviar cualquiera de las dos, o ambas, pero no ninguna.
 * Renombrar el `title` no recalcula el `slug`: hay que mandarlo aparte, con la
 * advertencia de que los enlaces publicados dejan de resolver.
 */
export interface BulkEditSurveyPayload {
  deleted?: number[];
  updated?: UpdatedQuestionDefinition[];
  added?: QuestionDefinition[];
  title?: string;
  slug?: string;
  description?: string;
  requiresAuthentication?: boolean;
}

export interface SubmitAnswerPayload {
  questionId: number;
  value: AnswerValue;
}

/**
 * De dónde llegó una respuesta. Hoy solo las páginas públicas lo envían; el
 * backend lo guarda en `meta.source`.
 */
export interface SurveyResponseSource {
  type: 'page';
  slug: string;
}

/** POST /surveys/<id>/responses — siempre contra la versión publicada actual */
export interface SubmitResponsePayload {
  answers: SubmitAnswerPayload[];
  source?: SurveyResponseSource;
}

/**
 * PATCH /surveys/responses/<id> — revisión de staff.
 *
 * Es un upsert: las preguntas que no se mencionan conservan su respuesta y
 * las que ya tenían una se sobrescriben. Nada se borra. Tras aplicarlo el
 * backend vuelve a puntuar la respuesta completa.
 */
export interface UpdateResponsePayload {
  answers: SubmitAnswerPayload[];
}

export interface GetSurveysQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export interface GetResponsesQueryParams {
  page?: number;
  pageSize?: number;
  version?: number;
}
