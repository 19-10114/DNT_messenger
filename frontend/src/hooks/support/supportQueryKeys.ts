/**
 * Prefijos de las query keys de soporte. Las mutaciones invalidan el prefijo
 * `SUPPORT_QUERY_KEY` completo: listas, detalle y contador cambian juntos.
 */
export const SUPPORT_QUERY_KEY = 'support';
export const SUPPORT_MY_TICKETS_KEY = [SUPPORT_QUERY_KEY, 'mine'] as const;
export const SUPPORT_INBOX_KEY = [SUPPORT_QUERY_KEY, 'inbox'] as const;
export const SUPPORT_TICKET_KEY = [SUPPORT_QUERY_KEY, 'ticket'] as const;
export const SUPPORT_UNREAD_KEY = [SUPPORT_QUERY_KEY, 'unread'] as const;
