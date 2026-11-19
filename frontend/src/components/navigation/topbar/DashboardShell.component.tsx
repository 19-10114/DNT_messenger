'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { DashboardNavbar } from './DashboardNavbar.component';

/**
 * Isla de navegación fija arriba y el contenido de la página debajo, centrado
 * al mismo ancho que la isla. Sin menú lateral, las tablas ganan los 220–320px
 * que ocupaba.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMessenger = pathname?.startsWith('/dashboard/messenger');

  return (
    <div
      className={cn(
        'bg-neutral-100/60',
        isMessenger
          ? 'h-screen h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col'
          : 'min-h-screen'
      )}
    >
      <div className="shrink-0 px-3 pt-3 sm:px-4">
        <DashboardNavbar />
      </div>

      <main
        className={cn(
          'mx-auto w-full max-w-[1600px]',
          isMessenger
            ? 'flex-1 min-h-0 px-3 pb-3 pt-2 sm:px-4 flex flex-col overflow-hidden'
            : 'px-4 pb-12 pt-6 lg:px-8'
        )}
      >
        {children}
      </main>
    </div>
  );
}
