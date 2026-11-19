'use client';

import { BranchHome } from '@/components/home/BranchHome.component';
import { ManagerHome } from '@/components/home/ManagerHome.component';
import { useIsManagerView } from '@/stores/auth/auth.store';

/** Inicio: el de gerencia para admin, gerente y administrador; el de sucursal para el resto. */
export default function DashboardPage() {
  const isManagerView = useIsManagerView();
  return isManagerView ? <ManagerHome /> : <BranchHome />;
}
