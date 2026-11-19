'use client';

import React, { useState } from 'react';
import { ArrowLeft, Eye } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { useSurveyResponses, useSurveyVersions } from '@/hooks/surveys';
import { useToken } from '@/stores/auth/auth.store';
import {
  getPendingQuestionIds,
  isResponseComplete,
} from '../surveyResponse.utils';
import { ResponseDetailModal } from './responseDetailModal.component';

interface ResponsesTableProps {
  surveyId: number;
  title: string;
  onBack: () => void;
}

const PAGE_SIZE = 10;

function formatDateTime(value: string): string {
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

/** Listado paginado de respuestas de una encuesta, con filtro por versión */
export function ResponsesTable({
  surveyId,
  title,
  onBack,
}: ResponsesTableProps) {
  const token = useToken();
  const [page, setPage] = useState(1);
  const [version, setVersion] = useState<number | undefined>();
  const [selectedResponseId, setSelectedResponseId] = useState<number>();

  const { versions } = useSurveyVersions(token, surveyId);
  const { responses, pagination, isLoadingResponses, isErrorResponses } =
    useSurveyResponses(token, surveyId, {
      page,
      pageSize: PAGE_SIZE,
      version,
    });

  const handleVersionChange = (value: string) => {
    setVersion(value ? Number(value) : undefined);
    setPage(1);
  };

  const columns: GenericTableColumn<(typeof responses)[number]>[] = [
    { key: 'id', header: '#', width: '5rem', className: 'font-medium' },
    {
      key: 'respondent',
      header: 'Respondiente',
      render: (response) =>
        response.respondent ?? <Badge variant="outline">Anónimo</Badge>,
    },
    {
      key: 'versionNumber',
      header: 'Versión',
      render: (response) => `v${response.versionNumber}`,
    },
    {
      key: 'totalScore',
      header: 'Puntaje',
      render: (response) => (
        <>
          {response.totalScore.toFixed(1)}%
          {/* Sin revisar, el puntaje todavía puede cambiar */}
          {isResponseComplete(response) ? null : (
            <span className="text-muted-foreground"> prov.</span>
          )}
        </>
      ),
    },
    {
      key: 'review',
      header: 'Revisión',
      render: (response) =>
        isResponseComplete(response) ? (
          <Badge variant="outline">Completa</Badge>
        ) : (
          <Badge variant="secondary">
            {getPendingQuestionIds(response).length} pendiente(s)
          </Badge>
        ),
    },
    {
      key: 'rawScore',
      header: 'Bruto',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell text-muted-foreground',
      render: (response) =>
        `${response.meta.rawScore} / ${response.meta.maxScore}`,
    },
    {
      key: 'submittedAt',
      header: 'Enviada',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell text-muted-foreground',
      render: (response) => formatDateTime(response.submittedAt),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-lg font-semibold">Respuestas · {title}</h2>
            <p className="text-xs text-muted-foreground">
              {pagination?.totalElements ?? 0} respuesta(s) registrada(s)
            </p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">
            Versión
          </span>
          <select
            value={version ?? ''}
            onChange={(event) => handleVersionChange(event.target.value)}
            className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todas</option>
            {versions.map((item) => (
              <option key={item.id} value={item.versionNumber}>
                v{item.versionNumber}
              </option>
            ))}
          </select>
        </label>
      </div>

      {isErrorResponses ? (
        <p className="text-sm text-destructive py-8 text-center">
          No se pudieron cargar las respuestas.
        </p>
      ) : (
        <GenericTable
          columns={columns}
          data={responses}
          isLoading={isLoadingResponses}
          emptyMessage="Esta encuesta todavía no tiene respuestas."
          actions={[
            {
              label: 'Ver detalle',
              icon: Eye,
              onClick: (response) => setSelectedResponseId(response.id),
            },
          ]}
          pagination={
            pagination
              ? {
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  onPageChange: setPage,
                }
              : undefined
          }
        />
      )}

      <ResponseDetailModal
        responseId={selectedResponseId}
        onOpenChange={(open) => {
          if (!open) setSelectedResponseId(undefined);
        }}
      />
    </div>
  );
}
