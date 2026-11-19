import React from 'react';

import { cn } from '@/lib/utils';
import { ApprovalStatus } from '@/services/approvals/types';
import {
  APPROVAL_STATUS_CLASSES,
  APPROVAL_STATUS_DOT_CLASSES,
  APPROVAL_STATUS_LABELS,
} from './approvals.utils';

/** Estado de una aprobación como pastilla; el color siempre va con su etiqueta. */
export function ApprovalStatusBadge({
  status,
  className,
}: {
  status: ApprovalStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        APPROVAL_STATUS_CLASSES[status],
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          APPROVAL_STATUS_DOT_CLASSES[status]
        )}
      />
      {APPROVAL_STATUS_LABELS[status]}
    </span>
  );
}
