import React from 'react';

import { SupportApiError } from '@/services/support/types';
import { formatSupportDateTime } from './support.utils';

/** El backend devuelve el payload como texto JSON: se formatea para leerlo */
function formatPayload(payload: unknown): string {
  if (typeof payload === 'string') {
    try {
      return JSON.stringify(JSON.parse(payload), null, 2);
    } catch {
      return payload; // recortado: ya no es JSON válido
    }
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

/**
 * Errores de la API adjuntos a un reporte, el más reciente primero. Cada uno
 * se despliega para ver lo que se envió (parámetros o cuerpo).
 */
export function ApiErrorList({ errors }: { errors: SupportApiError[] }) {
  return (
    <ol className="flex flex-col gap-1.5">
      {errors.map((error, index) => (
        <li key={`${error.at}-${index}`} className="min-w-0">
          <details className="rounded-md border border-red-100 bg-red-50/40 px-2 py-1 text-xs">
            <summary className="cursor-pointer select-none break-all">
              <span className="font-medium text-red-700">
                {error.method} {error.endpoint} →{' '}
                {error.status || 'sin respuesta'}
              </span>
              {error.at && (
                <span className="text-gray-400">
                  {' '}
                  · {formatSupportDateTime(error.at)}
                </span>
              )}
            </summary>
            {error.message && (
              <p className="mt-1 break-words text-gray-600">{error.message}</p>
            )}
            {error.payload !== undefined ? (
              <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap break-all rounded bg-white p-2 font-mono text-[11px] text-gray-700">
                {formatPayload(error.payload)}
              </pre>
            ) : error.method !== 'GET' ? (
              <p className="mt-1 text-gray-400">Sin payload</p>
            ) : null}
          </details>
        </li>
      ))}
    </ol>
  );
}
