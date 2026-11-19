'use client';

import React from 'react';

import { useRoles, useSuperuser } from '@/stores/auth/auth.store';

/** Roles que pueden ver el módulo de GPS (mismo criterio que el menú lateral). */
const GPS_ALLOWED_ROLES = ['admin', 'manager', 'administrator'];

/**
 * Guarda de acceso del módulo de GPS. Se aplica en el layout, así que cubre
 * todas sus sub-rutas de una sola vez.
 */
export function GpsAccessGuard({ children }: { children: React.ReactNode }) {
  const roles = useRoles();
  const isSuperuser = useSuperuser();

  const hasAccess =
    isSuperuser === true ||
    GPS_ALLOWED_ROLES.some((role) => roles.includes(role));

  if (!hasAccess) {
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
