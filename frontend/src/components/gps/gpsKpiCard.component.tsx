import React from 'react';
import { type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type GpsKpiTone = 'neutral' | 'available' | 'pending' | 'installed';

/**
 * Acento de cada tarjeta. Es el mismo vocabulario de estado que usan las
 * pastillas de la tabla, para que "verde" signifique lo mismo en toda la vista.
 */
const TONE_ICON_CLASSES: Record<GpsKpiTone, string> = {
  neutral: 'bg-gray-100 text-gray-600',
  available: 'bg-emerald-50 text-emerald-600',
  pending: 'bg-amber-50 text-amber-600',
  installed: 'bg-slate-100 text-slate-600',
};

const TONE_METER_CLASSES: Record<GpsKpiTone, string> = {
  neutral: 'bg-gray-400',
  available: 'bg-emerald-500',
  pending: 'bg-amber-500',
  installed: 'bg-slate-400',
};

interface GpsKpiCardProps {
  label: string;
  value: number | string;
  /** Segunda línea: contexto del número (sobre qué total, de qué periodo...). */
  hint?: string;
  icon?: LucideIcon;
  tone?: GpsKpiTone;
  /** 0-100. Dibuja una barra de proporción bajo el valor. */
  meterPercentage?: number;
  isLoading?: boolean;
}

/**
 * Tarjeta de indicador del monitoreo de GPS.
 *
 * Es una ficha de número, no un gráfico: una etiqueta, el valor y, cuando
 * aporta, la proporción sobre el parque total. El valor usa cifras
 * proporcionales (sin `tabular-nums`, que a este tamaño se ve suelto).
 */
export function GpsKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'neutral',
  meterPercentage,
  isLoading = false,
}: GpsKpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium text-gray-500">{label}</span>
        {Icon && (
          <span
            className={cn(
              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
              TONE_ICON_CLASSES[tone]
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="mt-3 h-8 w-20 animate-pulse rounded bg-gray-100" />
      ) : (
        <p className="mt-2 text-3xl font-semibold leading-none text-gray-900">
          {value}
        </p>
      )}

      {typeof meterPercentage === 'number' && !isLoading && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full', TONE_METER_CLASSES[tone])}
            style={{ width: `${Math.min(Math.max(meterPercentage, 0), 100)}%` }}
          />
        </div>
      )}

      {hint && !isLoading && (
        <p className="mt-2 text-xs text-gray-400">{hint}</p>
      )}
    </div>
  );
}
