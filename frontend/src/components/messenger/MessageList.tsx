'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

import {
  MessageBubble,
  type ChatMessage,
} from '@/components/messenger/MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  currentUserId: string;
  isLoading?: boolean;
  isGroup?: boolean;
}

export function MessageList({
  messages,
  currentUserId,
  isLoading = false,
  isGroup = false,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading) {
      bottomRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'end',
      });
    }
  }, [messages, isLoading]);

  return (
    <div
      role="region"
      aria-label="Historial de mensajes"
      aria-busy={isLoading}
      tabIndex={0}
      className="min-h-0 flex-1 overflow-y-auto overscroll-contain scroll-smooth bg-slate-50/50 p-4"
    >
      {isLoading && messages.length === 0 ? (
        <div
          role="status"
          className="flex h-full min-h-[120px] items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" />
          <span>Cargando mensajes...</span>
        </div>
      ) : messages.length === 0 ? (
        <p
          role="status"
          className="flex h-full min-h-[120px] items-center justify-center text-sm text-muted-foreground"
        >
          No hay mensajes aún
        </p>
      ) : (
        <ul aria-label="Mensajes" className="space-y-3">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageBubble
                message={message}
                currentUserId={currentUserId}
                isGroup={isGroup}
              />
            </li>
          ))}
        </ul>
      )}

      <div ref={bottomRef} aria-hidden="true" />
    </div>
  );
}
