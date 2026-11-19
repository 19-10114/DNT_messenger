'use client';

import React from 'react';

import { useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { APPROVALS_ALLOWED_ROLES } from './approvals.utils';

/**
 * Guarda de acceso de "Aprobaciones Empire". Va en el layout, así que cubre
 * listado, detalle, alta, edición y "Motos por recibir": el middleware solo
 * valida el token.
 */
export function ApprovalsAccessGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const roles = useRoles();
  const isSuperuser = useSuperuser();

  const hasAccess =
    isSuperuser === true ||
    APPROVALS_ALLOWED_ROLES.some((role) => roles.includes(role));

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
