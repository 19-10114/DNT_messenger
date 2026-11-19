'use client';

import { useEffect, useState } from 'react';
import { Building2, Check, ChevronsUpDown, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandSeparator,
} from '@/components/ui/command.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { useToken, useSuperuser, useIsStaff } from '@/stores/auth/auth.store';
import {
  useCurrentBranchId,
  useBranches,
  useBranchActions,
  useIsLoadingBranches,
} from '@/stores/branch/branch.store';
import { useRoles } from '@/stores/auth/auth.store';

export function BranchSelector() {
  const [open, setOpen] = useState(false);
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const branches = useBranches();
  const isLoading = useIsLoadingBranches();
  const { fetchBranches, setCurrentBranch } = useBranchActions();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const roles = useRoles();

  const isAdmin =
    (isSuperuser === true && isStaff === false) || roles.includes('admin');
  const canChangeBranch =
    isAdmin ||
    ['main_storage', 'parts_admin', 'finance'].some((role) =>
      roles.includes(role)
    );
  const isPartsAdmin = roles.includes('parts_admin');

  useEffect(() => {
    if (token) {
      fetchBranches(token, isPartsAdmin);
    }
  }, [token, fetchBranches, currentBranchId, isPartsAdmin]);

  // Encontrar el nombre de la sucursal actual
  const currentBranch = branches.find(
    (branch) => branch.id === currentBranchId
  );

  // Handler para activar el modo super admin
  const handleSuperAdminMode = () => {
    setCurrentBranch(0, 'super_admin');
  };

  const label = isLoading
    ? 'Cargando...'
    : currentBranchId === 0
      ? 'Super Admin'
      : currentBranch
        ? currentBranch.name
        : 'Seleccionar sucursal';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        aria-label={`Sucursal: ${label}`}
        disabled={!canChangeBranch || isLoading}
        className="flex h-9 max-w-[200px] items-center gap-2 rounded-full bg-white/10 px-3 text-sm font-medium text-white transition-colors hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary disabled:cursor-default disabled:hover:bg-white/10"
      >
        {currentBranchId === 0 ? (
          <Crown className="h-4 w-4 shrink-0 text-secondary" />
        ) : (
          <Building2 className="h-4 w-4 shrink-0 text-secondary" />
        )}
        <span className="truncate">{label}</span>
        {canChangeBranch && (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 opacity-50" />
        )}
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={10} className="w-[240px] p-0">
        <Command>
          <CommandInput placeholder="Buscar sucursal..." />
          <CommandEmpty>No se encontraron sucursales.</CommandEmpty>
          <CommandGroup>
            {branches.map((branch) => (
              <CommandItem
                key={branch.id}
                value={branch.name}
                onSelect={() => {
                  setCurrentBranch(branch.id, branch.type);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    currentBranchId === branch.id ? 'opacity-100' : 'opacity-0'
                  )}
                />
                {branch.name}
              </CommandItem>
            ))}
          </CommandGroup>
          {isAdmin && (
            <>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="super admin todas las sucursales"
                  onSelect={() => {
                    handleSuperAdminMode();
                    setOpen(false);
                  }}
                >
                  <Crown
                    className={cn(
                      'mr-2 h-4 w-4 text-secondary',
                      currentBranchId === 0 ? 'opacity-100' : 'opacity-60'
                    )}
                  />
                  Super Admin (todas)
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
