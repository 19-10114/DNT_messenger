'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent } from '@/components/ui/dialog.component';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import { MenuLeaf } from '@/components/navigation/menu.utils';
import { getMenuIcon } from '@/components/navigation/menuIcons';
import { useNavigationMenu } from '@/hooks/navigation/useNavigationMenu';
import {
  useCommandSearchActions,
  useIsCommandSearchOpen,
} from '@/stores/navigation/commandSearch.store';

/** `⌘K` en Mac, `Ctrl K` en el resto. Se decide en el cliente. */
function useShortcutLabel() {
  const [label, setLabel] = useState('Ctrl K');

  useEffect(() => {
    if (/Mac|iPhone|iPad/.test(navigator.platform)) setLabel('⌘K');
  }, []);

  return label;
}

/** Botón de la isla que abre el buscador. */
export function CommandSearchTrigger({ className }: { className?: string }) {
  const { setOpen } = useCommandSearchActions();
  const shortcut = useShortcutLabel();

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      aria-label="Buscar pantalla"
      className={cn(
        'flex h-9 items-center gap-2 rounded-full bg-white/10 px-2.5 text-sm text-neutral-300 transition-colors hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary lg:px-3',
        className
      )}
    >
      <Search className="h-4 w-4" />
      <span className="hidden xl:inline">Buscar…</span>
      <kbd className="ml-2 hidden rounded-md border border-white/15 bg-white/5 px-1.5 py-0.5 font-sans text-[11px] text-neutral-400 xl:inline">
        {shortcut}
      </kbd>
    </button>
  );
}

/**
 * Buscador de pantallas: escribir "reten" y saltar a Retenciones. Busca sobre
 * el menú ya filtrado por rol, así que nunca ofrece algo que no se puede abrir.
 * Se abre con `Ctrl+K` / `⌘K` desde cualquier pantalla del dashboard.
 */
export function CommandSearch() {
  const router = useRouter();
  const isOpen = useIsCommandSearchOpen();
  const { setOpen } = useCommandSearchActions();
  const { leaves } = useNavigationMenu();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen(!isOpen);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, setOpen]);

  /** Agrupadas por módulo raíz, en el orden del menú. */
  const groups = useMemo(() => {
    const byRoot = new Map<string, MenuLeaf[]>();
    for (const leaf of leaves) {
      const root = leaf.parents[0] ?? '';
      byRoot.set(root, [...(byRoot.get(root) ?? []), leaf]);
    }
    return Array.from(byRoot.entries());
  }, [leaves]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent
        width="min(640px, calc(100vw - 2rem))"
        maxHeight="70vh"
        className="top-[15%] translate-y-0 overflow-hidden rounded-2xl p-0 data-[state=open]:slide-in-from-top-4 [&>button]:hidden"
      >
        <Command className="rounded-2xl">
          <CommandInput
            placeholder="¿A qué pantalla quieres ir?"
            className="h-14 text-base"
          />
          <CommandList className="max-h-[min(420px,55vh)] p-2">
            <CommandEmpty>No hay pantallas con ese nombre.</CommandEmpty>
            {groups.map(([root, items]) => (
              <CommandGroup key={root || 'root'} heading={root || 'Accesos'}>
                {items.map((leaf) => {
                  const Icon = getMenuIcon(leaf.parents[0] ?? leaf.title);
                  const path = leaf.parents.slice(1);

                  return (
                    <CommandItem
                      key={leaf.key}
                      // cmdk filtra por `value`: con la ruta completa, "gastos
                      // proveedores" también encuentra la pantalla.
                      value={[...leaf.parents, leaf.title].join(' ')}
                      onSelect={() => go(leaf.href)}
                      className="cursor-pointer gap-3 rounded-lg px-2 py-2.5 data-[selected=true]:bg-orange-50 data-[selected=true]:text-neutral-950"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-950 text-secondary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="flex-1 truncate">
                        {path.length > 0 && (
                          <span className="text-neutral-400">
                            {path.join(' · ')} ·{' '}
                          </span>
                        )}
                        {leaf.title}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
