'use client';

import { useEffect, useState } from 'react';
import { messengerService } from '@/services/messenger/messenger.service';
import type { MessengerUser } from '@/types/messenger.types';

export function useMessengerEmployees(
  token: string | undefined,
  branchId: number | undefined,
  search: string
) {
  const [users, setUsers] = useState<MessengerUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setUsers([]);
    setError('');
    setLoading(Boolean(token));
    if (!token) return;

    messengerService.getEmployees(token, branchId, search)
      .then((result) => {
        if (active) setUsers(result);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los empleados');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [token, branchId, search]);

  return { users, loading, error };
}
