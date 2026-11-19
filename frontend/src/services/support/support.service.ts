import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import {
  AddSupportCommentInput,
  ConfirmSupportTicketInput,
  CreateSupportTicketInput,
  GetMySupportTicketsParams,
  GetSupportInboxParams,
  SupportEnvelope,
  SupportTicketDetail,
  SupportTicketEvent,
  SupportTicketsPage,
  SupportUnreadCount,
  UpdateSupportTicketInput,
} from './types';

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

function cleanParams(query: object): { [key: string]: string | number } {
  const params: { [key: string]: string | number } = {};
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params[key] = value as string | number;
    }
  });
  return params;
}

/** Reportes a soporte: crear, seguir la conversación y (el equipo) gestionarlos */
export class SupportService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Crea un reporte con sus adjuntos (multipart).
   * @param token - Token de autenticación
   * @param input - Campos del formulario, contexto técnico y archivos
   */
  public async createTicket(
    token: string,
    input: CreateSupportTicketInput
  ): Promise<SupportTicketDetail> {
    const form = new FormData();
    form.append('kind', input.kind);
    form.append('title', input.title);
    form.append('description', input.description);
    form.append('impact', input.impact);
    if (input.branchId) form.append('branchId', String(input.branchId));
    form.append('context', JSON.stringify(input.context));
    input.files.forEach((file) => form.append('files', file, file.name));
    if (input.screenshot) {
      form.append('screenshot', input.screenshot, input.screenshot.name);
    }

    const response = await this.service.post<
      SupportEnvelope<SupportTicketDetail>
    >({
      endpoint: '/support/tickets',
      data: form,
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  /** Reportes de quien consulta, de la última novedad a la más antigua */
  public async getMyTickets(
    token: string,
    params: GetMySupportTicketsParams = {}
  ): Promise<SupportTicketsPage> {
    const response = await this.service.get<
      SupportEnvelope<SupportTicketsPage>
    >({
      endpoint: '/support/tickets/mine',
      params: cleanParams(params),
      token,
    });
    return response.data;
  }

  /** Todos los reportes (solo el equipo), con contadores por estado */
  public async getInbox(
    token: string,
    params: GetSupportInboxParams = {}
  ): Promise<SupportTicketsPage> {
    const response = await this.service.get<
      SupportEnvelope<SupportTicketsPage>
    >({
      endpoint: '/support/tickets',
      params: cleanParams(params),
      token,
    });
    return response.data;
  }

  /** Detalle y conversación. Consultarlo lo marca como visto. */
  public async getTicket(
    token: string,
    ticketId: number
  ): Promise<SupportTicketDetail> {
    const response = await this.service.get<
      SupportEnvelope<SupportTicketDetail>
    >({
      endpoint: `/support/tickets/${ticketId}`,
      token,
    });
    return response.data;
  }

  /** Solo el equipo: estado, prioridad, asignación, duplicado */
  public async updateTicket(
    token: string,
    ticketId: number,
    input: UpdateSupportTicketInput
  ): Promise<SupportTicketDetail> {
    const response = await this.service.patch<
      SupportEnvelope<SupportTicketDetail>
    >({
      endpoint: `/support/tickets/${ticketId}`,
      data: input,
      token,
    });
    return response.data;
  }

  /** Respuesta (o nota interna del equipo) con adjuntos */
  public async addComment(
    token: string,
    ticketId: number,
    input: AddSupportCommentInput
  ): Promise<SupportTicketEvent> {
    const form = new FormData();
    form.append('body', input.body);
    if (input.internal) form.append('internal', 'true');
    input.files.forEach((file) => form.append('files', file, file.name));

    const response = await this.service.post<
      SupportEnvelope<SupportTicketEvent>
    >({
      endpoint: `/support/tickets/${ticketId}/comments`,
      data: form,
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }

  /** Quien reporta confirma que ya funciona, o lo reabre */
  public async confirmTicket(
    token: string,
    ticketId: number,
    input: ConfirmSupportTicketInput
  ): Promise<SupportTicketDetail> {
    const response = await this.service.post<
      SupportEnvelope<SupportTicketDetail>
    >({
      endpoint: `/support/tickets/${ticketId}/confirm`,
      data: input,
      token,
    });
    return response.data;
  }

  /** Contador del botón de soporte */
  public async getUnreadCount(token: string): Promise<SupportUnreadCount> {
    const response = await this.service.get<
      SupportEnvelope<SupportUnreadCount>
    >({
      endpoint: '/support/tickets/unread-count',
      token,
    });
    return response.data;
  }
}
