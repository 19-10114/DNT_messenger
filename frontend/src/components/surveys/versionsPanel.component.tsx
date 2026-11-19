'use client';

import React, { useState } from 'react';
import { ArrowLeft, Eye, Upload } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useSurvey,
  useSurveyMutations,
  useSurveyVersions,
} from '@/hooks/surveys';
import { SurveyVersionStatus } from '@/services/surveys/types';
import { useToken } from '@/stores/auth/auth.store';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { getSurveyErrorMessage } from './surveyError';
import { SurveyVersionPreview } from './preview/surveyPreview.component';

interface VersionsPanelProps {
  surveyId: number;
  title: string;
  description?: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<SurveyVersionStatus, string> = {
  draft: 'Borrador',
  published: 'Publicada',
  archived: 'Archivada',
};

function statusVariant(status: SurveyVersionStatus) {
  if (status === 'published') return 'default' as const;
  if (status === 'draft') return 'secondary' as const;
  return 'outline' as const;
}

function formatDateTime(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Historial de versiones: previsualizar y publicar */
export function VersionsPanel({
  surveyId,
  title,
  description,
  onBack,
}: VersionsPanelProps) {
  const token = useToken();
  const { toast } = useToast();
  const { versions, isLoadingVersions } = useSurveyVersions(token, surveyId);
  const { publishVersion, isPublishingVersion } = useSurveyMutations(token);

  const [previewVersion, setPreviewVersion] = useState<number | undefined>();
  const [versionToPublish, setVersionToPublish] = useState<number>();
  const { survey, isLoadingSurvey } = useSurvey(
    token,
    previewVersion ? surveyId : undefined,
    previewVersion
  );

  const columns: GenericTableColumn<(typeof versions)[number]>[] = [
    {
      key: 'versionNumber',
      header: 'Versión',
      className: 'font-medium',
      render: (version) => `v${version.versionNumber}`,
    },
    {
      key: 'status',
      header: 'Estado',
      render: (version) => (
        <Badge variant={statusVariant(version.status)}>
          {STATUS_LABELS[version.status] ?? version.status}
        </Badge>
      ),
    },
    {
      key: 'totalPossibleScore',
      header: 'Puntaje total',
      render: (version) => `${version.totalPossibleScore} pts`,
    },
    {
      key: 'createdAt',
      header: 'Creada',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell text-muted-foreground',
      render: (version) => formatDateTime(version.createdAt),
    },
  ];

  const handlePublish = async () => {
    if (!versionToPublish) return;

    try {
      await publishVersion({ surveyId, versionNumber: versionToPublish });
      toast({
        title: 'Versión publicada',
        description: `La versión ${versionToPublish} es ahora la versión activa.`,
      });
      setVersionToPublish(undefined);
    } catch (error) {
      toast({
        title: 'No se pudo publicar',
        description: getSurveyErrorMessage(
          error,
          'Ocurrió un error al publicar la versión.'
        ),
        variant: 'destructive',
      });
      setVersionToPublish(undefined);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
        <div>
          <h2 className="text-lg font-semibold">Versiones · {title}</h2>
          <p className="text-xs text-muted-foreground">
            Cada edición genera un borrador; publicarlo lo convierte en la
            versión activa.
          </p>
        </div>
      </div>

      <GenericTable
        columns={columns}
        data={versions}
        isLoading={isLoadingVersions}
        emptyMessage="Esta encuesta todavía no tiene versiones."
        actions={[
          {
            // El mismo botón muestra u oculta la previsualización
            label: (version) =>
              previewVersion === version.versionNumber
                ? 'Ocultar'
                : 'Previsualizar',
            icon: Eye,
            showLabel: true,
            onClick: (version) =>
              setPreviewVersion(
                previewVersion === version.versionNumber
                  ? undefined
                  : version.versionNumber
              ),
          },
          {
            label: 'Publicar',
            icon: Upload,
            showLabel: true,
            variant: 'default',
            hidden: (version) => version.status !== 'draft',
            disabled: () => isPublishingVersion,
            onClick: (version) => setVersionToPublish(version.versionNumber),
          },
        ]}
      />

      <ConfirmDialog
        open={!!versionToPublish}
        title={`Publicar la versión ${versionToPublish ?? ''}`}
        description="Pasará a ser la versión activa de la encuesta y la que esté publicada actualmente quedará archivada."
        confirmLabel="Publicar"
        isLoading={isPublishingVersion}
        onConfirm={handlePublish}
        onOpenChange={(open) => {
          if (!open) setVersionToPublish(undefined);
        }}
      />

      {previewVersion ? (
        <div className="rounded-lg border bg-background shadow-sm p-4">
          {isLoadingSurvey ? (
            <p className="text-sm text-muted-foreground">Cargando versión...</p>
          ) : (
            <SurveyVersionPreview
              title={`${title} · v${previewVersion}`}
              description={description}
              version={survey?.version}
            />
          )}
        </div>
      ) : null}
    </div>
  );
}
