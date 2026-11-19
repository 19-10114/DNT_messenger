'use client';

import React, { useState } from 'react';
import { Check, ChevronsUpDown, Wrench, X } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button.component';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { useUsers } from '@/hooks/useUsers';
import { cn } from '@/lib/utils';

/** Lo mínimo que el selector necesita para pintar un mecánico ya elegido */
export interface MechanicSelection {
  id: number;
  firstName: string;
  lastName: string;
  documentId?: string;
}

interface MechanicSelectProps {
  value: MechanicSelection | null;
  onChange: (mechanic: MechanicSelection | null) => void;
  disabled?: boolean;
}

/** Una página alcanza: el filtrado real lo hace la búsqueda del backend */
const PAGE_SIZE = '20';

function mechanicName(mechanic: MechanicSelection): string {
  return `${mechanic.firstName ?? ''} ${mechanic.lastName ?? ''}`.trim();
}

/**
 * Selector con buscador de los mecánicos de la sucursal activa.
 * El listado se pide solo mientras el desplegable está abierto.
 */
export function MechanicSelect({
  value,
  onChange,
  disabled = false,
}: MechanicSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 500);

  const { users, isLoading, isError } = useUsers({
    role: 'mechanic',
    page: '1',
    pageSize: PAGE_SIZE,
    search: debouncedSearch,
    enabled: open,
  });

  const handleSelect = (mechanic: MechanicSelection | null) => {
    onChange(mechanic);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {value ? (
            <span className="flex items-center gap-2 truncate">
              <Wrench className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {mechanicName(value) || `Usuario #${value.id}`}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              Seleccionar mecánico...
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: 'var(--radix-popover-trigger-width)' }}
      >
        {/*
          `shouldFilter={false}`: el filtrado lo hace el backend con `search`.
          Si además filtrara cmdk sobre el texto visible, escondería resultados
          que el backend sí encontró (p. ej. por la cédula).
        */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar mecánico..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {isLoading
                ? 'Buscando mecánicos...'
                : isError
                  ? 'No se pudieron cargar los mecánicos.'
                  : 'No se encontró ningún mecánico.'}
            </CommandEmpty>

            {users.length > 0 ? (
              <CommandGroup>
                {users.map((mechanic) => {
                  const name =
                    `${mechanic.firstName ?? ''} ${mechanic.lastName ?? ''}`.trim() ||
                    mechanic.username;

                  return (
                    <CommandItem
                      key={mechanic.id}
                      value={String(mechanic.id)}
                      className="cursor-pointer"
                      onSelect={() =>
                        handleSelect({
                          id: mechanic.id,
                          firstName: mechanic.firstName,
                          lastName: mechanic.lastName,
                          documentId: mechanic.documentId,
                        })
                      }
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value?.id === mechanic.id
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{name}</span>
                        {mechanic.documentId ? (
                          <span className="text-xs text-muted-foreground">
                            Cédula: {mechanic.documentId}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ) : null}

            {value ? (
              <CommandGroup>
                <CommandItem
                  value="__clear__"
                  className="cursor-pointer text-muted-foreground"
                  onSelect={() => handleSelect(null)}
                >
                  <X className="mr-2 h-4 w-4" />
                  Quitar mecánico
                </CommandItem>
              </CommandGroup>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
