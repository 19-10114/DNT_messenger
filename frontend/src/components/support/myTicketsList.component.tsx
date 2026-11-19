'use client';

import React from 'react';
import Link from 'next/link';
import { LifeBuoy, Plus } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { SUPPORT_TICKET } from '@/constants/routes';
import { useMySupportTickets } from '@/hooks/support';
import { useSupportDialogActions } from '@/stores/support/supportDialog.store';
import {
  TicketKindIcon,
  TicketStatusBadge,
  UnreadDot,
} from './ticketBadges.component';
import { formatRelative, formatTicketNumber } from './support.utils';

type Tab = 'open' | 'finished';

const PAGE_SIZE = 15;

/** "Mis reportes": lo que envié a soporte, con lo que tiene novedades primero a la vista */
export function MyTicketsList() {
  const [tab, setTab] = React.useState<Tab>('open');
  const [page, setPage] = React.useState(1);
  const { openReportDialog } = useSupportDialogActions();
  const {
    myTickets,
    myTicketsCounts,
    myTicketsCurrentPage,
    myTicketsTotalPages,
    isLoadingMyTickets,
    isErrorMyTickets,
  } = useMySupportTickets({ status: tab, page, pageSize: PAGE_SIZE });

  const tabs: { value: Tab; label: string; count?: number }[] = [
    { value: 'open', label: 'Abiertos', count: myTicketsCounts.open },
    { value: 'finished', label: 'Cerrados', count: myTicketsCounts.finished },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" className="inline-flex rounded-lg bg-gray-100 p-1">
          {tabs.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={tab === item.value}
              onClick={() => {
                setTab(item.value);
                setPage(1);
              }}
              className={cn(
                'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                tab === item.value
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              )}
            >
              {item.label}
              {item.count !== undefined && (
                <span className="ml-1.5 text-xs text-gray-400">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>
        <Button onClick={() => openReportDialog()}>
          <Plus className="mr-2 h-4 w-4" aria-hidden />
          Nuevo reporte
        </Button>
      </div>

      {isLoadingMyTickets ? (
        <ul className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="h-[72px] animate-pulse rounded-lg bg-gray-100"
            />
          ))}
        </ul>
      ) : isErrorMyTickets ? (
        <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          No se pudieron cargar tus reportes. Intenta de nuevo en un momento.
        </p>
      ) : myTickets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-14 text-center">
          <LifeBuoy className="h-10 w-10 text-gray-300" aria-hidden />
          <p className="font-medium text-gray-700">
            {tab === 'open'
              ? 'No tienes reportes abiertos'
              : 'Todavía no hay reportes cerrados'}
          </p>
          <p className="max-w-sm text-sm text-gray-500">
            ¿Algo no funciona o se podría hacer mejor? Repórtalo desde cualquier
            pantalla con el botón <strong>Soporte</strong> de arriba.
          </p>
          {tab === 'open' && (
            <Button variant="outline" onClick={() => openReportDialog()}>
              Reportar un problema
            </Button>
          )}
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {myTickets.map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={SUPPORT_TICKET(ticket.id)}
                className={cn(
                  'flex items-center gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-primary/40 hover:bg-gray-50',
                  ticket.hasUnread && 'border-sky-200 bg-sky-50/40'
                )}
              >
                <TicketKindIcon kind={ticket.kind} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <p
                    className={cn(
                      'truncate text-sm text-gray-900',
                      ticket.hasUnread && 'font-semibold'
                    )}
                  >
                    <span className="text-gray-400">
                      {formatTicketNumber(ticket.id)}
                    </span>{' '}
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.hasUnread ? (
                      <span className="font-medium text-sky-700">
                        Hay novedades ·{' '}
                      </span>
                    ) : null}
                    Actualizado {formatRelative(ticket.lastActivityAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {ticket.hasUnread && <UnreadDot />}
                  <TicketStatusBadge status={ticket.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {myTicketsTotalPages > 1 && (
        <PaginationComponent
          currentPage={myTicketsCurrentPage}
          totalPages={myTicketsTotalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
