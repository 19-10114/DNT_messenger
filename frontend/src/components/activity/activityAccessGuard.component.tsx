'use client';

import React from 'react';

import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { canViewActivity } from './activity.utils';

/**
 * Guarda de acceso del registro de actividad. El backend aplica el mismo
 * criterio (`IsActivityViewer`); esto solo evita mostrar una página vacía.
 */
export function ActivityAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();

  if (!canViewActivity(roles, isSuperuser, isStaff)) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <h1 className="mb-4 text-2xl font-bold">Acceso denegado</h1>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta página.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
