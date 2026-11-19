'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Message } from '@/types/messenger.types';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName?: string;
  content: string;
  createdAt: string;
}

export function toChatMessage(message: Message): ChatMessage {
  const senderAny = message.sender as
    | (typeof message.sender & { first_name?: string; last_name?: string })
    | undefined;
  const firstName = (senderAny?.firstName ?? senderAny?.first_name ?? '').trim();
  const lastName = (senderAny?.lastName ?? senderAny?.last_name ?? '').trim();

  const senderName =
    [firstName ? `${firstName.charAt(0)}.` : '', lastName]
      .filter(Boolean)
      .join(' ') ||
    message.sender?.username ||
    'Empleado';

  const msgAny = message as Message & { created_at?: string };

  return {
    id: String(message.id),
    senderId: String(message.sender?.id ?? ''),
    senderName,
    content: message.content,
    createdAt: msgAny.createdAt ?? msgAny.created_at ?? '',
  };
}

interface MessageBubbleProps {
  message: ChatMessage;
  currentUserId: string;
  isGroup?: boolean;
}

const MAX_CHAR_THRESHOLD = 500;
const MAX_LINE_THRESHOLD = 8;
const MAX_COLLAPSED_HEIGHT_PX = 185;

export function MessageBubble({
  message,
  currentUserId,
  isGroup = false,
}: MessageBubbleProps) {
  const isOwn = message.senderId === currentUserId;
  const date = new Date(message.createdAt);
  const hasValidDate = !Number.isNaN(date.getTime());
  const contentRef = useRef<HTMLDivElement>(null);

  const isInitiallyLong = useMemo(() => {
    if (!message.content) return false;
    return (
      message.content.length > MAX_CHAR_THRESHOLD ||
      message.content.split('\n').length > MAX_LINE_THRESHOLD
    );
  }, [message.content]);

  const [isOverflown, setIsOverflown] = useState(isInitiallyLong);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
      if (
        isInitiallyLong ||
        element.scrollHeight > MAX_COLLAPSED_HEIGHT_PX + 20
      ) {
        setIsOverflown(true);
      }
    }
  }, [isInitiallyLong, message.content]);

  const time = hasValidDate
    ? date.toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  return (
    <div className={cn('flex w-full', isOwn ? 'justify-end' : 'justify-start')}>
      <article
        aria-label={isOwn ? 'Mensaje enviado' : 'Mensaje recibido'}
        className={cn(
          'min-w-0 max-w-[85%] rounded-2xl border px-4 py-2.5 sm:max-w-[75%]',
          isOwn
            ? 'rounded-br-md border-[#ec6200]/30 bg-[#ec6200]/10 text-slate-900'
            : 'rounded-bl-md border-border bg-white text-slate-800 shadow-sm'
        )}
      >
        {isGroup && !isOwn && (
          <span className="mb-0.5 block break-words text-[11px] font-semibold text-neutral-700">
            {message.senderName?.trim() || 'Empleado'}
          </span>
        )}

        <div
          ref={contentRef}
          className={cn(
            'relative overflow-hidden transition-all duration-300 ease-in-out',
            isOverflown && !isExpanded && 'max-h-[185px]'
          )}
        >
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere]">
            {message.content}
          </p>

          {isOverflown && !isExpanded && (
            <div
              className={cn(
                'pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent',
                isOwn ? 'from-[#fdf1e8]' : 'from-white'
              )}
              aria-hidden="true"
            />
          )}
        </div>

        {isOverflown && (
          <div className="mt-1 flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className={cn(
                'inline-flex items-center gap-1 text-xs font-semibold transition-colors hover:underline focus:outline-none focus-visible:ring-1 focus-visible:ring-secondary',
                isOwn
                  ? 'text-orange-950 hover:text-black'
                  : 'text-orange-600 hover:text-orange-800'
              )}
              aria-expanded={isExpanded}
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>[-] Ver menos</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>[+] Ver más</span>
                </>
              )}
            </button>
          </div>
        )}

        {hasValidDate && (
          <time
            dateTime={message.createdAt}
            title={date.toLocaleString('es-VE')}
            className="mt-1 block text-right text-[10px] text-muted-foreground"
          >
            {time}
          </time>
        )}
      </article>
    </div>
  );
}
