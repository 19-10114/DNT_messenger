'use client';

import type { ChatMessage } from '@/components/messenger/MessageBubble';
import { MessageInputBar } from '@/components/messenger/MessageInputBar';
import { MessageList } from '@/components/messenger/MessageList';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.component';
import { cn } from '@/lib/utils';
import { useAllBranches } from '@/hooks/useAllBranches';
import { labelsMap } from '@/hooks/useMappedConstants';
import { userSubtitle } from '@/lib/messenger/conversation.utils';
import type { Conversation } from '@/types/messenger.types';

interface ChatWindowProps {
  roomId: string;
  participantName: string;
  currentUserId: string;
  messages: ChatMessage[];
  onSend: (content: string) => Promise<void>;
  conversation?: Conversation;
  isOnline?: boolean;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
}

export function ChatWindow({
  roomId,
  participantName,
  currentUserId,
  messages,
  onSend,
  conversation,
  isLoading = false,
  error = null,
  className,
}: ChatWindowProps) {
  const { data: branches } = useAllBranches();
  const isGroup = conversation?.type === 'group';
  const otherUser =
    conversation?.otherUser ||
    conversation?.otherMember ||
    (conversation as any)?.other_member ||
    (conversation as any)?.other_user;

  const contactName = [
    otherUser?.firstName || (otherUser as any)?.first_name,
    otherUser?.lastName || (otherUser as any)?.last_name,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const isInvalidParticipantName =
    !participantName ||
    participantName.trim() === 'null null' ||
    participantName.trim() === 'Conversación' ||
    participantName.trim() === 'Empleado';

  const displayName = isGroup
    ? conversation?.name?.trim() || participantName.trim() || 'Grupo'
    : contactName ||
      (!isInvalidParticipantName ? participantName.trim() : '') ||
      otherUser?.username ||
      'Conversación';

  const participantCount =
    conversation?.participantCount ?? conversation?.members?.length;

  const subtitle = isGroup
    ? participantCount === undefined
      ? 'Participantes no disponibles'
      : `${participantCount} participantes`
    : userSubtitle(otherUser, branches) || 'Empleado';

  const cleanDisplayName = displayName.trim();
  const initials = cleanDisplayName
    ? cleanDisplayName
        .split(/\s+/)
        .slice(0, 2)
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
    : 'MC';

  return (
    <section
      aria-label={`Conversación: ${displayName}`}
      className={cn(
        'flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-lg border border-border bg-white',
        className
      )}
    >
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border bg-white px-4">
        <Avatar>
          <AvatarFallback className="bg-[#ec6200]/10 font-semibold text-[#ec6200]">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0">
          <h2 className="truncate font-semibold text-slate-900">
            {displayName}
          </h2>

          <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>

      {error && (
        <p
          role="alert"
          className="shrink-0 border-b border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <MessageList
        messages={messages}
        currentUserId={currentUserId}
        isLoading={isLoading}
        isGroup={isGroup}
      />

      <MessageInputBar
        onSend={onSend}
        disabled={Boolean(error) || (isLoading && messages.length === 0)}
      />
    </section>
  );
}
