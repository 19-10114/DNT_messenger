import clsx from 'clsx';
import {
  conversationActivityDate,
  conversationDisplayName,
  conversationInitials,
  conversationPreview,
  relativeActivityTime,
} from '@/lib/messenger/conversation.utils';
import type { Conversation } from '@/types/messenger.types';

type Props = {
  chat: Conversation;
  index: number;
  active: boolean;
  unread?: boolean;
  onSelect: (chat: Conversation) => void;
};

export function ConversationListItem({ chat, index, active, unread = false, onSelect }: Props) {
  const name = conversationDisplayName(chat);
  const preview = conversationPreview(chat);
  const date = conversationActivityDate(chat);

  return (
    <button
      type="button"
      onClick={() => onSelect(chat)}
      aria-current={active ? 'true' : undefined}
      className={clsx(
        'mb-1.5 w-full min-w-0 rounded-xl border p-3 text-left transition',
        active
          ? 'border-orange-300 bg-orange-50/80 shadow-xs'
          : clsx(
              'border-neutral-200 hover:bg-neutral-100/60',
              index % 2 === 0 ? 'bg-white' : 'bg-slate-100/80'
            )
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={clsx(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition',
            active ? 'bg-orange-200/70 text-orange-950 font-bold' : 'bg-neutral-200 text-neutral-800'
          )}
          aria-hidden="true"
        >
          {conversationInitials(chat)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <span
              className={clsx(
                'min-w-0 flex-1 truncate text-sm text-neutral-900',
                active ? 'font-semibold' : 'font-medium'
              )}
              title={name}
            >
              {name}
            </span>
            <span className={clsx('shrink-0 text-[10px]', active ? 'text-neutral-600 font-medium' : 'text-neutral-500')}>
              {relativeActivityTime(date)}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <p className={clsx('min-w-0 flex-1 truncate text-xs', active ? 'text-neutral-700' : 'text-neutral-500')} title={preview}>
              {preview}
            </p>
            {unread && (
              <span
                aria-label="Mensajes no leídos"
                title="Mensajes no leídos"
                className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500 ring-2 ring-white"
              />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
