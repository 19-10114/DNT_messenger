'use client';

import React from 'react';

import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { AllTicketsList } from './allTicketsList.component';
import { MyTicketsList } from './myTicketsList.component';
import { isSupportAgent } from './support.utils';

/**
 * Página única de soporte. Quien reporta ve sus reportes y su estado; el
 * equipo (Super Admin) ve todos y cambia el estado desde el detalle. El
 * backend aplica el mismo criterio (`IsSupportAgent`).
 */
export function SupportPage() {
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const isAgent = isSupportAgent(roles, isSuperuser, isStaff);

  return (
    <section>
      <div className="mb-6 border-l-4 border-primary pl-4">
        <h1 className="font-serif text-2xl font-semibold text-primary">
          {isAgent ? 'Soporte' : 'Mis reportes'}
        </h1>
        <p className="mt-0.5 text-sm text-gray-400">
          {isAgent
            ? 'Todos los reportes de los usuarios: errores, mejoras y preguntas.'
            : 'Lo que enviaste a soporte y en qué estado está.'}
        </p>
      </div>
      {isAgent ? <AllTicketsList /> : <MyTicketsList />}
    </section>
  );
}
