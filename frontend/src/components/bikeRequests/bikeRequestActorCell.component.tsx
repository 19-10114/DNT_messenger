import React from 'react';

import { BikeRequestActor } from '@/services/bikeRequests/types';
import {
  BIKE_REQUEST_SYSTEM_LABELS,
  formatBikeRequestDateTime,
} from './bikeRequests.utils';

interface BikeRequestActorCellProps {
  actor: BikeRequestActor | null | undefined;
  date: string | null | undefined;
}

/** Quién y cuándo: "Luis Gómez (Arranca)" y la fecha debajo. */
export function BikeRequestActorCell({
  actor,
  date,
}: BikeRequestActorCellProps) {
  const formattedDate = formatBikeRequestDateTime(date);

  return (
    <div className="flex flex-col leading-tight">
      <span className="whitespace-nowrap text-gray-900">
        {actor?.name || '-'}
        {actor && (
          <span className="ml-1 text-xs text-gray-500">
            ({BIKE_REQUEST_SYSTEM_LABELS[actor.system] ?? actor.system})
          </span>
        )}
      </span>
      {formattedDate && (
        <span className="whitespace-nowrap text-xs tabular-nums text-gray-400">
          {formattedDate}
        </span>
      )}
    </div>
  );
}
