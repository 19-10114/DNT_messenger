import { SurveyQuestion } from './SurveyQuestion.type';

/** Envoltorio estándar de toda respuesta de la API de encuestas */
export interface SurveyEnvelope<T> {
  message: string;
  data: T;
  errors?: unknown;
}

export type SurveyStatus = 'active' | 'archived' | string;

export type SurveyVersionStatus = 'draft' | 'published' | 'archived';

/** Grupo de preguntas dentro de una versión */
export interface SurveySection {
  section: string;
  questions: SurveyQuestion[];
}

/** Resumen de versión (listados y respuesta de publicación) */
export interface SurveyVersionSummary {
  id: number;
  versionNumber: number;
  status: SurveyVersionStatus;
  totalPossibleScore: number;
  createdAt: string;
}

/** Versión completa, con sus preguntas agrupadas por sección */
export interface SurveyVersion extends SurveyVersionSummary {
  sections: SurveySection[];
}

/** Encuesta tal como aparece en el listado */
export interface Survey {
  id: number;
  title: string;
  /**
   * Identificador legible y único para renderizar la encuesta desde una URL
   * (`/encuestas/[slug]`). El backend lo deriva del título si no se envía y
   * resuelve las colisiones con un sufijo, así que hay que leerlo de vuelta.
   */
  slug: string;
  description: string;
  status: SurveyStatus;
  requiresAuthentication: boolean;
  createdAt: string;
  updatedAt: string;
  currentVersion?: SurveyVersionSummary | null;
  responsesCount?: number;
}

/** Encuesta + una versión concreta para renderizar */
export interface SurveyDetail extends Survey {
  /** `null` si la encuesta aún no tiene ninguna versión publicada */
  version: SurveyVersion | null;
}
