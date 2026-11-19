// File: DashboardLayout.tsx
import { RoutesProtectionProvider } from '@/components/routesProtectionProvider/routesProtectionProvider.component';
import { getMetadata } from '@/components/metadata/Metadata.component';
import { DashboardShell } from '@/components/navigation/topbar/DashboardShell.component';

export const metadata = getMetadata({
  title: 'Moto candela - Admin',
  description: 'Candela tu moto',
});

/**
 * El menú lateral (`MenuLayout` + `SidebarNav`) ya no se monta: la navegación
 * vive en la isla superior (`DashboardShell`). Los componentes siguen en el
 * repo por si hay que volver atrás.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoutesProtectionProvider>
      <DashboardShell>{children}</DashboardShell>
    </RoutesProtectionProvider>
  );
}
