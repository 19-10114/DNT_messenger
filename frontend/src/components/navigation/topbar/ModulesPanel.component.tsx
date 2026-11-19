'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { MenuNode } from '@/components/navigation/menu.utils';
import { getMenuIcon } from '@/components/navigation/menuIcons';
import { BranchSelector } from '@/components/navigation/branchSelector/BranchSelector.component';
import { ExchangeRate } from '@/components/dashBoard/ExchangeRate.component';
import { useNavigationMenu } from '@/hooks/navigation/useNavigationMenu';
import { ModuleLinks } from './ModuleLinks.component';

interface ModuleCardProps {
  node: MenuNode;
  onNavigate: () => void;
}

/** Icono de módulo: cuadro negro con el icono en naranja, como el logo. */
export function ModuleIconBadge({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const Icon = getMenuIcon(title);

  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-neutral-950 text-secondary',
        className
      )}
    >
      <Icon className="h-[18px] w-[18px]" />
    </span>
  );
}

function ModuleCard({ node, onNavigate }: ModuleCardProps) {
  // Módulo de una sola pantalla (Pagos, Motos Usadas): la tarjeta es el enlace.
  if (!node.children) {
    return (
      <Link
        href={node.href!}
        onClick={onNavigate}
        className="group mb-3 flex break-inside-avoid items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3 transition-all hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
      >
        <ModuleIconBadge title={node.title} />
        <span className="flex-1 text-sm font-semibold text-neutral-900">
          {node.title}
        </span>
        <ArrowUpRight className="h-4 w-4 text-neutral-400 transition-colors group-hover:text-secondary" />
      </Link>
    );
  }

  return (
    <section className="mb-3 break-inside-avoid rounded-2xl border border-neutral-200 bg-white p-3">
      <header className="mb-2 flex items-center gap-3">
        <ModuleIconBadge title={node.title} />
        <h3 className="text-sm font-semibold text-neutral-900">{node.title}</h3>
      </header>
      <ModuleLinks node={node} onNavigate={onNavigate} />
    </section>
  );
}

/**
 * Botón "Módulos" de la isla: abre un panel con todo el menú del usuario,
 * agrupado por módulo. Sustituye al menú lateral.
 */
export function ModulesPanel() {
  const [open, setOpen] = useState(false);
  const { menu } = useNavigationMenu();

  const close = () => setOpen(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          'flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
          open
            ? 'bg-secondary text-white'
            : 'bg-white/10 text-white hover:bg-white/15'
        )}
        aria-label="Abrir módulos"
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Módulos</span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={14}
        collisionPadding={12}
        className="w-[calc(100vw-1.5rem)] max-w-[1180px] rounded-3xl border-neutral-200 bg-neutral-50 p-3 shadow-2xl sm:p-4"
      >
        {/* En móvil la isla no tiene sitio para la sucursal ni las tasas. */}
        <div className="mb-3 flex flex-wrap items-center gap-3 rounded-2xl bg-neutral-950 p-3 md:hidden">
          <BranchSelector />
          <ExchangeRate />
        </div>

        <div className="max-h-[calc(100vh-9rem)] overflow-y-auto pr-1">
          <div className="columns-1 gap-3 sm:columns-2 lg:columns-3 xl:columns-4">
            {menu.map((node) => (
              <ModuleCard key={node.key} node={node} onNavigate={close} />
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
