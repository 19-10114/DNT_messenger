import React from 'react';

import { Progress } from '@/components/ui/progress.component';
import { cn } from '@/lib/utils';
import { BikeRequestStatus } from '@/services/bikeRequests/types';
import { BIKE_REQUEST_PROGRESS_TONES } from './bikeRequests.utils';

interface BikeRequestProgressProps {
  delivered: number;
  requested: number;
  status: BikeRequestStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/** Barra de avance de una solicitud con su "8 / 10" al lado. */
export function BikeRequestProgress({
  delivered,
  requested,
  status,
  size = 'sm',
  className,
}: BikeRequestProgressProps) {
  return (
    <div className={cn('flex min-w-[8rem] items-center gap-2', className)}>
      <Progress
        value={delivered}
        max={requested}
        size={size}
        tone={BIKE_REQUEST_PROGRESS_TONES[status]}
        aria-label="Motos entregadas"
        aria-valuetext={`${delivered} de ${requested} motos entregadas`}
        className="flex-1"
      />
      <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-600">
        {delivered} / {requested}
      </span>
    </div>
  );
}
