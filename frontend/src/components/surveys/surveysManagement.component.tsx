'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { useToast } from '@/components/ui/use-toast';
import { useSurveyMutations, useSurveys } from '@/hooks/surveys';
import { cn } from '@/lib/utils';
import { Survey } from '@/services/surveys/types';
import { useToken } from '@/stores/auth/auth.store';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { getSurveyErrorMessage } from './surveyError';
import { SurveyBuilder } from './builder/surveyBuilder.component';
import { ResponsesTable } from './responses/responsesTable.component';
import { SurveyEditor } from './surveyEditor.component';
import { SurveyFormModal, SurveyMeta } from './surveyFormModal.component';
import { SurveysTable } from './surveysTable.component';
import { VersionsPanel } from './versionsPanel.component';

const PAGE_SIZE = 10;

type ManagementView =
  | { kind: 'list' }
  | { kind: 'create'; meta: SurveyMeta }
  | { kind: 'edit'; survey: Survey }
  | { kind: 'versions'; surveyId: number; title: string; description?: string }
  | { kind: 'responses'; surveyId: number; title: string };

/**
 * Contenedor del módulo de Gestión de Encuestas.
 * Todas las vistas viven en la misma ruta y se alternan con estado local.
 */
export function SurveysManagement() {
  const token = useToken();
  const { toast } = useToast();

  const [view, setView] = useState<ManagementView>({ kind: 'list' });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [surveyToArchive, setSurveyToArchive] = useState<Survey>();

  const {
    surveys,
    pagination,
    isLoadingSurveys,
    isFetchingSurveys,
    isErrorSurveys,
    refetchSurveys,
  } = useSurveys(token, {
    page,
    pageSize: PAGE_SIZE,
    search: search || undefined,
  });
  const { archiveSurvey, isArchivingSurvey } = useSurveyMutations(token);

  const goToList = () => setView({ kind: 'list' });

  const handleSearch = (term: string) => {
    setSearch(term);
    setPage(1);
  };

  const handleCreate = (meta: SurveyMeta) => {
    setIsFormOpen(false);
    setView({ kind: 'create', meta });
  };

  const handleArchive = async () => {
    if (!surveyToArchive) return;

    try {
      await archiveSurvey(surveyToArchive.id);
      toast({
        title: 'Encuesta archivada',
        description: `"${surveyToArchive.title}" ya no aparece en el listado.`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo archivar',
        description: getSurveyErrorMessage(
          error,
          'Ocurrió un error al archivar la encuesta.'
        ),
        variant: 'destructive',
      });
    } finally {
      setSurveyToArchive(undefined);
    }
  };

  /** Tras guardar un borrador se lleva al panel de versiones para publicarlo */
  const goToVersions = (
    surveyId: number,
    title: string,
    description?: string
  ) => setView({ kind: 'versions', surveyId, title, description });

  if (view.kind === 'create') {
    return (
      <SurveyBuilder
        mode="create"
        initialMeta={view.meta}
        onSaved={(surveyId, _versionNumber, meta) =>
          goToVersions(surveyId, meta.title, meta.description)
        }
        onCancel={goToList}
      />
    );
  }

  if (view.kind === 'edit') {
    return (
      <SurveyEditor
        survey={view.survey}
        onSaved={(surveyId, _versionNumber, meta) =>
          goToVersions(surveyId, meta.title, meta.description)
        }
        onCancel={goToList}
      />
    );
  }

  if (view.kind === 'versions') {
    return (
      <VersionsPanel
        surveyId={view.surveyId}
        title={view.title}
        description={view.description}
        onBack={goToList}
      />
    );
  }

  if (view.kind === 'responses') {
    return (
      <ResponsesTable
        surveyId={view.surveyId}
        title={view.title}
        onBack={goToList}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <SearchInput
          placeholder="Buscar encuesta..."
          onSearch={handleSearch}
          className="w-full md:max-w-sm"
        />
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetchSurveys()}
            disabled={isFetchingSurveys}
            title="Actualizar listado"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 mr-1',
                isFetchingSurveys && 'animate-spin'
              )}
            />
            Actualizar
          </Button>
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Nueva encuesta
          </Button>
        </div>
      </div>

      {isErrorSurveys ? (
        <p className="text-sm text-destructive py-8 text-center">
          No se pudieron cargar las encuestas.
        </p>
      ) : (
        <SurveysTable
          surveys={surveys}
          isLoading={isLoadingSurveys}
          pagination={
            pagination
              ? {
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  totalElements: pagination.totalElements,
                  pageSize: PAGE_SIZE,
                  onPageChange: setPage,
                }
              : undefined
          }
          onEdit={(survey) => setView({ kind: 'edit', survey })}
          onVersions={(survey) =>
            goToVersions(survey.id, survey.title, survey.description)
          }
          onResponses={(survey) =>
            setView({
              kind: 'responses',
              surveyId: survey.id,
              title: survey.title,
            })
          }
          onArchive={setSurveyToArchive}
        />
      )}

      <SurveyFormModal
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!surveyToArchive}
        title="Archivar encuesta"
        description={
          surveyToArchive
            ? `"${surveyToArchive.title}" dejará de aparecer en el listado.`
            : ''
        }
        confirmLabel="Archivar"
        destructive
        isLoading={isArchivingSurvey}
        onConfirm={handleArchive}
        onOpenChange={(open) => {
          if (!open) setSurveyToArchive(undefined);
        }}
      />
    </div>
  );
}
