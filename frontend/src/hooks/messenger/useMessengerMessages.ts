'use client';

import { useCallback } from 'react';
import { toChatMessage, type ChatMessage } from '@/components/messenger/MessageBubble';
import { usePollingResource } from '@/hooks/messenger/usePollingResource';
import { messengerService } from '@/services/messenger/messenger.service';

const EMPTY_MESSAGES: ChatMessage[] = [];

function sameMessages(previous: ChatMessage[], next: ChatMessage[]): boolean {
  return previous.length === next.length && previous.every((message, index) => {
    const candidate = next[index];
    return message.id === candidate.id &&
      message.content === candidate.content &&
      message.senderId === candidate.senderId &&
      message.senderName === candidate.senderName &&
      message.createdAt === candidate.createdAt;
  });
}

export function useMessengerMessages(token: string | undefined, conversationId?: number) {
  const load = useCallback(async (): Promise<ChatMessage[]> => {
    if (!token || conversationId === undefined) return EMPTY_MESSAGES;
    const messages = await messengerService.getMessages(conversationId, token);
    const map = new Map<string, ChatMessage>();
    messages.map(toChatMessage).forEach((m) => map.set(m.id, m));
    return Array.from(map.values());
  }, [token, conversationId]);

  const { data, loading, error, refresh } = usePollingResource({
    resourceKey: `messages:${token ?? ''}:${conversationId ?? 'none'}`,
    enabled: Boolean(token) && conversationId !== undefined,
    load,
    initialData: EMPTY_MESSAGES,
    equals: sameMessages,
    errorMessage: 'No se pudieron cargar los mensajes',
  });

  return { messages: data, loading, error, refresh };
}
