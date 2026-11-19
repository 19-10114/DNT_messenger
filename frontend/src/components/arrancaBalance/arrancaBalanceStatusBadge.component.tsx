import React from 'react';

import { cn } from '@/lib/utils';
import { ArrancaBalanceStatus } from '@/services/arrancaBalance/types';
import {
  ARRANCA_BALANCE_STATUS_CLASSES,
  ARRANCA_BALANCE_STATUS_DOT_CLASSES,
  ARRANCA_BALANCE_STATUS_LABELS,
} from './arrancaBalance.utils';

interface ArrancaBalanceStatusBadgeProps {
  status: ArrancaBalanceStatus;
  className?: string;
}

/** Estado de un movimiento con Arranca como pastilla; el color siempre va con su etiqueta. */
export function ArrancaBalanceStatusBadge({
  status,
  className,
}: ArrancaBalanceStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        ARRANCA_BALANCE_STATUS_CLASSES[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          ARRANCA_BALANCE_STATUS_DOT_CLASSES[status]
        )}
      />
      {ARRANCA_BALANCE_STATUS_LABELS[status]}
    </span>
  );
}
