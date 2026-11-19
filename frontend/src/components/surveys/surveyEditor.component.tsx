'use client';

import React from 'react';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { useSurvey, useSurveyVersions } from '@/hooks/surveys';
import { Survey } from '@/services/surveys/types';
import { useToken } from '@/stores/auth/auth.store';
import { SurveyBuilder } from './builder/surveyBuilder.component';
import { SurveyMeta } from './surveyFormModal.component';

interface SurveyEditorProps {
  survey: Survey;
  onSaved: (surveyId: number, versionNumber: number, meta: SurveyMeta) => void;
  onCancel: () => void;
}

/**
 * Prepara la edición de una encuesta existente.
 *
 * El PATCH del backend construye la nueva versión a partir de la última
 * versión de la encuesta, así que el editor se carga sobre esa misma versión
 * (el borrador pendiente si existe, si no la publicada).
 */
export function SurveyEditor({ survey, onSaved, onCancel }: SurveyEditorProps) {
  const token = useToken();
  const { versions, isLoadingVersions } = useSurveyVersions(token, survey.id);
  const latestVersionNumber = versions[0]?.versionNumber;

  const { survey: detail, isLoadingSurvey } = useSurvey(
    token,
    latestVersionNumber ? survey.id : undefined,
    latestVersionNumber
  );

  if (isLoadingVersions || (latestVersionNumber && isLoadingSurvey)) {
    return (
      <div className="flex flex-col gap-4">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <p className="text-sm text-muted-foreground py-8 text-center">
          Cargando cuestionario...
        </p>
      </div>
    );
  }

  return (
    <SurveyBuilder
      mode="edit"
      surveyId={survey.id}
      initialMeta={{
        title: survey.title,
        slug: survey.slug,
        description: survey.description,
        requiresAuthentication: survey.requiresAuthentication,
      }}
      baseVersion={detail?.version ?? null}
      onSaved={onSaved}
      onCancel={onCancel}
    />
  );
}
