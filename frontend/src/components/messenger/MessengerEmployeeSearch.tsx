'use client';

import { useState } from 'react';
import { SearchInput } from '@/components/ui/searchInput.component';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useMessengerEmployees } from '@/hooks/messenger/useMessengerEmployees';
import { userDisplayName, userSubtitle } from '@/lib/messenger/conversation.utils';
import { messengerService } from '@/services/messenger/messenger.service';
import type { Conversation, MessengerUser } from '@/types/messenger.types';

type Props = {
  token: string | undefined;
  currentUserId: number | null;
  onSelect: (chat: Conversation) => void;
  onOpened: () => void;
};

export function MessengerEmployeeSearch({ token, currentUserId, onSelect, onOpened }: Props) {
  const { data: branches } = useAllBranches();
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState<number | undefined>(undefined);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState('');
  const { users, loading, error } = useMessengerEmployees(token, branchId, search);
  const visibleUsers = users.filter((user) => currentUserId === null || user.id !== currentUserId);

  async function openChat(user: MessengerUser) {
    if (!token || opening || user.id === currentUserId) return;
    setOpening(true);
    setOpenError('');
    try {
      const chat = await messengerService.getOrCreateDirectConversation(user.id, token);
      onSelect(chat);
      onOpened();
    } catch {
      setOpenError('No se pudo abrir el chat');
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col p-3">
      <select
        className="mb-3 w-full rounded-md border bg-white p-2 text-sm"
        value={branchId ?? ''}
        onChange={(event) => {
          setBranchId(event.target.value === '' ? undefined : Number(event.target.value));
        }}
      >
        <option value="">Todas las sucursales</option>
        {branches?.map((branch) => (
          <option key={branch.id} value={branch.id}>{branch.name}</option>
        ))}
      </select>

      <SearchInput
        placeholder="Buscar empleado..."
        initialValue={search}
        onSearch={setSearch}
      />

      {!token && <p className="mt-2 text-sm text-red-600">Inicia sesión</p>}
      {loading && <p className="mt-2 text-sm">Cargando...</p>}
      {(error || openError) && (
        <p className="mt-2 text-sm text-red-600" role="alert">{error || openError}</p>
      )}

      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {!loading && token && !error && visibleUsers.length === 0 && (
          <p className="p-2 text-sm">Sin resultados</p>
        )}
        {visibleUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            disabled={opening}
            onClick={() => { void openChat(user); }}
            className="w-full rounded-md p-3 text-left hover:bg-slate-50 disabled:opacity-50"
          >
            <p className="text-sm font-medium">{userDisplayName(user)}</p>
            <p className="text-xs text-gray-500">{userSubtitle(user)}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
