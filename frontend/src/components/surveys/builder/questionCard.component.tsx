'use client';

import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp, ShieldCheck, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  QUESTION_TYPE_LABELS,
  QuestionConfig,
  QuestionType,
} from '@/services/surveys/types';
import {
  DraftQuestion,
  DraftSection,
  defaultConfigForType,
  estimateMaxScore,
} from './surveyDraft';
import { QuestionConfigEditor } from './questionConfigEditor.component';

interface QuestionCardProps {
  question: DraftQuestion;
  position: number;
  sections: DraftSection[];
  canMoveUp: boolean;
  canMoveDown: boolean;
  /** Lleva el scroll hasta esta tarjeta (se usa al agregar una pregunta) */
  scrollIntoView?: boolean;
  onScrolled?: () => void;
  onChange: (localId: string, patch: Partial<DraftQuestion>) => void;
  onRemove: (localId: string) => void;
  onMove: (localId: string, direction: -1 | 1) => void;
}

const QUESTION_TYPES = Object.keys(QUESTION_TYPE_LABELS) as QuestionType[];

/** Tarjeta de edición de una pregunta dentro del constructor */
export function QuestionCard({
  question,
  position,
  sections,
  canMoveUp,
  canMoveDown,
  scrollIntoView = false,
  onScrolled,
  onChange,
  onRemove,
  onMove,
}: QuestionCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scrollIntoView) return;

    containerRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    onScrolled?.();
  }, [scrollIntoView, onScrolled]);

  const handleTypeChange = (type: QuestionType) => {
    // Cambiar el tipo invalida la configuración anterior
    onChange(question.localId, {
      type,
      config: defaultConfigForType(type),
    } as Partial<DraftQuestion>);
  };

  const handleConfigChange = (config: QuestionConfig) => {
    onChange(question.localId, { config } as Partial<DraftQuestion>);
  };

  return (
    <div
      ref={containerRef}
      className="rounded-lg border border-gray-300 bg-background shadow-sm overflow-hidden scroll-mt-24"
    >
      <div className="flex items-center justify-between gap-2 border-b border-gray-300 px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-muted-foreground">
            Pregunta {position}
          </span>
          {question.originId ? null : <Badge variant="secondary">Nueva</Badge>}
          {question.staffOnly ? (
            <Badge variant="outline" className="gap-1">
              <ShieldCheck className="h-3 w-3" />
              Solo staff
            </Badge>
          ) : null}
          <Badge variant="outline">
            Puntaje máx. estimado: {estimateMaxScore(question)}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canMoveUp}
            onClick={() => onMove(question.localId, -1)}
            title="Subir"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canMoveDown}
            onClick={() => onMove(question.localId, 1)}
            title="Bajar"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={() => onRemove(question.localId)}
            title="Eliminar pregunta"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Enunciado</span>
          <Input
            value={question.text}
            onChange={(event) =>
              onChange(question.localId, { text: event.target.value })
            }
            placeholder="¿Qué le preguntamos?"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">
            Descripción{' '}
            <span className="font-normal text-muted-foreground">
              (opcional)
            </span>
          </span>
          <Textarea
            value={question.description}
            rows={2}
            onChange={(event) =>
              onChange(question.localId, { description: event.target.value })
            }
            placeholder="Aclaración que se muestra debajo del enunciado"
          />
        </label>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Tipo</span>
            <Select value={question.type} onValueChange={handleTypeChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {QUESTION_TYPE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Sección</span>
            {/* Nativo: el nombre de la sección se edita en vivo y puede quedar vacío */}
            <select
              value={question.sectionId}
              onChange={(event) =>
                onChange(question.localId, { sectionId: event.target.value })
              }
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name || '(sin nombre)'}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-2 justify-center min-h-[2.5rem]">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={question.required}
                onCheckedChange={(checked) =>
                  onChange(question.localId, { required: checked === true })
                }
              />
              <span className="font-medium">Obligatoria</span>
            </label>

            {/* El respondiente no la ve: solo la contesta el revisor */}
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={question.staffOnly}
                onCheckedChange={(checked) =>
                  onChange(question.localId, { staffOnly: checked === true })
                }
              />
              <span className="font-medium">Solo staff</span>
            </label>
          </div>
        </div>

        {question.staffOnly ? (
          <p className="text-xs text-muted-foreground -mt-2">
            Esta pregunta no aparece en el formulario del respondiente y su
            obligatoriedad no lo bloquea: la responde el staff al revisar, y
            hasta entonces el puntaje de la respuesta queda incompleto.
          </p>
        ) : null}

        <div className="rounded-md border border-dashed p-3">
          <p className="text-xs font-medium text-muted-foreground mb-3">
            Configuración de {QUESTION_TYPE_LABELS[question.type].toLowerCase()}
          </p>
          <QuestionConfigEditor
            question={question}
            onChange={handleConfigChange}
          />
        </div>
      </div>
    </div>
  );
}
