'use client';

import { useState } from 'react';
import { Check, ChevronsUpDown, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { useBranches } from '@/stores/branch/branch.store';

interface OrderBranchSelectorProps {
  value: number | null;
  onChange: (branchId: number) => void;
  /** Encabezado del selector; por defecto, el de la pre orden */
  label?: string;
  /** Aviso mientras no hay sucursal elegida */
  helperText?: string;
  /**
   * Saca sucursales del listado. Lo usa la venta por sucursal para dejar
   * afuera la de origen —no se vende a sí misma— y a Ventas.
   */
  excludeBranchIds?: Array<number | null | undefined>;
}

export function OrderBranchSelector({
  value,
  onChange,
  label = 'Sucursal de la Pre Orden',
  helperText = '⚠️ Seleccione una sucursal para ver el inventario disponible',
  excludeBranchIds,
}: OrderBranchSelectorProps) {
  const [open, setOpen] = useState(false);
  const allBranches = useBranches();

  const excluded = (excludeBranchIds ?? []).filter(
    (id): id is number => typeof id === 'number'
  );
  const branches = excluded.length
    ? allBranches.filter((branch) => !excluded.includes(branch.id))
    : allBranches;

  const currentBranch = branches.find((b) => b.id === value);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Store className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            {currentBranch ? currentBranch.name : 'Seleccionar sucursal...'}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar sucursal..." />
            <CommandEmpty>No se encontraron sucursales.</CommandEmpty>
            <CommandGroup>
              {branches.map((branch) => (
                <CommandItem
                  key={branch.id}
                  value={branch.name}
                  onSelect={() => {
                    onChange(branch.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === branch.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {branch.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
      {!value && <p className="text-xs text-amber-600">{helperText}</p>}
    </div>
  );
}
