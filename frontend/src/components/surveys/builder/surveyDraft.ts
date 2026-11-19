import {
  BulkEditSurveyPayload,
  QuestionConfig,
  QuestionConfigByType,
  QuestionDefinition,
  QuestionType,
  SelectOption,
  SurveyQuestion,
  SurveyVersion,
  UpdatedQuestionDefinition,
} from '@/services/surveys/types';

/**
 * Modelo local del editor.
 *
 * El backend trata las preguntas como inmutables: "editar" una pregunta en
 * realidad crea una fila nueva que reemplaza a `fromQuestionId`. Por eso el
 * editor trabaja sobre una copia local y al guardar se calcula un diff contra
 * la versión cargada (ver `buildBulkEditPayload`).
 */
interface DraftQuestionOf<T extends QuestionType> {
  /** Identificador local estable, sirve de key en React */
  localId: string;
  /** Id de la pregunta original en el backend; ausente si es nueva */
  originId?: number;
  /** Id local de la sección a la que pertenece (ver `DraftSection`) */
  sectionId: string;
  text: string;
  /** Texto de ayuda opcional bajo el enunciado */
  description: string;
  type: T;
  config: QuestionConfigByType[T];
  /** La pregunta solo la ve y la contesta un revisor con permisos de staff */
  staffOnly: boolean;
  required: boolean;
}

export type DraftQuestion = {
  [K in QuestionType]: DraftQuestionOf<K>;
}[QuestionType];

/**
 * Sección del editor.
 *
 * El backend identifica las secciones por su nombre, pero el editor usa un id
 * local: así renombrar una sección no cambia la identidad de sus componentes
 * (React no las remonta y el input no pierde el foco) ni mezcla dos secciones
 * que momentáneamente compartan nombre mientras se escribe.
 */
export interface DraftSection {
  id: string;
  name: string;
}

/** Sección con sus preguntas, en el orden en que se renderiza */
export interface DraftSectionGroup {
  section: string;
  questions: DraftQuestion[];
}

let localIdCounter = 0;

export function createLocalId(prefix = 'q'): string {
  localIdCounter += 1;
  return `${prefix}-local-${Date.now().toString(36)}-${localIdCounter}`;
}

/* ------------------------------ Configuración ----------------------------- */

/** Configuración por defecto al crear una pregunta o al cambiarle el tipo */
export function defaultConfigForType<T extends QuestionType>(
  type: T
): QuestionConfigByType[T] {
  switch (type) {
    case 'single_select':
    case 'multi_select':
      return {
        options: [
          { id: 'a', label: '', score: 0 },
          { id: 'b', label: '', score: 0 },
        ],
      } as QuestionConfigByType[T];
    case 'range':
      return {
        min: 0,
        max: 10,
        step: 1,
        minScore: 0,
        maxScore: 10,
      } as QuestionConfigByType[T];
    case 'number':
      return { score: 0 } as QuestionConfigByType[T];
    case 'text':
      return { maxLength: 500, score: 0 } as QuestionConfigByType[T];
    case 'boolean':
    default:
      return { trueScore: 0, falseScore: 0 } as QuestionConfigByType[T];
  }
}

/** Quita claves con valor `undefined` para poder comparar y enviar configs */
function stripUndefined<T extends object>(value: T): T {
  const result: Record<string, unknown> = {};
  Object.entries(value).forEach(([key, entry]) => {
    if (entry !== undefined && entry !== null) result[key] = entry;
  });
  return result as T;
}

/**
 * Deja la config en una forma canónica: mismas claves y mismo orden para el
 * mismo contenido, de modo que dos configs equivalentes se comparen iguales.
 */
export function normalizeConfig(
  type: QuestionType,
  config: QuestionConfig
): QuestionConfig {
  switch (type) {
    case 'single_select': {
      const { options } = config as QuestionConfigByType['single_select'];
      return {
        options: (options ?? []).map((option) => ({
          id: option.id,
          label: option.label,
          score: Number(option.score) || 0,
        })),
      };
    }
    case 'multi_select': {
      const { options, minSelections, maxSelections } =
        config as QuestionConfigByType['multi_select'];
      return stripUndefined({
        options: (options ?? []).map((option) => ({
          id: option.id,
          label: option.label,
          score: Number(option.score) || 0,
        })),
        minSelections,
        maxSelections,
      });
    }
    case 'range': {
      const { min, max, step, minScore, maxScore } =
        config as QuestionConfigByType['range'];
      return stripUndefined({ min, max, step, minScore, maxScore });
    }
    case 'number': {
      const { min, max, score } = config as QuestionConfigByType['number'];
      return stripUndefined({ min, max, score });
    }
    case 'text': {
      const { maxLength, score } = config as QuestionConfigByType['text'];
      return stripUndefined({ maxLength, score });
    }
    case 'boolean':
    default: {
      const { trueScore, falseScore } =
        config as QuestionConfigByType['boolean'];
      return stripUndefined({ trueScore, falseScore });
    }
  }
}

/* -------------------------- Versión <-> borrador -------------------------- */

export interface DraftState {
  questions: DraftQuestion[];
  sections: DraftSection[];
}

const DEFAULT_SECTION_NAME = 'General';

/**
 * Convierte una versión del backend en el estado inicial del editor:
 * las preguntas aplanadas y ordenadas, y las secciones con id local.
 */
export function versionToDraft(
  version: SurveyVersion | null | undefined
): DraftState {
  const sections: DraftSection[] = [];

  const resolveSectionId = (name: string): string => {
    const existing = sections.find((section) => section.name === name);
    if (existing) return existing.id;

    const created: DraftSection = { id: createLocalId('s'), name };
    sections.push(created);
    return created.id;
  };

  const questions = flattenVersionQuestions(version).map(
    (question) =>
      ({
        localId: createLocalId(),
        originId: question.id,
        sectionId: resolveSectionId(question.section),
        text: question.text,
        description: question.description ?? '',
        type: question.type,
        config: normalizeConfig(question.type, question.config),
        staffOnly: question.staffOnly ?? false,
        required: question.required,
      }) as DraftQuestion
  );

  if (!sections.length) {
    sections.push({ id: createLocalId('s'), name: DEFAULT_SECTION_NAME });
  }

  return { questions, sections };
}

/** Preguntas de una versión, ordenadas por `order` */
export function flattenVersionQuestions(
  version: SurveyVersion | null | undefined
): SurveyQuestion[] {
  if (!version) return [];

  return version.sections
    .flatMap((section) => section.questions)
    .slice()
    .sort((a, b) => a.order - b.order);
}

/** Agrupa las preguntas por sección, en el orden de las secciones */
export function groupDraftBySections(
  questions: DraftQuestion[],
  sections: DraftSection[]
): DraftSectionGroup[] {
  return sections.map((section) => ({
    section: section.name,
    questions: questions.filter(
      (question) => question.sectionId === section.id
    ),
  }));
}

/** Preguntas en el orden final: por sección y, dentro de ella, por posición */
export function orderDraftQuestions(
  questions: DraftQuestion[],
  sections: DraftSection[]
): DraftQuestion[] {
  return sections.flatMap((section) =>
    questions.filter((question) => question.sectionId === section.id)
  );
}

/** Crea una pregunta vacía para una sección dada */
export function createDraftQuestion(
  sectionId: string,
  type: QuestionType = 'single_select'
): DraftQuestion {
  return {
    localId: createLocalId(),
    sectionId,
    text: '',
    description: '',
    type,
    config: defaultConfigForType(type),
    staffOnly: false,
    required: true,
  } as DraftQuestion;
}

/** Crea una sección nueva con un nombre libre */
export function createDraftSection(existing: DraftSection[]): DraftSection {
  let index = existing.length + 1;
  let name = `Sección ${index}`;
  while (existing.some((section) => section.name === name)) {
    index += 1;
    name = `Sección ${index}`;
  }
  return { id: createLocalId('s'), name };
}

/* --------------------------------- Payloads -------------------------------- */

function toDefinition(
  question: DraftQuestion,
  order: number,
  sectionName: string
): QuestionDefinition {
  return {
    text: question.text.trim(),
    description: question.description.trim(),
    section: sectionName.trim(),
    type: question.type,
    config: normalizeConfig(question.type, question.config),
    staffOnly: question.staffOnly,
    order,
    required: question.required,
  } as QuestionDefinition;
}

/** Nombre de sección por id local */
function sectionNameOf(sections: DraftSection[], sectionId: string): string {
  return sections.find((section) => section.id === sectionId)?.name ?? '';
}

function isDeepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    return a.every((item, index) => isDeepEqual(item, b[index]));
  }
  if (typeof a !== 'object') return false;

  const aKeys = Object.keys(a as object).sort();
  const bKeys = Object.keys(b as object).sort();
  if (!isDeepEqual(aKeys, bKeys)) return false;

  return aKeys.every((key) =>
    isDeepEqual(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key]
    )
  );
}

/** `true` si la pregunta del borrador no cambió respecto de la original */
function isUnchanged(
  original: SurveyQuestion,
  definition: QuestionDefinition
): boolean {
  return (
    original.text === definition.text &&
    (original.description ?? '') === definition.description &&
    original.section === definition.section &&
    original.type === definition.type &&
    (original.staffOnly ?? false) === definition.staffOnly &&
    original.required === definition.required &&
    original.order === definition.order &&
    isDeepEqual(
      normalizeConfig(original.type, original.config),
      definition.config
    )
  );
}

/** Preguntas del borrador listas para `POST /surveys/` */
export function buildCreateQuestions(
  draft: DraftQuestion[],
  sections: DraftSection[]
) {
  return draft.map((question, index) =>
    toDefinition(question, index, sectionNameOf(sections, question.sectionId))
  );
}

/**
 * Calcula el diff entre la versión cargada y el borrador.
 *
 * - `deleted`: preguntas originales que ya no están en el borrador
 * - `updated`: preguntas originales modificadas (el backend crea una fila nueva)
 * - `added`: preguntas sin origen en el backend
 * - Las que no cambiaron no se mencionan: el backend las reutiliza tal cual
 */
export function buildBulkEditPayload(
  originalQuestions: SurveyQuestion[],
  draft: DraftQuestion[],
  sections: DraftSection[]
): BulkEditSurveyPayload {
  const survivingIds = new Set(
    draft
      .map((question) => question.originId)
      .filter((id): id is number => typeof id === 'number')
  );

  const deleted = originalQuestions
    .map((question) => question.id)
    .filter((id) => !survivingIds.has(id));

  const updated: UpdatedQuestionDefinition[] = [];
  const added: QuestionDefinition[] = [];

  draft.forEach((question, index) => {
    const definition = toDefinition(
      question,
      index,
      sectionNameOf(sections, question.sectionId)
    );

    if (typeof question.originId !== 'number') {
      added.push(definition);
      return;
    }

    const original = originalQuestions.find(
      (item) => item.id === question.originId
    );

    if (!original) {
      added.push(definition);
      return;
    }

    if (isUnchanged(original, definition)) return;

    updated.push({ ...definition, fromQuestionId: original.id });
  });

  const payload: BulkEditSurveyPayload = {};
  if (deleted.length) payload.deleted = deleted;
  if (updated.length) payload.updated = updated;
  if (added.length) payload.added = added;

  return payload;
}

/** `true` si el diff no toca ninguna pregunta (aunque cambien los datos generales) */
export function isEmptyBulkEditPayload(
  payload: BulkEditSurveyPayload
): boolean {
  return (
    !payload.deleted?.length &&
    !payload.updated?.length &&
    !payload.added?.length
  );
}

/* -------------------------------- Puntajes -------------------------------- */

/**
 * Estimación local del puntaje máximo de una pregunta.
 * El valor oficial siempre lo deriva el backend; esto es solo una ayuda visual.
 */
export function estimateMaxScore(question: DraftQuestion): number {
  switch (question.type) {
    case 'single_select': {
      const scores = question.config.options.map((option) => option.score);
      return scores.length ? Math.max(...scores) : 0;
    }
    case 'multi_select': {
      const { options, maxSelections } = question.config;
      const scores = options.map((option) => option.score);
      if (maxSelections && maxSelections > 0) {
        return scores
          .slice()
          .sort((a, b) => b - a)
          .slice(0, maxSelections)
          .reduce((total, score) => total + Math.max(score, 0), 0);
      }
      return scores.reduce((total, score) => total + Math.max(score, 0), 0);
    }
    case 'range':
      return question.config.maxScore ?? question.config.max ?? 0;
    case 'number':
    case 'text':
      return question.config.score ?? 0;
    case 'boolean':
    default:
      return Math.max(
        question.config.trueScore ?? 0,
        question.config.falseScore ?? 0
      );
  }
}

/** Suma de los puntajes máximos estimados del borrador completo */
export function estimateTotalPossibleScore(draft: DraftQuestion[]): number {
  return draft.reduce(
    (total, question) => total + estimateMaxScore(question),
    0
  );
}

/* ------------------------------- Validación ------------------------------- */

function validateOptions(
  options: SelectOption[],
  label: string,
  errors: string[]
) {
  if (options.length < 2) {
    errors.push(`${label}: debe tener al menos 2 opciones.`);
  }
  if (options.some((option) => !option.id.trim())) {
    errors.push(`${label}: todas las opciones necesitan un identificador.`);
  }
  if (options.some((option) => !option.label.trim())) {
    errors.push(`${label}: todas las opciones necesitan un texto.`);
  }
  const ids = options.map((option) => option.id.trim());
  if (new Set(ids).size !== ids.length) {
    errors.push(`${label}: los identificadores de opción deben ser únicos.`);
  }
}

/**
 * Valida el borrador antes de llamar al backend.
 * @returns Lista de errores legibles; vacía si el borrador es válido
 */
export function validateDraft(
  draft: DraftQuestion[],
  sections: DraftSection[]
): string[] {
  const errors: string[] = [];

  if (!draft.length) {
    errors.push('La encuesta debe tener al menos una pregunta.');
    return errors;
  }

  if (sections.some((section) => !section.name.trim())) {
    errors.push('Todas las secciones necesitan un nombre.');
  }

  // El backend agrupa las preguntas por el nombre de la sección: dos secciones
  // con el mismo nombre terminarían fusionadas al guardar.
  const names = sections.map((section) => section.name.trim());
  if (new Set(names).size !== names.length) {
    errors.push('Los nombres de las secciones deben ser distintos entre sí.');
  }

  draft.forEach((question, index) => {
    const label = `Pregunta ${index + 1}`;

    if (!question.text.trim()) {
      errors.push(`${label}: el enunciado no puede estar vacío.`);
    }

    switch (question.type) {
      case 'single_select':
        validateOptions(question.config.options, label, errors);
        break;
      case 'multi_select': {
        const { options, minSelections, maxSelections } = question.config;
        validateOptions(options, label, errors);
        if (
          minSelections !== undefined &&
          maxSelections !== undefined &&
          minSelections > maxSelections
        ) {
          errors.push(
            `${label}: el mínimo de selecciones no puede superar al máximo.`
          );
        }
        if (maxSelections !== undefined && maxSelections > options.length) {
          errors.push(
            `${label}: el máximo de selecciones supera la cantidad de opciones.`
          );
        }
        break;
      }
      case 'range': {
        const { min, max, step } = question.config;
        if (min >= max) {
          errors.push(`${label}: el mínimo debe ser menor que el máximo.`);
        }
        if (step !== undefined && step <= 0) {
          errors.push(`${label}: el paso debe ser mayor que 0.`);
        }
        break;
      }
      case 'number': {
        const { min, max } = question.config;
        if (min !== undefined && max !== undefined && min > max) {
          errors.push(`${label}: el mínimo no puede superar al máximo.`);
        }
        break;
      }
      default:
        break;
    }
  });

  return errors;
}
