'use client';

import { useCallback, useEffect, useRef } from 'react';
import { usePollingResource } from '@/hooks/messenger/usePollingResource';
import { sameConversations, sortConversations } from '@/lib/messenger/conversation.utils';
import { messengerService } from '@/services/messenger/messenger.service';
import type { Conversation } from '@/types/messenger.types';

const EMPTY_CONVERSATIONS: Conversation[] = [];

export function useMessengerConversations(
  token: string | undefined,
  enabled: boolean,
  refreshKey = 0
) {
  const load = useCallback(async () => {
    if (!token) return EMPTY_CONVERSATIONS;
    return sortConversations(await messengerService.getConversations(token));
  }, [token]);

  const resource = usePollingResource({
    resourceKey: `conversations:${token ?? ''}`,
    enabled: enabled && Boolean(token),
    load,
    initialData: EMPTY_CONVERSATIONS,
    equals: sameConversations,
    errorMessage: 'No se pudieron cargar los chats',
  });

  const previousRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (previousRefreshKey.current === refreshKey) return;
    previousRefreshKey.current = refreshKey;
    if (enabled) resource.refresh();
  }, [enabled, refreshKey, resource.refresh]);

  return resource;
}
