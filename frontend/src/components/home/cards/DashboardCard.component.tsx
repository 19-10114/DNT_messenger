import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  /** Pantalla de detalle que ya existe para este bloque. */
  href?: string;
  /** Cifras del momento, no del rango elegido. */
  snapshot?: boolean;
  /** El bloque llegó en `null` porque falló en el servidor. */
  unavailable?: boolean;
  className?: string;
  children: React.ReactNode;
}

/** Cascarón común de las tarjetas del Inicio de gerencia. */
export function DashboardCard({
  title,
  href,
  snapshot,
  unavailable,
  className,
  children,
}: DashboardCardProps) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
        className
      )}
    >
      <header className="mb-3 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {snapshot && (
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Ahora
            </span>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="flex shrink-0 items-center text-xs font-medium text-primary hover:underline"
          >
            Ver más
            <ChevronRight className="h-3 w-3" />
          </Link>
        )}
      </header>
      {unavailable ? (
        <p className="text-sm text-gray-500">No disponible en este momento.</p>
      ) : (
        children
      )}
    </section>
  );
}

interface StatProps {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  emphasis?: boolean;
}

/** Una cifra con su etiqueta, para las filas de las tarjetas. */
export function Stat({ label, value, hint, emphasis }: StatProps) {
  return (
    <div className="min-w-0">
      <p className="truncate text-xs text-gray-500">{label}</p>
      <p
        className={cn(
          'font-semibold tabular-nums text-gray-900',
          emphasis ? 'text-2xl' : 'text-lg'
        )}
      >
        {value}
      </p>
      {hint && <p className="truncate text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/** Esqueleto de una tarjeta mientras llega el primer resumen. */
export function DashboardCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'h-40 animate-pulse rounded-xl border border-gray-200 bg-gray-50',
        className
      )}
    />
  );
}
