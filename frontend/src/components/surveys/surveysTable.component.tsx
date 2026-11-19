'use client';

import React from 'react';
import { Archive, History, MessageSquare, Pencil } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import {
  GenericTable,
  GenericTableColumn,
  GenericTablePagination,
} from '@/components/tables/genericTable.component';
import { Survey } from '@/services/surveys/types';
import { cn } from '@/lib/utils';

interface SurveysTableProps {
  surveys: Survey[];
  isLoading: boolean;
  pagination?: GenericTablePagination;
  onEdit: (survey: Survey) => void;
  onVersions: (survey: Survey) => void;
  onResponses: (survey: Survey) => void;
  onArchive: (survey: Survey) => void;
}

/** Columnas que se esconden en pantallas chicas: el `th` y el `td` van juntos */
const HIDE_UNDER_MD = 'hidden md:table-cell';
const HIDE_UNDER_LG = 'hidden lg:table-cell';

function formatDate(value?: string): string {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Tabla general de encuestas con sus acciones de gestión */
export function SurveysTable({
  surveys,
  isLoading,
  pagination,
  onEdit,
  onVersions,
  onResponses,
  onArchive,
}: SurveysTableProps) {
  const columns: GenericTableColumn<Survey>[] = [
    {
      key: 'title',
      header: 'Título',
      className: 'font-medium',
      render: (survey) => (
        <>
          {survey.title}
          {survey.slug ? (
            <span className="block text-xs font-normal text-muted-foreground">
              /{survey.slug}
            </span>
          ) : null}
        </>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      headerClassName: HIDE_UNDER_MD,
      className: cn(HIDE_UNDER_MD, 'max-w-xs truncate text-muted-foreground'),
      render: (survey) => survey.description || '-',
    },
    {
      key: 'status',
      header: 'Estado',
      render: (survey) => (
        <Badge variant={survey.status === 'active' ? 'default' : 'secondary'}>
          {survey.status === 'active' ? 'Activa' : survey.status}
        </Badge>
      ),
    },
    {
      key: 'currentVersion',
      header: 'Versión actual',
      render: (survey) =>
        survey.currentVersion ? (
          <span className="text-sm">
            v{survey.currentVersion.versionNumber}
            <span className="text-muted-foreground">
              {' '}
              · {survey.currentVersion.totalPossibleScore} pts
            </span>
          </span>
        ) : (
          <Badge variant="outline">Sin publicar</Badge>
        ),
    },
    {
      key: 'requiresAuthentication',
      header: 'Autenticación',
      headerClassName: HIDE_UNDER_LG,
      className: cn(HIDE_UNDER_LG, 'text-muted-foreground'),
      render: (survey) =>
        survey.requiresAuthentication ? 'Requerida' : 'Anónima',
    },
    {
      key: 'updatedAt',
      header: 'Actualizada',
      headerClassName: HIDE_UNDER_LG,
      className: cn(HIDE_UNDER_LG, 'text-muted-foreground'),
      render: (survey) => formatDate(survey.updatedAt),
    },
  ];

  return (
    <GenericTable<Survey>
      columns={columns}
      data={surveys}
      isLoading={isLoading}
      emptyMessage="Aún no hay encuestas creadas."
      pagination={pagination}
      actions={[
        { label: 'Editar preguntas', icon: Pencil, onClick: onEdit },
        { label: 'Ver versiones', icon: History, onClick: onVersions },
        { label: 'Ver respuestas', icon: MessageSquare, onClick: onResponses },
        {
          label: 'Archivar encuesta',
          icon: Archive,
          className: 'text-destructive',
          onClick: onArchive,
        },
      ]}
    />
  );
}
