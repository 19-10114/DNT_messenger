'use client';

import { useState } from 'react';

import { ChatWindow } from '@/components/messenger/ChatWindow';
import type { ChatMessage } from '@/components/messenger/MessageBubble';
import { Button } from '@/components/ui/button.component';
import type { Conversation } from '@/types/messenger.types';

const directConversation: Conversation = {
  id: 1,
  type: 'direct',
  otherUser: {
    id: 2,
    username: 'mperez',
    firstName: 'María',
    lastName: 'Pérez',
    department: 'Ventas',
    role: 'Supervisora',
  },
  updatedAt: '2026-11-05T12:00:00Z',
};

const groupConversation: Conversation = {
  id: 2,
  type: 'group',
  name: 'Equipo de Ventas',
  participantCount: 3,
  updatedAt: '2026-11-05T12:00:00Z',
};

const initialMessages: ChatMessage[] = [
  {
    id: 'demo-1',
    senderId: '2',
    senderName: 'M. Pérez',
    content: 'Hola, ¿cómo va la interfaz del chat?',
    createdAt: '2026-11-05T09:00:00-04:00',
  },
  {
    id: 'demo-2',
    senderId: '1',
    senderName: 'Usuario de prueba',
    content: 'Ya podemos probar el módulo 2.3.',
    createdAt: '2026-11-05T09:01:00-04:00',
  },
];

export default function ChatDemoPage() {
  const [isGroup, setIsGroup] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [simulateFailure, setSimulateFailure] = useState(false);

  const conversation = isGroup ? groupConversation : directConversation;

  async function handleSend(content: string): Promise<void> {
    if (simulateFailure) {
      throw new Error('Fallo de prueba');
    }

    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: '1',
      senderName: 'Usuario de prueba',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, message]);
  }

  function receiveMessage() {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      senderId: isGroup ? '3' : '2',
      senderName: isGroup ? 'C. Gómez' : 'M. Pérez',
      content: 'Este es otro mensaje recibido de prueba.',
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, message]);
  }

  function changeConversation() {
    setIsGroup((previous) => !previous);
    setMessages(initialMessages);
    setIsLoading(false);
    setSimulateFailure(false);
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Prueba del módulo 2.3
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Datos simulados para comprobar la interfaz del chat.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={changeConversation}>
            {isGroup ? 'Abrir chat individual' : 'Abrir grupo'}
          </Button>

          <Button
            variant="outline"
            onClick={receiveMessage}
            disabled={isLoading}
          >
            Simular recibido
          </Button>

          <Button
            variant="outline"
            onClick={() => setMessages([])}
            disabled={isLoading}
          >
            Vaciar chat
          </Button>

          <Button
            variant="outline"
            aria-pressed={isLoading}
            onClick={() => setIsLoading((previous) => !previous)}
          >
            {isLoading ? 'Terminar carga' : 'Simular carga'}
          </Button>

          <Button
            variant="outline"
            aria-pressed={simulateFailure}
            onClick={() => setSimulateFailure((previous) => !previous)}
          >
            {simulateFailure ? 'Desactivar fallo' : 'Simular fallo'}
          </Button>
        </div>

        <ChatWindow
          key={conversation.id}
          roomId={String(conversation.id)}
          participantName={isGroup ? 'Equipo de Ventas' : 'María Pérez'}
          currentUserId="1"
          messages={messages}
          onSend={handleSend}
          conversation={conversation}
          isLoading={isLoading}
        />
      </div>
    </main>
  );
}
