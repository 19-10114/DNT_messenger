'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { GPS_LOGS, GPS_MONITORING } from '@/constants/routes';
import { cn } from '@/lib/utils';

const GPS_SECTIONS = [
  { href: GPS_MONITORING, label: 'Monitoreo' },
  { href: GPS_LOGS, label: 'Registros' },
];

/**
 * Navegación entre las sub-rutas del módulo de GPS. Vive en el layout de
 * `/dashboard/gps`, así que la pestaña activa sobrevive a la navegación.
 */
export function GpsSectionNav() {
  const pathname = usePathname();

  return (
    <nav className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {GPS_SECTIONS.map((section) => {
        const isActive = pathname === section.href;
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              isActive
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            )}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
