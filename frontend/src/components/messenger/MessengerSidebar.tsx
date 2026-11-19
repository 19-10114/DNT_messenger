'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, MessageSquarePlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import { ConversationListItem } from '@/components/messenger/ConversationListItem';
import { MessengerEmployeeSearch } from '@/components/messenger/MessengerEmployeeSearch';
import { useMessengerConversations } from '@/hooks/messenger/useMessengerConversations';
import {
  conversationDisplayName,
  countUnreadConversations,
  getStoredReadTimestamps,
  isConversationUnread,
  markConversationAsRead,
} from '@/lib/messenger/conversation.utils';
import { useRoles, useToken } from '@/stores/auth/auth.store';
import type { Conversation } from '@/types/messenger.types';

type Props = {
  activeId?: number;
  onSelect: (chat: Conversation) => void;
  onNewGroup?: () => void;
  currentUserId?: number | null;
  overrideToken?: string | null;
  refreshKey?: number;
};

export function MessengerSidebar({
  activeId,
  onSelect,
  onNewGroup,
  currentUserId = null,
  overrideToken,
  refreshKey = 0,
}: Props) {
  const tokenSesion = useToken();
  const token = overrideToken || tokenSesion;
  const roles = useRoles();
  const canCreateGroup = ['admin', 'administrator', 'manager']
    .some((role) => roles.includes(role));
  const [view, setView] = useState<'chats' | 'users'>('chats');
  const [searchChat, setSearchChat] = useState('');
  const [reads, setReads] = useState<Record<number, number>>({});

  const { data: chats, loading, error } = useMessengerConversations(
    token, view === 'chats', refreshKey
  );

  useEffect(() => {
    setReads(getStoredReadTimestamps(currentUserId));
    const handleUpdate = () => {
      setReads(getStoredReadTimestamps(currentUserId));
    };
    window.addEventListener('mc_reads_updated', handleUpdate);
    return () => {
      window.removeEventListener('mc_reads_updated', handleUpdate);
    };
  }, [currentUserId]);

  function handleSelectChat(chat: Conversation) {
    markConversationAsRead(chat.id, currentUserId);
    onSelect(chat);
  }

  // Contador de chats con mensajes sin leer (sincronizado exactamente con el icono del header)
  const unreadCount = useMemo(() => {
    return countUnreadConversations(chats, currentUserId, undefined, reads);
  }, [chats, currentUserId, reads]);

  // Filtro de búsqueda local en chats
  const visibleChats = useMemo(() => {
    if (!searchChat.trim()) return chats;
    const term = searchChat.toLowerCase().trim();
    return chats.filter((c) => {
      const name = conversationDisplayName(c).toLowerCase();
      const last = c.lastMessage?.content.toLowerCase() || '';
      return name.includes(term) || last.includes(term);
    });
  }, [chats, searchChat]);

  return (
    <aside className="flex h-full min-h-0 w-full shrink-0 flex-col overflow-hidden border-r border-neutral-200 bg-white md:w-[340px]">
      {/* Cabecera Ultra-Compacta (52px) */}
      {view === 'chats' ? (
        <div className="flex h-13 shrink-0 items-center justify-between border-b border-neutral-200 px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-neutral-900">Chats</h2>
            {unreadCount > 0 && (
              <span
                title={`${unreadCount} conversaciones no leídas`}
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1.5 text-xs font-bold text-white shadow-xs"
              >
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setView('users')}
              title="Nuevo chat"
              aria-label="Nuevo chat"
              className="h-9 w-9 rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
            >
              <MessageSquarePlus className="h-5 w-5" />
            </Button>

            {canCreateGroup && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onNewGroup}
                title="Nuevo grupo"
                aria-label="Nuevo grupo"
                className="h-9 w-9 rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
              >
                <Users className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex h-13 shrink-0 items-center gap-2 border-b border-neutral-200 px-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setView('chats')}
            title="Volver a chats"
            aria-label="Volver a chats"
            className="h-9 w-9 rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-base font-semibold text-neutral-900">Nuevo chat</h2>
        </div>
      )}

      {/* Contenido de la barra lateral */}
      {view === 'chats' && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Campo de búsqueda rápido */}
          <div className="border-b border-neutral-100 p-2.5">
            <SearchInput
              placeholder="Buscar en chats..."
              initialValue={searchChat}
              onSearch={setSearchChat}
              className="w-full text-xs"
            />
          </div>

          {/* Lista de chats */}
          <div className="min-h-0 flex-1 overflow-y-auto p-2.5">
            {loading && <p className="px-3 py-2 text-sm text-neutral-400">Cargando...</p>}
            {!token && <p className="px-3 py-2 text-sm text-red-600">Inicia sesión</p>}
            {error && <p className="px-3 py-2 text-sm text-red-600" role="alert">{error}</p>}
            {!loading && token && !error && visibleChats.length === 0 && (
              <p className="p-3 text-center text-sm text-neutral-400">
                {searchChat ? 'No se encontraron conversaciones' : 'Sin chats aún'}
              </p>
            )}
            {visibleChats.map((chat, index) => (
              <ConversationListItem
                key={chat.id}
                chat={chat}
                index={index}
                active={chat.id === activeId}
                unread={isConversationUnread(chat, currentUserId, activeId, reads)}
                onSelect={handleSelectChat}
              />
            ))}
          </div>
        </div>
      )}

      {view === 'users' && (
        <MessengerEmployeeSearch
          token={token}
          currentUserId={currentUserId}
          onSelect={handleSelectChat}
          onOpened={() => setView('chats')}
        />
      )}
    </aside>
  );
}
