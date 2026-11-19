'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Eye, Pencil, Plus, Save } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { useToast } from '@/components/ui/use-toast';
import { useSurveyMutations } from '@/hooks/surveys';
import { BulkEditSurveyPayload, SurveyVersion } from '@/services/surveys/types';
import { useToken } from '@/stores/auth/auth.store';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { getSurveyErrorMessage } from '../surveyError';
import { SurveyDraftPreview } from '../preview/surveyPreview.component';
import { SurveyFormModal, SurveyMeta } from '../surveyFormModal.component';
import {
  DraftQuestion,
  DraftSection,
  buildBulkEditPayload,
  buildCreateQuestions,
  createDraftQuestion,
  createDraftSection,
  estimateTotalPossibleScore,
  flattenVersionQuestions,
  isEmptyBulkEditPayload,
  orderDraftQuestions,
  validateDraft,
  versionToDraft,
} from './surveyDraft';
import { SectionGroup } from './sectionGroup.component';

interface SurveyBuilderProps {
  mode: 'create' | 'edit';
  /** Requerido en modo edición */
  surveyId?: number;
  initialMeta: SurveyMeta;
  /** Versión que se toma como base en modo edición */
  baseVersion?: SurveyVersion | null;
  onSaved: (surveyId: number, versionNumber: number, meta: SurveyMeta) => void;
  onCancel: () => void;
}

/**
 * Constructor de encuestas.
 *
 * Trabaja sobre una copia local del cuestionario y al guardar traduce los
 * cambios al modelo inmutable del backend: en creación envía la lista completa,
 * en edición envía el diff (`deleted` / `updated` / `added`) que genera una
 * nueva versión draft.
 */
export function SurveyBuilder({
  mode,
  surveyId,
  initialMeta,
  baseVersion,
  onSaved,
  onCancel,
}: SurveyBuilderProps) {
  const token = useToken();
  const { toast } = useToast();
  const { createSurvey, isCreatingSurvey, bulkEditSurvey, isEditingSurvey } =
    useSurveyMutations(token);

  const [meta, setMeta] = useState<SurveyMeta>(initialMeta);
  const [isMetaModalOpen, setIsMetaModalOpen] = useState(false);
  const [draft, setDraft] = useState<DraftQuestion[]>(
    () => versionToDraft(baseVersion).questions
  );
  const [sections, setSections] = useState<DraftSection[]>(
    () => versionToDraft(baseVersion).sections
  );
  const [errors, setErrors] = useState<string[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [sectionToRemove, setSectionToRemove] = useState<DraftSection>();
  const [scrollToQuestionId, setScrollToQuestionId] = useState<string>();

  // Al cambiar la versión base (p. ej. tras publicar) se reinicia el borrador
  useEffect(() => {
    const state = versionToDraft(baseVersion);
    setDraft(state.questions);
    setSections(state.sections);
    setErrors([]);
  }, [baseVersion?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const originalQuestions = useMemo(
    () => flattenVersionQuestions(baseVersion),
    [baseVersion]
  );

  const orderedDraft = useMemo(
    () => orderDraftQuestions(draft, sections),
    [draft, sections]
  );

  const isSaving = isCreatingSurvey || isEditingSurvey;

  /* ------------------------------- Secciones ------------------------------ */

  const handleAddSection = () => {
    setSections((current) => [...current, createDraftSection(current)]);
  };

  const handleRenameSection = (sectionId: string, name: string) => {
    setSections((current) =>
      current.map((section) =>
        section.id === sectionId ? { ...section, name } : section
      )
    );
  };

  const handleRemoveSection = (sectionId: string) => {
    const section = sections.find((item) => item.id === sectionId);
    if (!section) return;

    const affected = draft.filter(
      (question) => question.sectionId === sectionId
    ).length;

    if (!affected) {
      setSections((current) => current.filter((item) => item.id !== sectionId));
      return;
    }

    setSectionToRemove(section);
  };

  const confirmRemoveSection = () => {
    if (!sectionToRemove) return;

    setSections((current) =>
      current.filter((item) => item.id !== sectionToRemove.id)
    );
    setDraft((current) =>
      current.filter((question) => question.sectionId !== sectionToRemove.id)
    );
    setSectionToRemove(undefined);
  };

  /* ------------------------------- Preguntas ------------------------------ */

  const handleAddQuestion = (sectionId: string) => {
    const question = createDraftQuestion(sectionId);
    setDraft((current) => [...current, question]);
    setScrollToQuestionId(question.localId);
  };

  // Estable, porque la tarjeta la usa como dependencia de su efecto de scroll
  const handleScrolled = useCallback(
    () => setScrollToQuestionId(undefined),
    []
  );

  const handleChangeQuestion = (
    localId: string,
    patch: Partial<DraftQuestion>
  ) => {
    setDraft((current) =>
      current.map((question) =>
        question.localId === localId
          ? ({ ...question, ...patch } as DraftQuestion)
          : question
      )
    );
  };

  const handleRemoveQuestion = (localId: string) => {
    setDraft((current) =>
      current.filter((question) => question.localId !== localId)
    );
  };

  const handleMoveQuestion = (localId: string, direction: -1 | 1) => {
    setDraft((current) => {
      const question = current.find((item) => item.localId === localId);
      if (!question) return current;

      const siblings = current.filter(
        (item) => item.sectionId === question.sectionId
      );
      const position = siblings.indexOf(question);
      const target = siblings[position + direction];
      if (!target) return current;

      // Intercambia ambas preguntas dentro del arreglo global
      const fromIndex = current.indexOf(question);
      const toIndex = current.indexOf(target);
      const next = [...current];
      next[fromIndex] = target;
      next[toIndex] = question;
      return next;
    });
  };

  /* -------------------------------- Guardar ------------------------------- */

  /** Datos generales que cambiaron respecto de los que trae la encuesta */
  const changedMeta = (): Partial<BulkEditSurveyPayload> => {
    const changes: Partial<BulkEditSurveyPayload> = {};
    if (meta.title !== initialMeta.title) changes.title = meta.title;
    // El backend no re-deriva el slug al renombrar: solo cambia si se manda
    if (meta.slug !== initialMeta.slug) changes.slug = meta.slug;
    if (meta.description !== initialMeta.description) {
      changes.description = meta.description;
    }
    if (meta.requiresAuthentication !== initialMeta.requiresAuthentication) {
      changes.requiresAuthentication = meta.requiresAuthentication;
    }
    return changes;
  };

  const handleSave = async () => {
    const validationErrors = validateDraft(orderedDraft, sections);
    setErrors(validationErrors);

    if (validationErrors.length) {
      toast({
        title: 'Revisa el cuestionario',
        description: `Hay ${validationErrors.length} problema(s) por corregir.`,
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'create') {
        const survey = await createSurvey({
          title: meta.title,
          // Sin slug propio lo deriva el backend del título
          ...(meta.slug && { slug: meta.slug }),
          description: meta.description,
          requiresAuthentication: meta.requiresAuthentication,
          questions: buildCreateQuestions(orderedDraft, sections),
        });

        toast({
          title: 'Encuesta creada',
          description: `Se generó la versión 1 como borrador con el slug "${survey.slug}". Publícala para dejarla activa.`,
        });
        // El slug definitivo lo resuelve el backend: se relee de la respuesta
        onSaved(survey.id, survey.version?.versionNumber ?? 1, {
          ...meta,
          slug: survey.slug,
        });
        return;
      }

      if (!surveyId) return;

      const questionsDiff = buildBulkEditPayload(
        originalQuestions,
        orderedDraft,
        sections
      );
      const metaChanges = changedMeta();

      if (
        isEmptyBulkEditPayload(questionsDiff) &&
        !Object.keys(metaChanges).length
      ) {
        toast({
          title: 'Sin cambios',
          description: 'No hay modificaciones que guardar.',
        });
        return;
      }

      const survey = await bulkEditSurvey({
        surveyId,
        payload: { ...questionsDiff, ...metaChanges },
      });

      // Sin diff de preguntas el backend solo aplica los datos generales: no
      // hay versión nueva que publicar.
      const isMetaOnly = isEmptyBulkEditPayload(questionsDiff);

      toast({
        title: isMetaOnly
          ? 'Datos generales actualizados'
          : 'Borrador actualizado',
        description: isMetaOnly
          ? 'Los cambios se aplicaron de inmediato, sin crear una versión nueva.'
          : `Se creó la versión ${
              survey.version?.versionNumber ?? ''
            } como borrador. Publícala para dejarla activa.`,
      });
      onSaved(surveyId, survey.version?.versionNumber ?? 0, {
        ...meta,
        slug: survey.slug,
      });
    } catch (error) {
      toast({
        title: 'No se pudo guardar',
        description: getSurveyErrorMessage(
          error,
          'Ocurrió un error al guardar la encuesta.'
        ),
        variant: 'destructive',
      });
    }
  };

  /* -------------------------------- Render -------------------------------- */

  let sectionStart = 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <div className="flex items-center gap-1">
              <h2 className="text-lg font-semibold">{meta.title}</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsMetaModalOpen(true)}
                title="Editar datos generales"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {mode === 'create'
                ? 'Nueva encuesta — se guardará como borrador (versión 1)'
                : `Editando sobre la versión ${
                    baseVersion?.versionNumber ?? '-'
                  } — al guardar se crea un nuevo borrador`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {orderedDraft.length} pregunta(s) ·{' '}
            {estimateTotalPossibleScore(orderedDraft)} pts estimados
          </Badge>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview((current) => !current)}
          >
            <Eye className="h-4 w-4 mr-1" />
            {showPreview ? 'Editar' : 'Vista previa'}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Guardando...' : 'Guardar borrador'}
          </Button>
        </div>
      </div>

      {errors.length > 0 ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
          <p className="text-sm font-medium text-destructive mb-1">
            Corrige lo siguiente antes de guardar:
          </p>
          <ul className="list-disc list-inside text-sm text-destructive space-y-0.5">
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showPreview ? (
        <div className="rounded-lg border bg-background shadow-sm p-4">
          <SurveyDraftPreview
            title={meta.title}
            description={meta.description}
            draft={orderedDraft}
            sections={sections}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {sections.map((section) => {
            const questions = draft.filter(
              (question) => question.sectionId === section.id
            );
            const startPosition = sectionStart;
            sectionStart += questions.length;

            return (
              <SectionGroup
                key={section.id}
                section={section}
                questions={questions}
                sections={sections}
                startPosition={startPosition}
                canRemoveSection={sections.length > 1}
                scrollToQuestionId={scrollToQuestionId}
                onScrolled={handleScrolled}
                onRenameSection={handleRenameSection}
                onRemoveSection={handleRemoveSection}
                onAddQuestion={handleAddQuestion}
                onChangeQuestion={handleChangeQuestion}
                onRemoveQuestion={handleRemoveQuestion}
                onMoveQuestion={handleMoveQuestion}
              />
            );
          })}

          <div>
            <Button type="button" variant="outline" onClick={handleAddSection}>
              <Plus className="h-4 w-4 mr-1" />
              Agregar sección
            </Button>
          </div>
        </div>
      )}

      <SurveyFormModal
        open={isMetaModalOpen}
        mode="edit"
        initialMeta={meta}
        onOpenChange={setIsMetaModalOpen}
        onSubmit={(nextMeta) => {
          setMeta(nextMeta);
          setIsMetaModalOpen(false);
        }}
      />

      <ConfirmDialog
        open={!!sectionToRemove}
        title="Eliminar sección"
        description={
          sectionToRemove
            ? `Se eliminarán ${
                draft.filter(
                  (question) => question.sectionId === sectionToRemove.id
                ).length
              } pregunta(s) de la sección "${sectionToRemove.name}".`
            : ''
        }
        confirmLabel="Eliminar"
        destructive
        onConfirm={confirmRemoveSection}
        onOpenChange={(open) => {
          if (!open) setSectionToRemove(undefined);
        }}
      />
    </div>
  );
}
