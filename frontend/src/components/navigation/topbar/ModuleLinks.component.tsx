'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { flattenMenu, MenuNode } from '@/components/navigation/menu.utils';
import { useNavigationMenu } from '@/hooks/navigation/useNavigationMenu';
import { useToggleFavorite } from '@/stores/navigation/favoriteModules.store';

interface ModuleLinkProps {
  href: string;
  label: string;
  onNavigate?: () => void;
}

/** Una pantalla del menú, con la estrella para fijarla en accesos rápidos. */
function ModuleLink({ href, label, onNavigate }: ModuleLinkProps) {
  const pathname = usePathname();
  const { favoriteHrefs, userId } = useNavigationMenu();
  const toggleFavorite = useToggleFavorite();

  const isActive = pathname === href.split('?')[0];
  const isFavorite = favoriteHrefs.includes(href);

  return (
    <div
      className={cn(
        'group flex items-center rounded-lg transition-colors',
        isActive ? 'bg-orange-50' : 'hover:bg-neutral-100'
      )}
    >
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          'min-w-0 flex-1 truncate px-2.5 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary rounded-lg',
          isActive
            ? 'font-semibold text-secondary'
            : 'text-neutral-700 group-hover:text-neutral-950'
        )}
      >
        {label}
      </Link>

      {userId !== undefined && (
        <button
          type="button"
          onClick={() => toggleFavorite(userId, href)}
          aria-label={
            isFavorite
              ? `Quitar ${label} de accesos rápidos`
              : `Fijar ${label} en accesos rápidos`
          }
          title={
            isFavorite
              ? 'Quitar de accesos rápidos'
              : 'Fijar en accesos rápidos'
          }
          className={cn(
            'mr-1 rounded-md p-1 transition-opacity focus:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
            isFavorite
              ? 'text-secondary opacity-100'
              : 'text-neutral-400 opacity-0 hover:text-secondary group-hover:opacity-100'
          )}
        >
          <Star className={cn('h-3.5 w-3.5', isFavorite && 'fill-current')} />
        </button>
      )}
    </div>
  );
}

interface ModuleLinksProps {
  /** Un módulo raíz con submenú. */
  node: MenuNode;
  onNavigate?: () => void;
}

/**
 * Las pantallas de un módulo. Las subcategorías (Herramientas → Productos)
 * van como un encabezado pequeño con sus pantallas debajo; lo que cuelga más
 * hondo se nombra con su ruta ("Más vendidos · Repuestos").
 */
export function ModuleLinks({ node, onNavigate }: ModuleLinksProps) {
  const children = node.children ?? [];
  const leaves = children.filter((child) => !child.children);
  const groups = children.filter((child) => child.children);

  return (
    <div className="space-y-3">
      {leaves.length > 0 && (
        <div className="space-y-0.5">
          {leaves.map((leaf) => (
            <ModuleLink
              key={leaf.key}
              href={leaf.href!}
              label={leaf.title}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}

      {groups.map((group) => (
        <div key={group.key} className="space-y-0.5">
          <p className="px-2.5 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
            {group.title}
          </p>
          {flattenMenu(group.children ?? []).map((leaf) => (
            <ModuleLink
              key={leaf.key}
              href={leaf.href}
              label={[...leaf.parents, leaf.title].join(' · ')}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
