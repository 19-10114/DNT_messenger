'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { Label } from '@/components/ui/label.component';
import {
  usePageEditorActions,
  usePageEditorSurveys,
} from '@/stores/pages/pageEditor.store';
import { BLOCK_CATALOG } from '../catalog';
import { BlockEditorProps } from '../editorProps';
import {
  ChoiceGroup,
  TextField,
} from '../../editor/fields/editorFields.component';
import { SurveyPicker } from '../../editor/fields/surveyPicker.component';

export function SurveyBlockEditor({
  blockKey,
  block,
  onChange,
}: BlockEditorProps<'survey'>) {
  const { config } = block;
  const surveys = usePageEditorSurveys();
  const { addSurvey } = usePageEditorActions();
  const current = config.surveyId ? surveys[config.surveyId] : undefined;
  const set = (patch: Partial<typeof config>) =>
    onChange({ ...block, config: { ...config, ...patch } });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <Label>Encuesta</Label>
        <p className="text-xs text-gray-500">
          Las respuestas se guardan en el módulo de Encuestas, marcadas con esta
          página.
        </p>
        {current && !current.isPublic && (
          <p className="flex items-start gap-2 rounded-md bg-amber-50 p-2 text-xs text-amber-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />“
            {current.title}” ya no está publicada o pide iniciar sesión: no se
            mostrará en la página hasta que lo corrijas o elijas otra.
          </p>
        )}
        <SurveyPicker
          value={config.surveyId || null}
          onPick={(survey) => {
            addSurvey(survey);
            set({ surveyId: survey.id });
          }}
        />
      </div>
      <ChoiceGroup
        label="Formato"
        value={block.variant}
        options={BLOCK_CATALOG.survey.variants}
        onChange={(variant) => onChange({ ...block, variant })}
      />
      <TextField
        id={`${blockKey}-title`}
        label="Título (opcional)"
        max={80}
        value={config.title ?? ''}
        onChange={(title) => set({ title })}
      />
      <TextField
        id={`${blockKey}-intro`}
        label="Introducción (opcional)"
        max={300}
        multiline
        rows={2}
        value={config.intro ?? ''}
        onChange={(intro) => set({ intro })}
      />
      <TextField
        id={`${blockKey}-button`}
        label="Texto del botón de envío (opcional)"
        max={30}
        placeholder="Enviar"
        value={config.buttonLabel ?? ''}
        onChange={(buttonLabel) => set({ buttonLabel })}
      />
      <TextField
        id={`${blockKey}-thanks`}
        label="Mensaje al terminar"
        max={300}
        multiline
        rows={2}
        value={config.thanks}
        onChange={(thanks) => set({ thanks })}
      />
    </div>
  );
}
