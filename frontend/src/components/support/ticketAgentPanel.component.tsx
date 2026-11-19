'use client';

import React from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { useUpdateSupportTicket } from '@/hooks/support';
import {
  SupportTicketDetail,
  SupportTicketPriority,
  SupportTicketStatus,
  UpdateSupportTicketInput,
} from '@/services/support/types';
import {
  AGENT_STATUS_LABELS,
  IMPACT_CLASSES,
  IMPACT_SHORT_LABELS,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  describeUserAgent,
  formatSupportDateTime,
  getSupportErrorMessage,
} from './support.utils';
import { ApiErrorList } from './apiErrorList.component';

const NONE = 'none';

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border bg-white p-4">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[96px_1fr] gap-2 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="min-w-0 break-words text-gray-800">{children}</span>
    </div>
  );
}

/**
 * Columna del equipo en el detalle: estado, prioridad, duplicado y el contexto técnico que se adjuntó al reportar.
 */
export function TicketAgentPanel({ ticket }: { ticket: SupportTicketDetail }) {
  const { toast } = useToast();
  const { updateSupportTicket, isUpdatingTicket } = useUpdateSupportTicket(
    ticket.id
  );
  const [pendingResolve, setPendingResolve] = React.useState(false);
  const [resolution, setResolution] = React.useState('');
  const [duplicateOf, setDuplicateOf] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const update = async (input: UpdateSupportTicketInput, success?: string) => {
    try {
      await updateSupportTicket(input);
      if (success) toast({ title: success });
      return true;
    } catch (error) {
      toast({
        title: 'No se pudo actualizar',
        description: getSupportErrorMessage(error, 'Intenta de nuevo.'),
        variant: 'destructive',
      });
      return false;
    }
  };

  const onStatusChange = (value: string) => {
    const status = value as SupportTicketStatus;
    if (status === ticket.status) return;
    if (status === 'resolved') {
      setPendingResolve(true);
      return;
    }
    setPendingResolve(false);
    void update({ status });
  };

  const resolve = async () => {
    const ok = await update(
      { status: 'resolved', resolution: resolution.trim() },
      'Reporte resuelto. Quien reportó podrá confirmarlo.'
    );
    if (ok) {
      setPendingResolve(false);
      setResolution('');
    }
  };

  const markDuplicate = async () => {
    const id = Number(duplicateOf.replace('#', ''));
    if (!id) return;
    const ok = await update(
      { duplicateOfId: id },
      `Marcado como duplicado de #${id}`
    );
    if (ok) setDuplicateOf('');
  };

  const context = ticket.context ?? {};
  // Reportes anteriores al historial de 5 traen solo `lastApiError`
  const apiErrors =
    context.recentApiErrors ??
    (context.lastApiError ? [context.lastApiError] : []);
  const copyContext = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          { ticket: ticket.id, title: ticket.title, ...context },
          null,
          2
        )
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast({ title: 'No se pudo copiar', variant: 'destructive' });
    }
  };

  const statusOptions: SupportTicketStatus[] = [
    ticket.status,
    ...ticket.allowedStatuses,
  ];

  return (
    <aside className="flex flex-col gap-4">
      <Section title="Gestión">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">Estado</span>
          <Select
            value={pendingResolve ? 'resolved' : ticket.status}
            onValueChange={onStatusChange}
            disabled={isUpdatingTicket}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((status) => (
                <SelectItem key={status} value={status}>
                  {AGENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {pendingResolve && (
          <div className="flex flex-col gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3">
            <span className="text-sm font-medium text-emerald-900">
              ¿Qué se hizo? Lo verá quien reportó.
            </span>
            <Textarea
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              rows={3}
              placeholder="Ej.: Corregido; ya se pueden guardar órdenes con descuento."
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPendingResolve(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={resolve}
                disabled={!resolution.trim() || isUpdatingTicket}
              >
                {isUpdatingTicket && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Marcar resuelto
              </Button>
            </div>
          </div>
        )}

        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-500">Prioridad</span>
          <Select
            value={ticket.priority ?? NONE}
            onValueChange={(value) =>
              update({
                priority:
                  value === NONE ? null : (value as SupportTicketPriority),
              })
            }
            disabled={isUpdatingTicket}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin prioridad</SelectItem>
              {PRIORITY_ORDER.map((priority) => (
                <SelectItem key={priority} value={priority}>
                  {PRIORITY_LABELS[priority]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {!ticket.duplicateOf && (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-500">Duplicado de</span>
            <div className="flex gap-2">
              <Input
                value={duplicateOf}
                onChange={(event) => setDuplicateOf(event.target.value)}
                placeholder="#N° de reporte"
                inputMode="numeric"
              />
              <Button
                variant="outline"
                onClick={markDuplicate}
                disabled={
                  !Number(duplicateOf.replace('#', '')) || isUpdatingTicket
                }
              >
                Marcar
              </Button>
            </div>
          </div>
        )}
      </Section>

      <Section title="Quién reportó">
        <Row label="Usuario">{ticket.reporter?.label ?? '—'}</Row>
        <Row label="Sucursal">
          {ticket.branch?.name ?? context.branchName ?? '—'}
        </Row>
        <Row label="Impacto">
          <span className={IMPACT_CLASSES[ticket.impact]}>
            {IMPACT_SHORT_LABELS[ticket.impact]}
          </span>
        </Row>
        <Row label="Creado">{formatSupportDateTime(ticket.createdAt)}</Row>
        {ticket.resolvedAt && (
          <Row label="Resuelto">{formatSupportDateTime(ticket.resolvedAt)}</Row>
        )}
      </Section>

      <Section title="Contexto técnico">
        <Row label="Página">
          <code className="text-xs">
            {context.path ?? '—'}
            {context.query ?? ''}
          </code>
        </Row>
        {context.roles && context.roles.length > 0 && (
          <Row label="Roles">{context.roles.join(', ')}</Row>
        )}
        <Row label="Navegador">
          <span title={context.userAgent}>
            {describeUserAgent(context.userAgent)}
          </span>
        </Row>
        {context.screen && (
          <Row label="Pantalla">
            {context.screen.width}×{context.screen.height}
            {context.viewport && (
              <span className="text-gray-400">
                {' '}
                (ventana {context.viewport.width}×{context.viewport.height})
              </span>
            )}
          </Row>
        )}
        {context.appVersion && <Row label="Versión">{context.appVersion}</Row>}
        {apiErrors.length > 0 && (
          <div className="flex flex-col gap-1 text-sm">
            <span className="text-gray-400">
              {apiErrors.length === 1
                ? 'Último error de la API'
                : `Últimos ${apiErrors.length} errores de la API`}
            </span>
            <ApiErrorList errors={apiErrors} />
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="mt-1 w-fit"
          onClick={copyContext}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-600" aria-hidden />
          ) : (
            <Copy className="mr-2 h-4 w-4" aria-hidden />
          )}
          {copied ? 'Copiado' : 'Copiar JSON'}
        </Button>
      </Section>
    </aside>
  );
}
