import React from 'react';

import { cn } from '@/lib/utils';

interface ReportPanelProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/** Un panel del reporte: título, qué se está viendo y el contenido. */
export function ReportPanel({
  title,
  description,
  children,
  className,
}: ReportPanelProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && <p className="text-xs text-gray-500">{description}</p>}
      </header>
      {children}
    </section>
  );
}
