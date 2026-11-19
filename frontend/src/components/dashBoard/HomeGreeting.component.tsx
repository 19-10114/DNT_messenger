'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/stores/auth/auth.store';

/** Saludo según la hora, calculado en el cliente para no desfasar el SSR. */
function useGreeting() {
  const [greeting, setGreeting] = useState('Hola');

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(
      hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
    );
  }, []);

  return greeting;
}

/** Cabecera del inicio: la fecha y el saludo al usuario. */
export function HomeGreeting() {
  const user = useUser();
  const greeting = useGreeting();

  const today = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <section className="mb-8">
      <p className="text-sm font-medium capitalize text-secondary">{today}</p>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-950 sm:text-3xl">
        {greeting}
        {user?.firstName ? `, ${user.firstName}` : ''}
      </h1>
    </section>
  );
}
