import React from 'react';

import { Progress } from '@/components/ui/progress.component';
import { cn } from '@/lib/utils';
import { ApprovalStatus } from '@/services/approvals/types';
import { APPROVAL_PROGRESS_TONES } from './approvals.utils';

/** Barra de avance de una aprobación con su "8 / 10" al lado. */
export function ApprovalProgress({
  received,
  requested,
  status,
  size = 'sm',
  className,
}: {
  received: number;
  requested: number;
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-[8rem] items-center gap-2', className)}>
      <Progress
        value={received}
        max={requested}
        size={size}
        tone={APPROVAL_PROGRESS_TONES[status]}
        aria-label="Motos recibidas"
        aria-valuetext={`${received} de ${requested} motos recibidas`}
        className="flex-1"
      />
      <span className="whitespace-nowrap text-xs font-medium tabular-nums text-gray-600">
        {received} / {requested}
      </span>
    </div>
  );
}
