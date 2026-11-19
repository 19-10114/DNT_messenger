import React from 'react';

import { cn } from '@/lib/utils';
import { BikeRequestStatus } from '@/services/bikeRequests/types';
import {
  BIKE_REQUEST_STATUS_CLASSES,
  BIKE_REQUEST_STATUS_DOT_CLASSES,
  BIKE_REQUEST_STATUS_LABELS,
} from './bikeRequests.utils';

interface BikeRequestStatusBadgeProps {
  status: BikeRequestStatus;
  className?: string;
}

/** Estado de una solicitud de Arranca como pastilla; el color siempre va con su etiqueta. */
export function BikeRequestStatusBadge({
  status,
  className,
}: BikeRequestStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        BIKE_REQUEST_STATUS_CLASSES[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          BIKE_REQUEST_STATUS_DOT_CLASSES[status]
        )}
      />
      {BIKE_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}
