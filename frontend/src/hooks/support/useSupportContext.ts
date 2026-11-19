import { useCallback } from 'react';

import { SupportContext } from '@/services/support/types';
import { useBranches, useCurrentBranchId } from '@/stores/branch/branch.store';
import { useRoles } from '@/stores/auth/auth.store';
import { useRecentApiErrors } from '@/stores/apiErrors/recentApiErrors.store';

/** Un error de hace más de 30 min rara vez tiene que ver con el reporte */
const API_ERROR_MAX_AGE_MS = 30 * 60_000;

/**
 * Arma el contexto técnico que se adjunta a un reporte: página, sucursal,
 * roles, navegador, pantalla y los últimos errores de la API (hasta 5, con
 * lo que se envió en cada uno).
 *
 * Devuelve una función y no un valor: la página y el tamaño de la ventana se
 * leen en el momento de abrir el formulario. `window.location` en vez de
 * `useSearchParams`, que obligaría a envolver el layout en Suspense.
 */
export function useSupportContext() {
  const currentBranchId = useCurrentBranchId();
  const branches = useBranches();
  const roles = useRoles();
  const recentApiErrors = useRecentApiErrors();
  const rolesKey = roles.join(',');

  return useCallback((): SupportContext => {
    if (typeof window === 'undefined') return {};
    const branch = branches.find((b) => b.id === currentBranchId);
    const recentErrors = recentApiErrors.filter(
      (error) =>
        Date.now() - new Date(error.at).getTime() < API_ERROR_MAX_AGE_MS
    );

    return {
      path: window.location.pathname,
      query: window.location.search || undefined,
      branchId: currentBranchId || undefined,
      branchName: currentBranchId === 0 ? 'Todas' : branch?.name,
      userAgent: navigator.userAgent,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen: { width: window.screen.width, height: window.screen.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      roles: rolesKey ? rolesKey.split(',') : [],
      recentApiErrors: recentErrors.length ? recentErrors : undefined,
    };
  }, [branches, currentBranchId, recentApiErrors, rolesKey]);
}
