'use client';

import { useEffect, useState } from 'react';
import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';

const http = new MotoCandelaHttpService();

type SessionUser = {
  token: string | undefined;
  id: number | null;
  error: string;
};

export function useMessengerUser(token: string | undefined) {
  const [user, setUser] = useState<SessionUser>({ token: undefined, id: null, error: '' });

  useEffect(() => {
    let active = true;
    setUser({ token, id: null, error: '' });
    if (!token) return;

    http.get<{ data: { id: number } }>({ endpoint: '/users/self', token })
      .then((response) => {
        if (active) setUser({ token, id: response.data.id, error: '' });
      })
      .catch(() => {
        if (active) {
          setUser({ token, id: null, error: 'No se pudo cargar el usuario' });
        }
      });

    return () => { active = false; };
  }, [token]);

  const current = user.token === token ? user : null;
  return { userId: current?.id ?? null, error: current?.error ?? '' };
}
