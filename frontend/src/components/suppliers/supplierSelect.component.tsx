'use client';

import { useContext, useEffect, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { useDebounce } from 'use-debounce';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import { ModalSelectContainerContext } from '@/components/expenses/modalSelectContent.component';
import { useSupplierSearch } from '@/hooks/suppliers';
import { cn } from '@/lib/utils';

interface SupplierSelectProps {
  /** Id del proveedor como string; vacío = todos. */
  value: string;
  onChange: (supplierId: string) => void;
  allLabel?: string;
}

/**
 * Filtro por proveedor: combobox con búsqueda por nombre o RIF en el backend
 * (solo activos). Vacío = todos.
 */
export function SupplierSelect({
  value,
  onChange,
  allLabel = 'Todos',
}: SupplierSelectProps) {
  const container = useContext(ModalSelectContainerContext);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const [selectedName, setSelectedName] = useState('');
  const { suppliers, isLoading } = useSupplierSearch(debouncedSearch, open);

  // Si el filtro se limpia desde fuera, se olvida el nombre mostrado.
  useEffect(() => {
    if (!value) setSelectedName('');
  }, [value]);

  const choose = (id: string, name: string) => {
    onChange(id);
    setSelectedName(name);
    setOpen(false);
    setSearch('');
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value ? selectedName || `Proveedor #${value}` : allLabel}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal container={container ?? undefined}>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          collisionPadding={8}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus({ preventScroll: true });
          }}
          className="z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
          style={{ width: 'max(var(--radix-popover-trigger-width), 18rem)' }}
        >
          <Command shouldFilter={false}>
            <CommandInput
              ref={searchRef}
              placeholder="Buscar por nombre o RIF..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList style={{ maxHeight: 300 }}>
              {suppliers.length === 0 && (
                <CommandEmpty>
                  {isLoading ? 'Buscando...' : 'No hay proveedores.'}
                </CommandEmpty>
              )}
              <CommandGroup>
                <CommandItem value="__all__" onSelect={() => choose('', '')}>
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value ? 'opacity-0' : 'opacity-100'
                    )}
                  />
                  {allLabel}
                </CommandItem>
                {suppliers.map((supplier) => (
                  <CommandItem
                    key={supplier.id}
                    value={`supplier-${supplier.id}`}
                    onSelect={() => choose(String(supplier.id), supplier.name)}
                  >
                    {value === String(supplier.id) ? (
                      <Check className="mr-2 h-4 w-4 shrink-0" />
                    ) : (
                      <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                    )}
                    <div className="flex flex-col">
                      <span>{supplier.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {supplier.rif}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
