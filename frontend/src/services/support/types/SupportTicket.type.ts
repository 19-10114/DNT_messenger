import { Pagination } from '@/models/pagination.model';

export type SupportTicketKind = 'bug' | 'improvement' | 'question';

export type SupportTicketStatus =
  | 'new'
  | 'in_review'
  | 'in_progress'
  | 'waiting_reporter'
  | 'resolved'
  | 'closed'
  | 'discarded';

/** Lo elige quien reporta: "¿puedes seguir trabajando?" */
export type SupportTicketImpact = 'can_work' | 'workaround' | 'blocked';

/** Lo pone el equipo de soporte */
export type SupportTicketPriority = 'low' | 'medium' | 'high' | 'critical';

export type SupportEventKind =
  | 'comment'
  | 'internal_note'
  | 'status_changed'
  | 'priority_changed'
  | 'duplicate_marked'
  | 'confirmed'
  | 'reopened';

export interface SupportPerson {
  id: number | null;
  label: string;
}

export interface SupportAttachment {
  id: number;
  /** Puede ser una URL firmada de corta duración: no guardarla */
  url: string | null;
  originalName: string;
  contentType: string;
  size: number;
  isImage: boolean;
  isVideo: boolean;
  createdAt: string;
  /** `null` = adjunto del reporte inicial */
  event: number | null;
}

export interface SupportTicketEvent {
  id: number;
  kind: SupportEventKind;
  author: SupportPerson | null;
  authorIsAgent: boolean;
  isInternal: boolean;
  body: string;
  payload: {
    from?: string | null;
    to?: string | null;
    resolution?: string;
    automatic?: boolean;
    /** Por qué cambió solo: respuesta de quien reportó o 7 días en Resuelto */
    reason?: 'reply' | 'inactivity';
    ticket?: number;
    title?: string;
  };
  attachments: SupportAttachment[];
  createdAt: string;
}

/**
 * Contexto técnico que se adjunta automáticamente al reporte. El backend
 * guarda solo estas claves (lista blanca) y se lo devuelve solo al equipo.
 */
export interface SupportContext {
  path?: string;
  query?: string;
  branchId?: number;
  branchName?: string;
  appVersion?: string;
  userAgent?: string;
  language?: string;
  timezone?: string;
  screen?: { width: number; height: number };
  viewport?: { width: number; height: number };
  roles?: string[];
  /** Últimos errores de la API (hasta 5, el más reciente primero) */
  recentApiErrors?: SupportApiError[];
  /** Reportes anteriores al historial de 5: solo traen el último error */
  lastApiError?: SupportApiError;
}

export interface SupportApiError {
  endpoint?: string;
  method?: string;
  status?: number;
  message?: string;
  at?: string;
  /** Lo que se envió (parámetros o cuerpo), con secretos tapados */
  payload?: unknown;
}

export interface SupportTicketListItem {
  id: number;
  kind: SupportTicketKind;
  title: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority | null;
  impact: SupportTicketImpact;
  reporter: SupportPerson | null;
  branch: { id: number; name: string } | null;
  /** Hay novedades que quien consulta todavía no vio */
  hasUnread: boolean;
  createdAt: string;
  lastActivityAt: string;
}

export interface SupportTicketDetail extends SupportTicketListItem {
  description: string;
  resolution: string;
  duplicateOf: { id: number; title: string } | null;
  resolvedAt: string | null;
  closedAt: string | null;
  /** Adjuntos del reporte inicial; los de cada mensaje van en su evento */
  attachments: SupportAttachment[];
  /** Captura automática de la pantalla al reportar; `null` para quien reporta */
  screenshot: SupportAttachment | null;
  events: SupportTicketEvent[];
  /** Solo para el equipo; `null` para quien reporta */
  context: SupportContext | null;
  /** Estados a los que el equipo puede moverlo; vacío para quien reporta */
  allowedStatuses: SupportTicketStatus[];
  viewer: {
    isAgent: boolean;
    isReporter: boolean;
    canConfirm: boolean;
    /** El equipo siempre; quien reportó mientras no esté cerrado ni descartado */
    canComment: boolean;
  };
}

export type SupportTicketCounts = Partial<
  Record<SupportTicketStatus | 'open' | 'finished' | 'unread', number>
>;

export interface SupportTicketsPage extends Pagination<SupportTicketListItem> {
  staticData?: { counts: SupportTicketCounts };
}

/** `open` = todo lo no cerrado ni descartado; `finished` = lo contrario */
export type SupportStatusFilter = SupportTicketStatus | 'open' | 'finished';

export interface GetMySupportTicketsParams {
  page?: number;
  pageSize?: number;
  status?: SupportStatusFilter;
}

export interface GetSupportInboxParams {
  page?: number;
  pageSize?: number;
  status?: SupportStatusFilter;
  kind?: SupportTicketKind;
  /** `none` = sin prioridad */
  priority?: SupportTicketPriority | 'none';
  impact?: SupportTicketImpact;
  branch?: number;
  search?: string;
  ordering?: 'recent' | 'priority' | 'oldest';
}

export interface CreateSupportTicketInput {
  kind: SupportTicketKind;
  title: string;
  description: string;
  impact: SupportTicketImpact;
  branchId?: number;
  context: SupportContext;
  files: File[];
  /** Captura automática de la pantalla; solo la ve el equipo */
  screenshot?: File;
}

export interface UpdateSupportTicketInput {
  status?: SupportTicketStatus;
  resolution?: string;
  priority?: SupportTicketPriority | null;
  duplicateOfId?: number;
}

export interface AddSupportCommentInput {
  body: string;
  internal?: boolean;
  files: File[];
}

export interface ConfirmSupportTicketInput {
  works: boolean;
  body?: string;
}

export interface SupportUnreadCount {
  mine: number;
  inbox: number;
}

export interface SupportEnvelope<T> {
  message: string;
  data: T;
}
