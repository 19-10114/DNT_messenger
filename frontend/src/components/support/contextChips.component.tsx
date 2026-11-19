'use client';

import React from 'react';
import { AlertTriangle, ChevronDown, Monitor, X } from 'lucide-react';

import { cn } from '@/lib/utils';
import { SupportContext } from '@/services/support/types';
import { ApiErrorList } from './apiErrorList.component';
import { describeUserAgent } from './support.utils';

interface ContextChipsProps {
  context: SupportContext;
  /** Quita del reporte los errores de la API */
  onRemoveApiError?: () => void;
}

function Chip({
  children,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  tone?: 'neutral' | 'danger';
}) {
  return (
    <span
      className={cn(
        'inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-xs [&>span]:truncate',
        tone === 'danger'
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-gray-200 bg-gray-50 text-gray-600'
      )}
    >
      {children}
    </span>
  );
}

/**
 * Lo que se adjunta solo al reporte, a la vista: quien reporta sabe qué se
 * envía y el equipo no tiene que preguntar "¿en qué pantalla estabas?".
 */
export function ContextChips({ context, onRemoveApiError }: ContextChipsProps) {
  const [showDetail, setShowDetail] = React.useState(false);
  const errors = context.recentApiErrors ?? [];

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md bg-gray-50/60 p-3">
      <p className="text-xs font-medium text-gray-500">
        Se adjunta automáticamente
      </p>
      <div className="flex flex-wrap gap-1.5">
        <Chip>
          <span>Página: {context.path ?? '—'}</span>
        </Chip>
        {context.branchName && <Chip>Sucursal: {context.branchName}</Chip>}
        <Chip>
          <Monitor className="h-3 w-3" aria-hidden />
          {describeUserAgent(context.userAgent)}
        </Chip>
        {errors.length > 0 && (
          <Chip tone="danger">
            <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden />
            <span>
              {errors.length === 1
                ? `Último error: ${errors[0].status || 'sin conexión'} en ${errors[0].endpoint}`
                : `${errors.length} errores recientes · último en ${errors[0].endpoint}`}
            </span>
            {onRemoveApiError && (
              <button
                type="button"
                onClick={onRemoveApiError}
                className="ml-0.5 shrink-0 rounded-full p-0.5 hover:bg-red-100"
                aria-label="No incluir los errores"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </Chip>
        )}
      </div>
      <button
        type="button"
        onClick={() => setShowDetail((value) => !value)}
        className="inline-flex w-fit items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
        aria-expanded={showDetail}
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            showDetail && 'rotate-180'
          )}
          aria-hidden
        />
        {showDetail ? 'Ocultar detalle' : 'Ver detalle'}
      </button>
      {showDetail && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-gray-600">
          {context.query && (
            <>
              <dt className="text-gray-400">Parámetros</dt>
              <dd className="break-all">{context.query}</dd>
            </>
          )}
          <dt className="text-gray-400">Navegador</dt>
          <dd className="break-all">{context.userAgent}</dd>
          {context.screen && (
            <>
              <dt className="text-gray-400">Pantalla</dt>
              <dd>
                {context.screen.width}×{context.screen.height}
                {context.viewport &&
                  ` (ventana ${context.viewport.width}×${context.viewport.height})`}
              </dd>
            </>
          )}
          {context.appVersion && (
            <>
              <dt className="text-gray-400">Versión</dt>
              <dd>{context.appVersion}</dd>
            </>
          )}
          {errors.length > 0 && (
            <>
              <dt className="text-gray-400">Errores</dt>
              <dd className="min-w-0">
                <ApiErrorList errors={errors} />
              </dd>
            </>
          )}
        </dl>
      )}
    </div>
  );
}
