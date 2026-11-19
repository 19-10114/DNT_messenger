'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';

type Props = {
  onTokenChange: (token: string | null) => void;
};

export function DevTokenToolbar({ onTokenChange }: Props) {
  const [token1, setToken1] = useState('');
  const [token2, setToken2] = useState('');
  const [actual, setActual] = useState(0);

  // Cambiamos el usuario de prueba
  function cambiarUsuario(n: number) {
    if (n === 1) {
      if (!token1.trim()) return;
      onTokenChange(token1.trim());
    } else if (n === 2) {
      if (!token2.trim()) return;
      onTokenChange(token2.trim());
    } else {
      onTokenChange(null);
    }

    setActual(n);
  }

  function cambiarToken(n: number, texto: string) {
    if (n === 1) {
      setToken1(texto);
    } else {
      setToken2(texto);
    }

    // Actualizamos el token si lo estamos usando
    if (actual === n) {
      if (!texto.trim()) setActual(0);
      onTokenChange(texto.trim() || null);
    }
  }

  // Solo para desarrollo
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="border-b bg-slate-50 p-3">
      <p className="mb-2 text-sm font-medium">Usuarios de prueba</p>

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={actual === 0 ? 'secondary' : 'outline'}
          onClick={() => cambiarUsuario(0)}>
          Mi sesión
        </Button>

        <Input type="password" placeholder="Token usuario 1"
          value={token1} className="w-44" autoComplete="off"
          onChange={(e) => cambiarToken(1, e.target.value)}
        />

        <Button size="sm" variant={actual === 1 ? 'secondary' : 'outline'}
          disabled={!token1.trim()} onClick={() => cambiarUsuario(1)}>
          Usuario 1
        </Button>

        <Input type="password" placeholder="Token usuario 2"
          value={token2} className="w-44" autoComplete="off"
          onChange={(e) => cambiarToken(2, e.target.value)}
        />

        <Button size="sm" variant={actual === 2 ? 'secondary' : 'outline'}
          disabled={!token2.trim()} onClick={() => cambiarUsuario(2)}>
          Usuario 2
        </Button>
      </div>
    </div>
  );
}