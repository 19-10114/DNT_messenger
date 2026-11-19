import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import type {
  Conversation,
  Message,
  SendMessagePayload,
  CreateGroupPayload,
  MessengerUser,
} from '@/types/messenger.types';

export interface MessengerApiResponse<T> {
  message: string;
  data: T;
}
type EmpleadoApi = {
  id: number;
  username: string;
  first_name?: string;
  firstName?: string;
  last_name?: string;
  lastName?: string;
  email?: string;
  department?: string | null;
  role?: string | null;
  branch_id?: number | null;
  branchId?: number | null;
  branch_name?: string | null;
  branchName?: string | null;
};

type GrupoApi = {
  id: number;
  type: 'group';
  name: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
  last_message_at?: string | null;
  lastMessageAt?: string | null;
  participant_count?: number;
  participantCount?: number;
  unread_count?: number;
  unreadCount?: number;
  members?: EmpleadoApi[];
};

// Pasamos los datos del usuario al formato que usamos (soportando camelCase y snake_case)
function convertirEmpleado(usuario: EmpleadoApi): MessengerUser {
  const firstName = (usuario.firstName ?? usuario.first_name ?? '').trim();
  const lastName = (usuario.lastName ?? usuario.last_name ?? '').trim();
  return {
    id: usuario.id,
    username: usuario.username,
    firstName,
    lastName,
    email: usuario.email,
    department: usuario.department,
    role: usuario.role,
    branchId: usuario.branchId ?? usuario.branch_id ?? undefined,
    branchName: usuario.branchName ?? usuario.branch_name ?? undefined,
  };
}

export class MessengerService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Obtiene la lista de conversaciones del usuario autenticado.
   */
  public async getConversations(token?: string): Promise<Conversation[]> {
    const response = await this.service.get<MessengerApiResponse<Conversation[]>>({
      endpoint: '/messenger/conversations/',
      token,
    });
    return response.data;
  }


  /**
   * Obtiene o crea una conversación directa 1 a 1 de forma idempotente con otro usuario.
   */
  public async getOrCreateDirectConversation(
    userId: number,
    token?: string
  ): Promise<Conversation> {
    const response = await this.service.post<MessengerApiResponse<Conversation>>({
      endpoint: '/messenger/conversations/direct/',
      data: { userId },
      token,
    });
    return response.data;
  }

  /**
   * Obtiene el historial de mensajes de una conversación específica.
   */
  public async getMessages(
    conversationId: number,
    token?: string
  ): Promise<Message[]> {
    const response = await this.service.get<MessengerApiResponse<Message[]>>({
      endpoint: `/messenger/conversations/${conversationId}/messages/`,
      token,
    });
    return response.data;
  }

  /**
   * Envía un mensaje a una conversación específica.
   */
  public async sendMessage(
    conversationId: number,
    payload: SendMessagePayload,
    token?: string
  ): Promise<Message> {
    const response = await this.service.post<MessengerApiResponse<Message>>({
      endpoint: `/messenger/conversations/${conversationId}/messages/`,
      data: payload,
      token,
    });
    return response.data;
  }
  // Buscamos los empleados
  async getEmployees(
    token?: string,
    branchId?: number,
    buscar = ''
  ): Promise<MessengerUser[]> {
    if (!token) return [];

    const filtros = new URLSearchParams();

    if (branchId) {
      filtros.set('branch', String(branchId));
    }

    if (buscar.trim() !== '') {
      filtros.set('search', buscar.trim());
    }

    let ruta = '/messenger/users/';

    if (filtros.toString() !== '') {
      ruta = ruta + '?' + filtros.toString();
    }

    const resp = await this.service.get<MessengerApiResponse<EmpleadoApi[]>>({
      endpoint: ruta,
      token
    });

    const usuarios = resp.data.map(convertirEmpleado);
    return usuarios;
  }

  // Creamos el grupo con los usuarios que elegimos
  async createGroup(
    token: string,
    datos: CreateGroupPayload
  ): Promise<Conversation> {
    const resp = await this.service.post<MessengerApiResponse<GrupoApi>>({
      endpoint: '/messenger/conversations/group/',
      data: {
        name: datos.name,
        memberIds: datos.memberIds
      },
      token
    });

    const grupo = resp.data;

    return {
      id: grupo.id,
      type: grupo.type,
      name: grupo.name,
      createdAt: grupo.createdAt ?? grupo.created_at ?? '',
      updatedAt: grupo.updatedAt ?? grupo.updated_at ?? '',
      lastMessageAt: grupo.lastMessageAt ?? grupo.last_message_at ?? null,
      participantCount: grupo.participantCount ?? grupo.participant_count ?? 0,
      unreadCount: grupo.unreadCount ?? grupo.unread_count ?? 0,
      members: grupo.members?.map(convertirEmpleado) ?? []
    };
  } 
}

export const messengerService = new MessengerService();
