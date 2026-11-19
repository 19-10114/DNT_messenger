import { SurveyQuestion } from '@/services/surveys/types';

/**
 * Las respuestas de la evaluación son B (bueno), R (regular) y M (malo).
 * El color de cada botón se decide por la letra de la etiqueta, no por su id.
 */
export interface OptionStyle {
  idle: string;
  active: string;
  /** Estilo compacto para mostrar la opción ya elegida */
  badge: string;
}

const OPTION_STYLES: Record<string, OptionStyle> = {
  B: {
    idle: 'border-green-600 text-green-700 hover:bg-green-50',
    active: 'border-green-600 bg-green-600 text-white hover:bg-green-600',
    badge: 'border-green-600 bg-green-600 text-white',
  },
  R: {
    idle: 'border-yellow-500 text-yellow-600 hover:bg-yellow-50',
    active: 'border-yellow-500 bg-yellow-500 text-white hover:bg-yellow-500',
    badge: 'border-yellow-500 bg-yellow-500 text-white',
  },
  M: {
    idle: 'border-red-600 text-red-700 hover:bg-red-50',
    active: 'border-red-600 bg-red-600 text-white hover:bg-red-600',
    badge: 'border-red-600 bg-red-600 text-white',
  },
};

const DEFAULT_OPTION_STYLE: OptionStyle = {
  idle: 'border-input text-foreground hover:bg-accent',
  active: 'border-primary bg-primary text-primary-foreground',
  badge: 'border-primary bg-primary text-primary-foreground',
};

export function normalizeLabel(label: string): string {
  return label.trim().toUpperCase();
}

export function optionStyle(label: string): OptionStyle {
  return OPTION_STYLES[normalizeLabel(label)] ?? DEFAULT_OPTION_STYLE;
}

/** Etiqueta que se asume cuando el evaluador no marcó nada */
export const DEFAULT_LABEL = 'B';

/** Etiquetas que obligan a asignar repuestos en la etapa 2 */
export const ISSUE_LABELS = ['R', 'M'];

/** Opción que se aplica por defecto: la marcada como B, o la primera */
export function defaultOptionId(question: SurveyQuestion): string | undefined {
  if (question.type !== 'single_select') return undefined;

  const { options } = question.config;
  const good = options.find(
    (option) => normalizeLabel(option.label) === DEFAULT_LABEL
  );
  return (good ?? options[0])?.id;
}

/** Etiqueta de una opción a partir de su id */
export function labelOf(
  question: SurveyQuestion,
  optionId: string | undefined
): string {
  if (question.type !== 'single_select' || !optionId) return '';
  return (
    question.config.options.find((option) => option.id === optionId)?.label ??
    ''
  );
}
