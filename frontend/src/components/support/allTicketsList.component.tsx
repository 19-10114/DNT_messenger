'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { SUPPORT_TICKET } from '@/constants/routes';
import { useSupportDialogActions } from '@/stores/support/supportDialog.store';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useSupportInbox } from '@/hooks/support';
import {
  GetSupportInboxParams,
  SupportStatusFilter,
  SupportTicketKind,
  SupportTicketListItem,
  SupportTicketPriority,
} from '@/services/support/types';
import {
  TicketKindIcon,
  TicketPriorityBadge,
  TicketStatusBadge,
  UnreadDot,
} from './ticketBadges.component';
import {
  AGENT_STATUS_LABELS,
  IMPACT_CLASSES,
  IMPACT_SHORT_LABELS,
  INBOX_STATUS_TABS,
  KIND_CONFIG,
  KIND_ORDER,
  PRIORITY_LABELS,
  PRIORITY_ORDER,
  formatRelative,
  formatTicketNumber,
} from './support.utils';

const PAGE_SIZE = 20;
const ALL = 'all';

type Ordering = NonNullable<GetSupportInboxParams['ordering']>;

const ORDERING_LABELS: Record<Ordering, string> = {
  recent: 'Última actividad',
  priority: 'Prioridad',
  oldest: 'Más antiguos',
};

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-full sm:w-40" aria-label={placeholder}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function TicketCard({
  ticket,
  onOpen,
}: {
  ticket: SupportTicketListItem;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border bg-white p-3 text-left hover:bg-gray-50',
        ticket.hasUnread && 'border-sky-200 bg-sky-50/40'
      )}
    >
      <div className="flex items-start gap-2">
        <TicketKindIcon kind={ticket.kind} size="sm" />
        <p
          className={cn(
            'min-w-0 flex-1 text-sm',
            ticket.hasUnread && 'font-semibold'
          )}
        >
          <span className="text-gray-400">{formatTicketNumber(ticket.id)}</span>{' '}
          {ticket.title}
        </p>
        {ticket.hasUnread && <UnreadDot className="mt-1" />}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        <TicketStatusBadge status={ticket.status} agentView />
        <TicketPriorityBadge priority={ticket.priority} />
        <span className={IMPACT_CLASSES[ticket.impact]}>
          {IMPACT_SHORT_LABELS[ticket.impact]}
        </span>
      </div>
      <p className="text-xs text-gray-500">
        {ticket.reporter?.label}
        {ticket.branch ? ` · ${ticket.branch.name}` : ''} ·{' '}
        {formatRelative(ticket.lastActivityAt)}
      </p>
    </button>
  );
}

/**
 * Todos los reportes, para el equipo de soporte (Super Admin): pestañas por
 * estado con contadores, filtros y búsqueda. Lo que tiene novedades para el
 * equipo se marca con un punto. El estado se cambia desde el detalle.
 */
export function AllTicketsList() {
  const { openReportDialog } = useSupportDialogActions();
  const router = useRouter();
  const isMobile = useIsMobile();

  const [status, setStatus] = React.useState<SupportStatusFilter | typeof ALL>(
    'open'
  );
  const [kind, setKind] = React.useState<string>(ALL);
  const [priority, setPriority] = React.useState<string>(ALL);
  const [ordering, setOrdering] = React.useState<Ordering>('recent');
  const [search, setSearch] = React.useState('');
  const [page, setPage] = React.useState(1);

  const params: GetSupportInboxParams = {
    page,
    pageSize: PAGE_SIZE,
    status: status === ALL ? undefined : status,
    kind: kind === ALL ? undefined : (kind as SupportTicketKind),
    priority:
      priority === ALL
        ? undefined
        : (priority as SupportTicketPriority | 'none'),
    search: search || undefined,
    ordering,
  };

  const {
    inboxTickets,
    inboxCounts,
    inboxCurrentPage,
    inboxTotalPages,
    inboxTotalElements,
    isLoadingInbox,
    isFetchingInbox,
    isErrorInbox,
  } = useSupportInbox(params);

  const withReset =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const open = (id: number) => router.push(SUPPORT_TICKET(id));

  const allCount = Object.entries(inboxCounts)
    .filter(([key]) => (INBOX_STATUS_TABS as string[]).includes(key))
    .reduce((sum, [, n]) => sum + (n ?? 0), 0);

  const tabs: {
    value: SupportStatusFilter | typeof ALL;
    label: string;
    count?: number;
  }[] = [
    { value: 'open', label: 'Abiertos', count: inboxCounts.open },
    ...INBOX_STATUS_TABS.map((value) => ({
      value,
      label: AGENT_STATUS_LABELS[value],
      count: inboxCounts[value] ?? 0,
    })),
    { value: ALL, label: 'Todos', count: allCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div role="tablist" className="flex w-max gap-1 border-b">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={status === tab.value}
              onClick={() => withReset(setStatus)(tab.value)}
              className={cn(
                '-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm transition-colors',
                status === tab.value
                  ? 'border-primary font-semibold text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'ml-1.5 rounded-full px-1.5 text-xs',
                  status === tab.value ? 'bg-primary/10' : 'bg-gray-100'
                )}
              >
                {tab.count ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchInput
          placeholder="Título, descripción, usuario o #N°"
          onSearch={withReset(setSearch)}
          initialValue={search}
          className="w-full sm:w-72"
        />
        <FilterSelect
          value={kind}
          onChange={withReset(setKind)}
          placeholder="Tipo"
          options={[
            { value: ALL, label: 'Todos los tipos' },
            ...KIND_ORDER.map((value) => ({
              value,
              label: KIND_CONFIG[value].label,
            })),
          ]}
        />
        <FilterSelect
          value={priority}
          onChange={withReset(setPriority)}
          placeholder="Prioridad"
          options={[
            { value: ALL, label: 'Toda prioridad' },
            { value: 'none', label: 'Sin prioridad' },
            ...PRIORITY_ORDER.map((value) => ({
              value,
              label: PRIORITY_LABELS[value],
            })),
          ]}
        />
        <FilterSelect
          value={ordering}
          onChange={(value) => withReset(setOrdering)(value as Ordering)}
          placeholder="Orden"
          options={(Object.keys(ORDERING_LABELS) as Ordering[]).map(
            (value) => ({
              value,
              label: `Orden: ${ORDERING_LABELS[value]}`,
            })
          )}
        />
        <Button className="sm:ml-auto" onClick={() => openReportDialog()}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Nuevo reporte
        </Button>
        {isFetchingInbox && !isLoadingInbox && (
          <span className="text-xs text-gray-400">Actualizando…</span>
        )}
      </div>

      {isLoadingInbox ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded bg-gray-100" />
          ))}
        </div>
      ) : isErrorInbox ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar los reportes. Intenta de nuevo en un momento.
        </p>
      ) : inboxTickets.length === 0 ? (
        <div className="rounded-lg border border-dashed py-12 text-center text-sm text-gray-500">
          No hay reportes con estos filtros.
        </div>
      ) : isMobile ? (
        <ul className="flex flex-col gap-2">
          {inboxTickets.map((ticket) => (
            <li key={ticket.id}>
              <TicketCard ticket={ticket} onOpen={() => open(ticket.id)} />
            </li>
          ))}
        </ul>
      ) : (
        <div className="overflow-x-auto rounded-lg border bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="w-6 px-3 py-2" aria-label="Novedades" />
                <th className="px-3 py-2">Reporte</th>
                <th className="px-3 py-2">Prioridad</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Actividad</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {inboxTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => open(ticket.id)}
                  onKeyDown={(event) =>
                    event.key === 'Enter' && open(ticket.id)
                  }
                  tabIndex={0}
                  className={cn(
                    'cursor-pointer hover:bg-gray-50 focus:bg-gray-50 focus:outline-none',
                    ticket.hasUnread && 'bg-sky-50/40'
                  )}
                >
                  <td className="px-3 py-2">
                    {ticket.hasUnread && <UnreadDot />}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <TicketKindIcon kind={ticket.kind} size="sm" />
                      <div className="flex min-w-0 flex-col">
                        <span
                          className={cn(
                            'line-clamp-1',
                            ticket.hasUnread && 'font-semibold'
                          )}
                        >
                          <span className="text-gray-400">
                            {formatTicketNumber(ticket.id)}
                          </span>{' '}
                          {ticket.title}
                        </span>
                        <span className="text-xs text-gray-500">
                          {ticket.reporter?.label}
                          {ticket.branch
                            ? ` · ${ticket.branch.name}`
                            : ''} ·{' '}
                          <span className={IMPACT_CLASSES[ticket.impact]}>
                            {IMPACT_SHORT_LABELS[ticket.impact]}
                          </span>
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <TicketPriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-3 py-2">
                    <TicketStatusBadge status={ticket.status} agentView />
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">
                    {formatRelative(ticket.lastActivityAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-400">
          {inboxTotalElements}{' '}
          {inboxTotalElements === 1 ? 'reporte' : 'reportes'}
        </span>
        {inboxTotalPages > 1 && (
          <PaginationComponent
            currentPage={inboxCurrentPage}
            totalPages={inboxTotalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}
