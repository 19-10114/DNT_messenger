/**
 * Catálogo de tipos de pregunta de encuestas.
 * La API de encuestas viaja en camelCase,
 * por eso estos tipos no requieren mapeo snake_case <-> camelCase.
 */

export type QuestionType =
  | 'single_select'
  | 'multi_select'
  | 'range'
  | 'number'
  | 'text'
  | 'boolean';

export interface SelectOption {
  id: string;
  label: string;
  score: number;
}

/** Configuración de `single_select`: se elige exactamente una opción */
export interface SingleSelectConfig {
  options: SelectOption[];
}

/** Configuración de `multi_select`: se eligen varias opciones */
export interface MultiSelectConfig {
  options: SelectOption[];
  minSelections?: number;
  maxSelections?: number;
}

/** Configuración de `range`: un valor dentro de una escala acotada */
export interface RangeConfig {
  min: number;
  max: number;
  step?: number;
  minScore?: number;
  maxScore?: number;
}

/** Configuración de `number`: entrada numérica libre */
export interface NumberConfig {
  min?: number;
  max?: number;
  score?: number;
}

/** Configuración de `text`: texto libre */
export interface TextConfig {
  maxLength?: number;
  score?: number;
}

/** Configuración de `boolean`: sí / no */
export interface BooleanConfig {
  trueScore?: number;
  falseScore?: number;
}

/** Mapa tipo de pregunta -> forma de su `config` */
export interface QuestionConfigByType {
  single_select: SingleSelectConfig;
  multi_select: MultiSelectConfig;
  range: RangeConfig;
  number: NumberConfig;
  text: TextConfig;
  boolean: BooleanConfig;
}

export type QuestionConfig = QuestionConfigByType[QuestionType];

interface BaseQuestion<T extends QuestionType> {
  id: number;
  text: string;
  /** Texto de ayuda bajo el enunciado; `''` cuando no se definió */
  description: string;
  section: string;
  type: T;
  config: QuestionConfigByType[T];
  /** Derivado por el backend a partir de `config`. Nunca se envía. */
  maxScore: number;
  /**
   * Pregunta interna: no forma parte del formulario del respondiente y solo
   * la contesta un revisor con permisos de staff. El backend la omite del
   * payload para quien no es staff, así que no hay que filtrarla en el cliente.
   */
  staffOnly: boolean;
  order: number;
  required: boolean;
  createdAt?: string;
}

/**
 * Pregunta tal como la devuelve el backend.
 * Unión discriminada por `type` para poder estrechar el tipo de `config`.
 */
export type SurveyQuestion = {
  [K in QuestionType]: BaseQuestion<K>;
}[QuestionType];

/** Definición de una pregunta al crear/editar (sin `id` ni `maxScore`) */
export interface QuestionDefinition<T extends QuestionType = QuestionType> {
  text: string;
  /** Opcional; el backend la guarda como `''` si no viene */
  description?: string;
  section: string;
  type: T;
  config: QuestionConfigByType[T];
  /** Opcional; por defecto `false` */
  staffOnly?: boolean;
  order?: number;
  required?: boolean;
}

/* ------------------------------- Respuestas ------------------------------- */

export interface SingleSelectAnswerValue {
  selected: string;
}

export interface MultiSelectAnswerValue {
  selected: string[];
}

export interface ScalarAnswerValue {
  value: number | string | boolean;
}

/** Valor de una respuesta, con la forma que exige el `type` de la pregunta */
export type AnswerValue =
  | SingleSelectAnswerValue
  | MultiSelectAnswerValue
  | ScalarAnswerValue;

/** Etiquetas en español para cada tipo de pregunta */
export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single_select: 'Selección simple',
  multi_select: 'Selección múltiple',
  range: 'Escala (slider)',
  number: 'Número',
  text: 'Texto libre',
  boolean: 'Sí / No',
};
