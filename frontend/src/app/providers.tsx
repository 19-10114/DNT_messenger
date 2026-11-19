'use client';

import { useEffect } from 'react';
import { initializeBranchId } from '@/stores/branch/branch.store';

export function Providers({ children }: { children: React.ReactNode }) {
  // Inicializar el ID de sucursal desde las cookies cuando la aplicación se carga
  useEffect(() => {
    initializeBranchId();
  }, []);

  return <>{children}</>;
}
