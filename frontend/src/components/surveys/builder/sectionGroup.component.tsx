'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { DraftQuestion, DraftSection } from './surveyDraft';
import { QuestionCard } from './questionCard.component';

interface SectionGroupProps {
  section: DraftSection;
  questions: DraftQuestion[];
  sections: DraftSection[];
  /** Posición global de la primera pregunta del grupo, para numerarlas */
  startPosition: number;
  canRemoveSection: boolean;
  /** Pregunta recién agregada a la que hay que llevar el scroll */
  scrollToQuestionId?: string;
  onScrolled: () => void;
  onRenameSection: (sectionId: string, name: string) => void;
  onRemoveSection: (sectionId: string) => void;
  onAddQuestion: (sectionId: string) => void;
  onChangeQuestion: (localId: string, patch: Partial<DraftQuestion>) => void;
  onRemoveQuestion: (localId: string) => void;
  onMoveQuestion: (localId: string, direction: -1 | 1) => void;
}

/** Grupo de preguntas: cabecera de sección editable + sus tarjetas */
export function SectionGroup({
  section,
  questions,
  sections,
  startPosition,
  canRemoveSection,
  scrollToQuestionId,
  onScrolled,
  onRenameSection,
  onRemoveSection,
  onAddQuestion,
  onChangeQuestion,
  onRemoveQuestion,
  onMoveQuestion,
}: SectionGroupProps) {
  return (
    <div className="rounded-lg border border-gray-300 bg-background shadow-sm overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center gap-2 md:justify-between border-b border-gray-300 px-4 py-3">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            Sección
          </span>
          <Input
            value={section.name}
            onChange={(event) =>
              onRenameSection(section.id, event.target.value)
            }
            className="h-9 max-w-sm font-medium"
            placeholder="Nombre de la sección"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {questions.length} pregunta{questions.length === 1 ? '' : 's'}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddQuestion(section.id)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Pregunta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-destructive"
            disabled={!canRemoveSection}
            onClick={() => onRemoveSection(section.id)}
            title="Eliminar sección"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4">
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Esta sección aún no tiene preguntas.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((question, index) => (
              <QuestionCard
                key={question.localId}
                question={question}
                position={startPosition + index + 1}
                sections={sections}
                canMoveUp={index > 0}
                canMoveDown={index < questions.length - 1}
                scrollIntoView={scrollToQuestionId === question.localId}
                onScrolled={onScrolled}
                onChange={onChangeQuestion}
                onRemove={onRemoveQuestion}
                onMove={onMoveQuestion}
              />
            ))}

            {/* Repetido al final para no tener que volver arriba tras la última pregunta */}
            <div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onAddQuestion(section.id)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Agregar pregunta
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
