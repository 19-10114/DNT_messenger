'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ARRANCA_REQUESTS, ARRANCA_REQUESTS_PENDING } from '@/constants/routes';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { href: ARRANCA_REQUESTS, label: 'Solicitudes' },
  { href: ARRANCA_REQUESTS_PENDING, label: 'Motos por entregar' },
];

/**
 * Navegación entre las secciones del módulo "Solicitudes Arranca". El detalle
 * de una solicitud (`/arranca-requests/<id>`) cuenta como "Solicitudes".
 */
export function BikeRequestsSectionNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === ARRANCA_REQUESTS_PENDING) return pathname === href;
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.startsWith(ARRANCA_REQUESTS_PENDING))
    );
  };

  return (
    <nav className="inline-flex items-center gap-1 rounded-lg bg-gray-100 p-1">
      {SECTIONS.map((section) => {
        const active = isActive(section.href);
        return (
          <Link
            key={section.href}
            href={section.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active
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
