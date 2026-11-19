// src/types/messenger.types.ts

export type ConversationType = 'direct' | 'group';

export interface MessengerUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email?: string;
  department?: string | null;
  role?: string | null;
  branchId?: number;
  branchName?: string;
}

export interface Message {
  id: number;
  conversationId: number;
  sender: MessengerUser;
  content: string;
  createdAt: string;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name?: string | null;
  createdAt?: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  members?: MessengerUser[];
  otherMember?: MessengerUser;
  otherUser?: MessengerUser; // Retrocompatibilidad para vistas existentes
  lastMessage?: Message | null;
  participantCount?: number;
  unreadCount?: number;
}

export interface CreateGroupPayload {
  name: string;
  memberIds: number[];
}

export interface SendMessagePayload {
  content: string;
}
