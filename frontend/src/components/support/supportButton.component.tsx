'use client';

import React from 'react';
import Link from 'next/link';
import { LifeBuoy, MessageSquare } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORT } from '@/constants/routes';
import { useSupportUnreadCount } from '@/hooks/support';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import {
  useIsReportDialogOpen,
  useSupportDialogActions,
} from '@/stores/support/supportDialog.store';
import { ReportTicketDialog } from './reportTicketDialog.component';
import { isSupportAgent } from './support.utils';

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="ml-auto rounded-full bg-sky-500 px-1.5 text-[11px] font-semibold text-white">
      {count > 99 ? '99+' : count}
    </span>
  );
}

/**
 * Botón "Soporte" de la isla superior: reportar un problema desde cualquier
 * pantalla e ir a la página de soporte (sus reportes, o todos para el
 * equipo). El contador suma las novedades propias y, para el equipo, las de
 * todos los reportes.
 *
 * Monta el único formulario de reporte; el resto de puntos de entrada lo abre
 * con `useSupportDialogActions().openReportDialog`.
 */
export function SupportButton() {
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const isAgent = isSupportAgent(roles, isSuperuser, isStaff);
  const { unreadMine, unreadInbox } = useSupportUnreadCount();
  const isOpen = useIsReportDialogOpen();
  const { openReportDialog, setReportDialogOpen } = useSupportDialogActions();

  const total = unreadMine + (isAgent ? unreadInbox : 0);

  return (
    <>
      {/* No modal: este menú abre el formulario de soporte (un Dialog), y
          Radix, en versiones distintas para Menu y Dialog, deja el body con
          pointer-events: none si un modal se abre desde otro modal. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger
          className={cn(
            'relative inline-flex h-9 items-center gap-2 rounded-full px-2 text-sm font-medium text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary xl:px-3'
          )}
          aria-label={total > 0 ? `Soporte, ${total} novedades` : 'Soporte'}
        >
          <LifeBuoy className="h-5 w-5" aria-hidden />
          <span className="hidden xl:inline">Soporte</span>
          {total > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-sky-400 px-1 text-[10px] font-bold text-white ring-2 ring-neutral-950">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuItem onSelect={() => openReportDialog()}>
            <LifeBuoy className="mr-2 h-4 w-4" aria-hidden />
            Reportar un problema
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={SUPPORT}>
              <MessageSquare className="mr-2 h-4 w-4" aria-hidden />
              {isAgent ? 'Ver reportes' : 'Mis reportes'}
              <CountBadge count={total} />
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportTicketDialog open={isOpen} onOpenChange={setReportDialogOpen} />
    </>
  );
}
