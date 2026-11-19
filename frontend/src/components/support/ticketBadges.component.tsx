import React from 'react';

import { cn } from '@/lib/utils';
import {
  SupportTicketKind,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/services/support/types';
import {
  AGENT_STATUS_LABELS,
  KIND_CONFIG,
  PRIORITY_CLASSES,
  PRIORITY_LABELS,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
} from './support.utils';

export function TicketStatusBadge({
  status,
  agentView = false,
  className,
}: {
  status: SupportTicketStatus;
  /** El equipo lee "Esperando al usuario"; quien reporta, "Esperando tu respuesta" */
  agentView?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold',
        STATUS_BADGE_CLASSES[status],
        className
      )}
    >
      {(agentView ? AGENT_STATUS_LABELS : STATUS_LABELS)[status]}
    </span>
  );
}

export function TicketPriorityBadge({
  priority,
}: {
  priority: SupportTicketPriority | null;
}) {
  if (!priority) {
    return <span className="text-xs text-gray-400">Sin prioridad</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold',
        PRIORITY_CLASSES[priority]
      )}
    >
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

/** Círculo con el ícono del tipo (Error, Mejora, Pregunta) */
export function TicketKindIcon({
  kind,
  size = 'md',
}: {
  kind: SupportTicketKind;
  size?: 'sm' | 'md';
}) {
  const { icon: Icon, tone, label } = KIND_CONFIG[kind];
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full',
        tone,
        size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'
      )}
      title={label}
    >
      <Icon className={size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Punto azul de "hay novedades" */
export function UnreadDot({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'inline-block h-2.5 w-2.5 rounded-full bg-sky-500',
        className
      )}
      aria-label="Con novedades"
    />
  );
}
