import React from 'react';

import { cn } from '@/lib/utils';
import { GpsStatus } from '@/services/gps/types';
import {
  GPS_STATUS_CLASSES,
  GPS_STATUS_DOT_CLASSES,
  GPS_STATUS_LABELS,
} from './gps.utils';

interface GpsStatusBadgeProps {
  status: GpsStatus;
  className?: string;
}

/**
 * Estado de una unidad GPS como pastilla. El color siempre acompaña a la
 * etiqueta, nunca la reemplaza.
 */
export function GpsStatusBadge({ status, className }: GpsStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        GPS_STATUS_CLASSES[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          GPS_STATUS_DOT_CLASSES[status]
        )}
      />
      {GPS_STATUS_LABELS[status]}
    </span>
  );
}
