'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRightLeft,
  CheckCircle2,
  Copy,
  Flag,
  Lock,
  LucideIcon,
  RotateCcw,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { SUPPORT_TICKET } from '@/constants/routes';
import {
  SupportTicketDetail,
  SupportTicketEvent,
  SupportTicketPriority,
  SupportTicketStatus,
} from '@/services/support/types';
import { AttachmentGallery } from './attachmentGallery.component';
import {
  AGENT_STATUS_LABELS,
  PRIORITY_LABELS,
  STATUS_LABELS,
  formatRelative,
  formatSupportDateTime,
  formatTicketNumber,
} from './support.utils';

interface TicketConversationProps {
  ticket: SupportTicketDetail;
  agentView: boolean;
  onAttachmentExpired?: () => void;
}

function authorName(
  event: SupportTicketEvent,
  ticket: SupportTicketDetail,
  agentView: boolean
) {
  const name = event.author?.label || 'Alguien';
  // Quien reporta ve "Soporte (Luis)"; el equipo ve el nombre tal cual
  if (
    !agentView &&
    event.authorIsAgent &&
    event.author?.id !== ticket.reporter?.id
  ) {
    return `Soporte · ${name}`;
  }
  return name;
}

function systemLine(
  event: SupportTicketEvent,
  agentView: boolean
): { icon: LucideIcon; text: React.ReactNode; tone: string } | null {
  const statusLabels = agentView ? AGENT_STATUS_LABELS : STATUS_LABELS;
  const { payload } = event;
  switch (event.kind) {
    case 'status_changed': {
      const to = payload.to as SupportTicketStatus;
      const label = statusLabels[to] ?? to;
      if (payload.automatic && payload.reason === 'inactivity') {
        return {
          icon: CheckCircle2,
          tone: 'bg-gray-100 text-gray-600',
          text: (
            <>
              Se cerró automáticamente tras 7 días en{' '}
              <strong>{statusLabels.resolved}</strong> sin respuesta
            </>
          ),
        };
      }
      if (payload.automatic) {
        return {
          icon: ArrowRightLeft,
          tone: 'bg-gray-100 text-gray-600',
          text: (
            <>
              Volvió a <strong>{label}</strong> al recibir la respuesta
            </>
          ),
        };
      }
      return {
        icon:
          to === 'resolved' || to === 'closed' ? CheckCircle2 : ArrowRightLeft,
        tone:
          to === 'resolved' || to === 'closed'
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-blue-100 text-blue-700',
        text: (
          <>
            cambió el estado a <strong>{label}</strong>
          </>
        ),
      };
    }
    case 'priority_changed': {
      const to = payload.to as SupportTicketPriority | null;
      return {
        icon: Flag,
        tone: 'bg-orange-100 text-orange-700',
        text: to ? (
          <>
            puso prioridad <strong>{PRIORITY_LABELS[to]}</strong>
          </>
        ) : (
          <>quitó la prioridad</>
        ),
      };
    }
    case 'duplicate_marked':
      return {
        icon: Copy,
        tone: 'bg-gray-100 text-gray-600',
        text: (
          <>
            lo marcó como duplicado de{' '}
            <Link
              className="font-medium text-primary hover:underline"
              href={SUPPORT_TICKET(payload.ticket ?? 0)}
            >
              {formatTicketNumber(payload.ticket ?? 0)}
            </Link>
          </>
        ),
      };
    case 'confirmed':
      return {
        icon: CheckCircle2,
        tone: 'bg-emerald-100 text-emerald-700',
        text: (
          <>
            confirmó que <strong>ya funciona</strong>
          </>
        ),
      };
    case 'reopened':
      return {
        icon: RotateCcw,
        tone: 'bg-red-100 text-red-700',
        text: (
          <>
            indicó que <strong>sigue fallando</strong>
          </>
        ),
      };
    default:
      return null;
  }
}

function Bubble({
  event,
  ticket,
  agentView,
  onAttachmentExpired,
}: {
  event: SupportTicketEvent;
  ticket: SupportTicketDetail;
  agentView: boolean;
  onAttachmentExpired?: () => void;
}) {
  const internal = event.isInternal;
  const fromTeam =
    event.authorIsAgent && event.author?.id !== ticket.reporter?.id;
  return (
    <li
      className={cn(
        'flex flex-col gap-1',
        fromTeam ? 'items-start' : 'items-end'
      )}
    >
      <div
        className={cn(
          'max-w-[90%] rounded-lg border px-3 py-2 sm:max-w-[80%]',
          internal
            ? 'border-amber-200 bg-amber-50'
            : fromTeam
              ? 'border-gray-200 bg-white'
              : 'border-primary/20 bg-primary/5'
        )}
      >
        <p className="mb-1 flex items-center gap-1 text-xs font-semibold text-gray-700">
          {internal && <Lock className="h-3 w-3 text-amber-700" aria-hidden />}
          {authorName(event, ticket, agentView)}
          {internal && (
            <span className="font-normal text-amber-700">· nota interna</span>
          )}
        </p>
        {event.body && (
          <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
            {event.body}
          </p>
        )}
        {event.attachments.length > 0 && (
          <div className="mt-2">
            <AttachmentGallery
              attachments={event.attachments}
              onExpired={onAttachmentExpired}
            />
          </div>
        )}
      </div>
      <time
        className="px-1 text-[11px] text-gray-400"
        dateTime={event.createdAt}
        title={formatSupportDateTime(event.createdAt)}
      >
        {formatRelative(event.createdAt)}
      </time>
    </li>
  );
}

/**
 * La conversación del reporte en orden cronológico: los mensajes como burbujas
 * (los del equipo a la izquierda, los de quien reportó a la derecha) y los
 * cambios de estado como líneas compactas, incluidos los automáticos (reabrir
 * al responder, cerrar tras 7 días). Las notas internas solo llegan al equipo
 * (el backend las filtra).
 */
export function TicketConversation({
  ticket,
  agentView,
  onAttachmentExpired,
}: TicketConversationProps) {
  if (ticket.events.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-400">
        {agentView
          ? 'Todavía no hay información. Lo que publiques aquí lo lee quien reportó.'
          : 'El equipo todavía no ha añadido información. Te avisaremos en el botón de soporte; mientras tanto, puedes escribirles aquí abajo.'}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-4">
      {ticket.events.map((event) => {
        if (event.kind === 'comment' || event.kind === 'internal_note') {
          return (
            <Bubble
              key={event.id}
              event={event}
              ticket={ticket}
              agentView={agentView}
              onAttachmentExpired={onAttachmentExpired}
            />
          );
        }
        const line = systemLine(event, agentView);
        if (!line) return null;
        const { icon: Icon, tone, text } = line;
        return (
          <li key={event.id} className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span
                className={cn(
                  'flex h-6 w-6 shrink-0 items-center justify-center rounded-full',
                  tone
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
              <span>
                {!event.payload.automatic && (
                  <span className="font-semibold">
                    {authorName(event, ticket, agentView)}{' '}
                  </span>
                )}
                {text}
                {event.isInternal && (
                  <Lock
                    className="ml-1 inline h-3 w-3 text-amber-700"
                    aria-label="Solo el equipo"
                  />
                )}
                <span className="text-gray-400">
                  {' '}
                  · {formatRelative(event.createdAt)}
                </span>
              </span>
            </div>
            {(event.payload.resolution || event.body) && (
              <p className="ml-8 whitespace-pre-wrap rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {event.payload.resolution || event.body}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
