import { useQuery, useQueryClient } from '@tanstack/react-query';

import { SupportService } from '@/services/support/support.service';
import {
  GetMySupportTicketsParams,
  GetSupportInboxParams,
} from '@/services/support/types';
import { useToken } from '@/stores/auth/auth.store';
import {
  SUPPORT_INBOX_KEY,
  SUPPORT_MY_TICKETS_KEY,
  SUPPORT_TICKET_KEY,
  SUPPORT_UNREAD_KEY,
} from './supportQueryKeys';

const supportService = new SupportService();

/** Cada 60 s: suficiente para "tienes una respuesta" sin cargar el backend */
const UNREAD_POLL_MS = 60_000;

/**
 * Reportes propios, paginados.
 * @param params - Página y filtro de estado (`open` / `finished`)
 */
export function useMySupportTickets(params: GetMySupportTicketsParams) {
  const token = useToken();
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [...SUPPORT_MY_TICKETS_KEY, token, params],
    queryFn: () => supportService.getMyTickets(token as string, params),
    enabled: !!token,
    keepPreviousData: true,
    staleTime: 0,
  });

  return {
    myTickets: data?.results ?? [],
    myTicketsCounts: data?.staticData?.counts ?? {},
    myTicketsCurrentPage: data?.currentPage ?? 1,
    myTicketsTotalPages: data?.totalPages ?? 0,
    isLoadingMyTickets: isLoading,
    isFetchingMyTickets: isFetching,
    isErrorMyTickets: isError,
  };
}

/**
 * Todos los reportes, para el equipo de soporte (la página única de soporte).
 * @param params - Página, filtros y orden
 * @param enabled - `false` para quien no es del equipo
 */
export function useSupportInbox(params: GetSupportInboxParams, enabled = true) {
  const token = useToken();
  const { data, isLoading, isFetching, isError } = useQuery({
    queryKey: [...SUPPORT_INBOX_KEY, token, params],
    queryFn: () => supportService.getInbox(token as string, params),
    enabled: enabled && !!token,
    keepPreviousData: true,
    staleTime: 0,
  });

  return {
    inboxTickets: data?.results ?? [],
    inboxCounts: data?.staticData?.counts ?? {},
    inboxCurrentPage: data?.currentPage ?? 1,
    inboxTotalPages: data?.totalPages ?? 0,
    inboxTotalElements: data?.totalElements ?? 0,
    isLoadingInbox: isLoading,
    isFetchingInbox: isFetching,
    isErrorInbox: isError,
  };
}

/**
 * Detalle de un reporte con su conversación. Siempre fresco: las URLs de los
 * adjuntos pueden estar firmadas por pocos minutos, y abrirlo lo marca visto.
 */
export function useSupportTicket(ticketId: number | undefined) {
  const token = useToken();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: [...SUPPORT_TICKET_KEY, token, ticketId],
    queryFn: () =>
      supportService.getTicket(token as string, ticketId as number),
    enabled: !!token && ticketId !== undefined && !Number.isNaN(ticketId),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
    // Abrirlo lo marca visto en el backend: el contador y el punto de las
    // listas tienen que enterarse
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...SUPPORT_UNREAD_KEY] });
      queryClient.invalidateQueries({ queryKey: [...SUPPORT_MY_TICKETS_KEY] });
      queryClient.invalidateQueries({ queryKey: [...SUPPORT_INBOX_KEY] });
    },
  });

  return {
    ticket: data,
    isLoadingTicket: isLoading,
    isFetchingTicket: isFetching,
    isErrorTicket: isError,
    ticketError: error,
    refetchTicket: refetch,
  };
}

/** Contador del botón de soporte: novedades propias y (equipo) de todos los reportes */
export function useSupportUnreadCount() {
  const token = useToken();
  const { data } = useQuery({
    queryKey: [...SUPPORT_UNREAD_KEY, token],
    queryFn: () => supportService.getUnreadCount(token as string),
    enabled: !!token,
    refetchInterval: UNREAD_POLL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    // Un fallo del contador no merece avisos: se reintenta en el próximo ciclo
    retry: false,
  });

  return {
    unreadMine: data?.mine ?? 0,
    unreadInbox: data?.inbox ?? 0,
  };
}
