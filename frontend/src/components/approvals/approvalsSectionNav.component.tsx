'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { APPROVALS, APPROVALS_PENDING } from '@/constants/routes';
import { cn } from '@/lib/utils';

const SECTIONS = [
  { href: APPROVALS, label: 'Aprobaciones' },
  { href: APPROVALS_PENDING, label: 'Motos por recibir' },
];

/** Navegación del módulo. Detalle, alta y edición cuentan como "Aprobaciones". */
export function ApprovalsSectionNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === APPROVALS_PENDING) return pathname === href;
    return (
      pathname === href ||
      (pathname.startsWith(`${href}/`) &&
        !pathname.startsWith(APPROVALS_PENDING))
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
