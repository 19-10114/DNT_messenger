'use client';

import React from 'react';
import Link from 'next/link';
import axios from 'axios';
import {
  AlertTriangle,
  ChevronLeft,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Textarea } from '@/components/ui/textarea.component';
import { useToast } from '@/components/ui/use-toast';
import { SUPPORT, SUPPORT_TICKET } from '@/constants/routes';
import { useConfirmSupportTicket, useSupportTicket } from '@/hooks/support';
import { useSupportDialogActions } from '@/stores/support/supportDialog.store';
import { SupportTicketDetail } from '@/services/support/types';
import { AttachmentGallery } from './attachmentGallery.component';
import { ReplyBox } from './replyBox.component';
import { TicketAgentPanel } from './ticketAgentPanel.component';
import {
  TicketKindIcon,
  TicketPriorityBadge,
  TicketStatusBadge,
} from './ticketBadges.component';
import { TicketConversation } from './ticketConversation.component';
import {
  KIND_CONFIG,
  formatSupportDateTime,
  formatTicketNumber,
  getSupportErrorMessage,
} from './support.utils';

interface TicketDetailProps {
  ticketId: number;
}

/** "¿Ya funciona?" cuando el equipo lo marcó resuelto */
function ConfirmBanner({ ticket }: { ticket: SupportTicketDetail }) {
  const { toast } = useToast();
  const { confirmSupportTicket, isConfirmingTicket } = useConfirmSupportTicket(
    ticket.id
  );
  const [explaining, setExplaining] = React.useState(false);
  const [body, setBody] = React.useState('');

  const confirm = async (works: boolean) => {
    try {
      await confirmSupportTicket({ works, body: body.trim() || undefined });
      toast({
        title: works
          ? '¡Gracias! Reporte cerrado.'
          : 'Reabierto. El equipo lo revisará de nuevo.',
      });
    } catch (error) {
      toast({
        title: 'No se pudo enviar',
        description: getSupportErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
      <div className="flex gap-3">
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
          aria-hidden
        />
        <div className="flex flex-col gap-1">
          <p className="font-medium text-emerald-900">
            El equipo marcó este reporte como resuelto. ¿Ya funciona?
          </p>
          {ticket.resolution && (
            <p className="whitespace-pre-wrap text-sm text-emerald-900/80">
              {ticket.resolution}
            </p>
          )}
          <p className="text-xs text-emerald-900/60">
            Si no respondes en 7 días, el reporte se cerrará solo.
          </p>
        </div>
      </div>
      {explaining ? (
        <div className="flex flex-col gap-2">
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            placeholder="¿Qué sigue pasando?"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExplaining(false)}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => confirm(false)}
              disabled={isConfirmingTicket}
            >
              {isConfirmingTicket && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Reabrir reporte
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 sm:ml-8">
          <Button
            size="sm"
            onClick={() => confirm(true)}
            disabled={isConfirmingTicket}
          >
            {isConfirmingTicket && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Sí, ya funciona
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setExplaining(true)}
          >
            No, sigue fallando
          </Button>
        </div>
      )}
    </div>
  );
}

/** Quien reportó, en un ticket cerrado o descartado: ya no puede escribir */
function ClosedNotice() {
  const { openReportDialog } = useSupportDialogActions();
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-gray-50 p-4">
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <Lock className="h-4 w-4 shrink-0 text-gray-400" aria-hidden />
        Este reporte está cerrado. Si el problema vuelve, crea uno nuevo.
      </p>
      <Button size="sm" variant="outline" onClick={() => openReportDialog()}>
        Reportar
      </Button>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-4">
      <div className="h-6 w-40 rounded bg-gray-200" />
      <div className="h-8 w-2/3 rounded bg-gray-200" />
      <div className="h-32 rounded bg-gray-100" />
      <div className="h-24 rounded bg-gray-100" />
    </div>
  );
}

/**
 * Detalle de un reporte. Quien reporta lee lo que el equipo deja en el ticket
 * y le escribe mientras no esté cerrado; al resolverse confirma o reabre (y
 * escribir también lo reabre). El equipo (Super Admin, según el backend en
 * `viewer.isAgent`) añade información o notas internas y tiene el panel de
 * gestión.
 */
export function TicketDetail({ ticketId }: TicketDetailProps) {
  const { ticket, isLoadingTicket, isErrorTicket, ticketError, refetchTicket } =
    useSupportTicket(ticketId);
  const backHref = SUPPORT;
  const backLabel = ticket?.viewer.isAgent ? 'Soporte' : 'Mis reportes';

  const back = (
    <Link
      href={backHref}
      className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {backLabel}
    </Link>
  );

  if (isLoadingTicket) {
    return (
      <div className="flex flex-col gap-4">
        {back}
        <DetailSkeleton />
      </div>
    );
  }

  if (isErrorTicket || !ticket) {
    const notFound =
      axios.isAxiosError(ticketError) && ticketError.response?.status === 404;
    return (
      <div className="flex flex-col gap-4">
        {back}
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-gray-400" aria-hidden />
          <p className="font-medium text-gray-700">
            {notFound
              ? 'No encontramos este reporte'
              : 'No se pudo cargar el reporte'}
          </p>
          <p className="text-sm text-gray-500">
            {notFound
              ? 'Puede que no exista o que no sea tuyo.'
              : 'Revisa tu conexión e intenta de nuevo.'}
          </p>
          {!notFound && (
            <Button variant="outline" size="sm" onClick={() => refetchTicket()}>
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const agentView = ticket.viewer.isAgent;
  const onExpired = () => void refetchTicket();

  const main = (
    <div className="flex min-w-0 flex-col gap-5">
      {ticket.viewer.canConfirm && <ConfirmBanner ticket={ticket} />}

      {ticket.duplicateOf && (
        <div className="flex items-center gap-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
          <Copy className="h-4 w-4 text-gray-500" aria-hidden />
          Es un duplicado de{' '}
          <Link
            href={SUPPORT_TICKET(ticket.duplicateOf.id)}
            className="font-medium text-primary hover:underline"
          >
            {formatTicketNumber(ticket.duplicateOf.id)} ·{' '}
            {ticket.duplicateOf.title}
          </Link>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-lg border bg-white p-4">
        <p className="text-xs text-gray-400">
          {ticket.reporter?.label ?? 'Alguien'} reportó ·{' '}
          {formatSupportDateTime(ticket.createdAt)}
          {ticket.branch ? ` · ${ticket.branch.name}` : ''}
        </p>
        <p className="whitespace-pre-wrap break-words text-sm text-gray-800">
          {ticket.description}
        </p>
        <AttachmentGallery
          attachments={ticket.attachments}
          onExpired={onExpired}
        />
        {agentView && ticket.screenshot && (
          <div className="flex flex-col gap-1 border-t pt-3">
            <p className="text-xs font-medium text-gray-500">
              Captura automática de la pantalla{' '}
              <span className="font-normal text-gray-400">
                · quien reportó no la ve
              </span>
            </p>
            <AttachmentGallery
              attachments={[ticket.screenshot]}
              onExpired={onExpired}
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-700">
          Información del ticket
        </h2>
        <TicketConversation
          ticket={ticket}
          agentView={agentView}
          onAttachmentExpired={onExpired}
        />
      </section>

      {ticket.viewer.canComment ? (
        <ReplyBox
          ticketId={ticket.id}
          mode={agentView ? 'agent' : 'reporter'}
          reopens={!agentView && ticket.status === 'resolved'}
        />
      ) : (
        !agentView && <ClosedNotice />
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {back}
      <header className="flex flex-col gap-2">
        <div className="flex items-start gap-3">
          <TicketKindIcon kind={ticket.kind} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="break-words font-serif text-xl font-semibold text-gray-900 sm:text-2xl">
              <span className="text-gray-400">
                {formatTicketNumber(ticket.id)}
              </span>{' '}
              {ticket.title}
            </h1>
            <div className="flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} agentView={agentView} />
              <span className="text-xs text-gray-500">
                {KIND_CONFIG[ticket.kind].label}
              </span>
              {agentView && <TicketPriorityBadge priority={ticket.priority} />}
            </div>
          </div>
        </div>
      </header>

      {agentView ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {main}
          <TicketAgentPanel ticket={ticket} />
        </div>
      ) : (
        <div className="max-w-3xl">{main}</div>
      )}
    </div>
  );
}
