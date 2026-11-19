'use client';

import { useEffect, useState } from 'react';
import { ChatWindow } from '@/components/messenger/ChatWindow';
import { MessengerSidebar } from '@/components/messenger/MessengerSidebar';
import { NewGroupModal } from '@/components/messenger/NewGroupModal';
import { useMessengerMessages } from '@/hooks/messenger/useMessengerMessages';
import { useMessengerUser } from '@/hooks/messenger/useMessengerUser';
import {
  conversationDisplayName,
  markConversationAsRead,
} from '@/lib/messenger/conversation.utils';
import { messengerService } from '@/services/messenger/messenger.service';
import { useToken } from '@/stores/auth/auth.store';
import type { Conversation } from '@/types/messenger.types';

export default function MessengerPage() {
  const token = useToken();
  const [chat, setChat] = useState<Conversation | null>(null);
  const [mostrarGrupo, setMostrarGrupo] = useState(false);
  const [recargarLista, setRecargarLista] = useState(0);

  const { userId: miId, error: errorUsuario } = useMessengerUser(token);
  const {
    messages: mensajes,
    loading: cargando,
    error,
    refresh: recargarMensajes,
  } = useMessengerMessages(token, chat?.id);

  useEffect(() => {
    setChat(null);
  }, [token]);

  async function enviarMensaje(texto: string) {
    if (chat?.id === undefined || !token) throw new Error('No hay chat');
    await messengerService.sendMessage(chat.id, { content: texto }, token);
    recargarMensajes();
    setRecargarLista((n) => n + 1);
  }

  function elegirChat(nuevo: Conversation) {
    if (nuevo.id) {
      markConversationAsRead(nuevo.id, miId);
    }
    setChat(nuevo);
  }

  function grupoCreado(grupo: Conversation) {
    elegirChat(grupo);
    setRecargarLista((n) => n + 1);
  }

  let ventana = (
    <div className="flex h-full flex-1 items-center justify-center p-4 text-sm text-neutral-400">
      Selecciona una conversación para comenzar a chatear
    </div>
  );

  if (!token) {
    ventana = (
      <div className="flex h-full flex-1 items-center justify-center p-4 text-sm text-red-600">
        Inicia sesión para usar el chat
      </div>
    );
  } else if (chat) {
    if (errorUsuario) {
      ventana = (
        <div className="flex h-full flex-1 items-center justify-center p-4 text-sm text-red-600">
          {errorUsuario}
        </div>
      );
    } else if (miId === null) {
      ventana = (
        <div className="flex h-full flex-1 items-center justify-center p-4 text-sm text-neutral-400">
          Cargando usuario...
        </div>
      );
    } else {
      ventana = (
        <div className="flex h-full min-h-0 flex-1 flex-col">
          <ChatWindow
            key={chat.id}
            roomId={String(chat.id)}
            participantName={conversationDisplayName(chat)}
            currentUserId={String(miId)}
            messages={mensajes}
            onSend={enviarMensaje}
            conversation={chat}
            isLoading={cargando}
            error={error || null}
            className="flex-1 rounded-none border-0"
          />
        </div>
      );
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm md:flex-row">
      <MessengerSidebar
        onNewGroup={() => setMostrarGrupo(true)}
        activeId={chat?.id}
        onSelect={elegirChat}
        currentUserId={miId}
        refreshKey={recargarLista}
      />
      <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{ventana}</div>

      <NewGroupModal
        open={mostrarGrupo}
        onClose={() => setMostrarGrupo(false)}
        onCreated={grupoCreado}
      />
    </div>
  );
}
