'use client';

import { useContext, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  Bookmark,
  Building2,
  Check,
  ChevronDown,
  PenLine,
  Plus,
  User,
  X,
} from 'lucide-react';
import { useDebounce } from 'use-debounce';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import {
  useExpenseBeneficiaries,
  useSavedBeneficiaries,
} from '@/hooks/expenses';
import { useSupplierSearch } from '@/hooks/suppliers';
import { cn } from '@/lib/utils';
import {
  ExpenseBeneficiary,
  ExpenseSupplier,
} from '@/services/expenses/types/Expense.type';
import { SupplierFormModal } from '@/components/suppliers/supplierFormModal.component';
import {
  canManageSuppliers,
  describeRetentionProfile,
} from '@/components/suppliers/supplier.utils';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { beneficiaryKey, userDisplayName } from './expense.utils';
import { ModalSelectContainerContext } from './modalSelectContent.component';

export interface BeneficiaryValue {
  /** Id del usuario como string; vacío = texto libre (o nada). */
  userId: string;
  /** El nombre que se guarda: el del usuario, el del proveedor o el texto escrito. */
  name: string;
  /** Id del proveedor como string; vacío si no es un proveedor. */
  supplierId?: string;
  /** El proveedor elegido, con su perfil de retención (solo al elegirlo). */
  supplier?: ExpenseSupplier;
}

interface BeneficiarySelectProps {
  value: BeneficiaryValue;
  onChange: (value: BeneficiaryValue) => void;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  administrator: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero',
  seller: 'Vendedor',
  mechanic: 'Mecánico',
  storage: 'Almacén',
  main_storage: 'Almacén principal',
  parts_admin: 'Admin de repuestos',
};

/** "Gerente · Caracas": para distinguir a dos personas con el mismo nombre. */
function describe(user: ExpenseBeneficiary): string {
  const roles = (user.role ?? '')
    .split(',')
    .map((role) => ROLE_LABELS[role.trim()])
    .filter(Boolean)
    .join(', ');
  return [roles, user.branch?.name].filter(Boolean).join(' · ');
}

/**
 * Beneficiario del gasto, en cuatro grupos buscados en el backend:
 * - un proveedor (con RIF y perfil de retención: el gasto propone sus
 *   retenciones); quien administra proveedores puede crear uno desde aquí;
 * - un usuario de Moto Candela (personal de cualquier sucursal, no clientes);
 * - un beneficiario guardado: un nombre escrito en un gasto anterior;
 * - un nombre nuevo, que el backend guarda al registrar el gasto para que
 *   aparezca la próxima vez. No se ofrece si ya existe guardado (mismo nombre
 *   sin importar mayúsculas ni tildes, `beneficiaryKey`).
 * Dentro del modal de gastos el desplegable se monta en el propio modal (ver
 * `ModalSelectContent`).
 */
export function BeneficiarySelect({ value, onChange }: BeneficiarySelectProps) {
  const container = useContext(ModalSelectContainerContext);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search.trim(), 300);
  const { beneficiaries, isLoading, isError } = useExpenseBeneficiaries(
    debouncedSearch,
    open
  );
  const { savedBeneficiaries, isLoading: isLoadingSaved } =
    useSavedBeneficiaries(debouncedSearch, open);
  const { suppliers, isLoading: isLoadingSuppliers } = useSupplierSearch(
    debouncedSearch,
    open
  );
  const canCreateSupplier = canManageSuppliers(
    useRoles(),
    useSuperuser(),
    useIsStaff()
  );
  const [newSupplierName, setNewSupplierName] = useState<string>();

  const choose = (next: BeneficiaryValue) => {
    onChange({ supplierId: '', ...next });
    setOpen(false);
    setSearch('');
  };
  const chooseSupplier = (supplier: ExpenseSupplier) =>
    choose({
      userId: '',
      name: supplier.name,
      supplierId: String(supplier.id),
      supplier,
    });
  const typed = search.trim();
  const typedKey = beneficiaryKey(typed);
  // Si el nombre escrito ya está guardado, se elige ese y no se ofrece uno nuevo.
  const typedIsSaved = savedBeneficiaries.some(
    (saved) => beneficiaryKey(saved.name) === typedKey
  );
  const selectedKey =
    value.userId || value.supplierId ? '' : beneficiaryKey(value.name);
  const nothingFound =
    beneficiaries.length === 0 &&
    savedBeneficiaries.length === 0 &&
    suppliers.length === 0;

  return (
    <>
      <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
        <PopoverPrimitive.Trigger asChild>
          {/* Radix pone aria-expanded / aria-controls / aria-haspopup. */}
          <button
            type="button"
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          >
            <span
              className={cn(
                'flex items-center gap-2 truncate',
                !value.name && 'text-muted-foreground'
              )}
            >
              {value.userId && <User className="h-4 w-4 shrink-0" />}
              {value.supplierId && <Building2 className="h-4 w-4 shrink-0" />}
              <span className="truncate">
                {value.name || 'A quién se le pagó'}
              </span>
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </button>
        </PopoverPrimitive.Trigger>
        <PopoverPrimitive.Portal container={container ?? undefined}>
          <PopoverPrimitive.Content
            align="start"
            sideOffset={4}
            collisionPadding={8}
            collisionBoundary={container ?? undefined}
            // Enfocar el buscador sin desplazar nada: el foco automático de
            // Radix hace scrollIntoView y movía el modal al abrir.
            onOpenAutoFocus={(event) => {
              event.preventDefault();
              searchRef.current?.focus({ preventScroll: true });
            }}
            className="z-50 rounded-md border bg-popover p-0 text-popover-foreground shadow-md outline-none"
            style={{ width: 'max(var(--radix-popover-trigger-width), 18rem)' }}
          >
            {/* El filtrado lo hace el backend (nombre, apellido o usuario). */}
            <Command shouldFilter={false}>
              <CommandInput
                ref={searchRef}
                placeholder="Buscar o escribir un nombre nuevo..."
                value={search}
                onValueChange={setSearch}
              />
              <CommandList
                style={{
                  maxHeight:
                    'min(300px, calc(var(--radix-popover-content-available-height) - 3rem))',
                }}
              >
                {!typed && nothingFound && (
                  <CommandEmpty>
                    {isLoading || isLoadingSaved || isLoadingSuppliers
                      ? 'Buscando...'
                      : isError
                        ? 'No se pudieron cargar los beneficiarios.'
                        : 'No hay beneficiarios. Escribe un nombre.'}
                  </CommandEmpty>
                )}

                {typed && !typedIsSaved && (
                  <CommandGroup>
                    <CommandItem
                      value="__typed__"
                      onSelect={() => choose({ userId: '', name: typed })}
                    >
                      <PenLine className="mr-2 h-4 w-4 shrink-0" />
                      <div className="flex flex-col">
                        <span>Nuevo: «{typed}»</span>
                        <span className="text-xs text-muted-foreground">
                          Se guardará para próximos gastos
                        </span>
                      </div>
                    </CommandItem>
                    {canCreateSupplier && (
                      <CommandItem
                        value="__new_supplier__"
                        onSelect={() => {
                          setOpen(false);
                          setNewSupplierName(typed);
                          setSearch('');
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4 shrink-0" />
                        <div className="flex flex-col">
                          <span>Crear proveedor «{typed}»</span>
                          <span className="text-xs text-muted-foreground">
                            Con RIF y retenciones de IVA / ISLR
                          </span>
                        </div>
                      </CommandItem>
                    )}
                  </CommandGroup>
                )}

                {suppliers.length > 0 && (
                  <CommandGroup heading="Proveedores">
                    {suppliers.map((supplier) => (
                      <CommandItem
                        key={supplier.id}
                        value={`supplier-${supplier.id}`}
                        onSelect={() => chooseSupplier(supplier)}
                      >
                        {value.supplierId === String(supplier.id) ? (
                          <Check className="mr-2 h-4 w-4 shrink-0" />
                        ) : (
                          <Building2 className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                        )}
                        <div className="flex flex-col">
                          <span>{supplier.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {supplier.rif} ·{' '}
                            {describeRetentionProfile(supplier)}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {savedBeneficiaries.length > 0 && (
                  <CommandGroup heading="Beneficiarios guardados">
                    {savedBeneficiaries.map((saved) => (
                      <CommandItem
                        key={saved.id}
                        value={`saved-${saved.id}`}
                        onSelect={() =>
                          choose({ userId: '', name: saved.name })
                        }
                      >
                        {selectedKey === beneficiaryKey(saved.name) ? (
                          <Check className="mr-2 h-4 w-4 shrink-0" />
                        ) : (
                          <Bookmark className="mr-2 h-4 w-4 shrink-0 opacity-40" />
                        )}
                        {saved.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {beneficiaries.length > 0 && (
                  <CommandGroup heading="Usuarios de Moto Candela">
                    {beneficiaries.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`user-${user.id}`}
                        onSelect={() =>
                          choose({
                            userId: String(user.id),
                            name: userDisplayName(user),
                          })
                        }
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4 shrink-0',
                            value.userId === String(user.id)
                              ? 'opacity-100'
                              : 'opacity-0'
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{userDisplayName(user)}</span>
                          {describe(user) && (
                            <span className="text-xs text-muted-foreground">
                              {describe(user)}
                            </span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}

                {value.name && (
                  <CommandGroup>
                    <CommandItem
                      value="__clear__"
                      className="text-muted-foreground"
                      onSelect={() => choose({ userId: '', name: '' })}
                    >
                      <X className="mr-2 h-4 w-4 shrink-0" />
                      Quitar beneficiario
                    </CommandItem>
                  </CommandGroup>
                )}
              </CommandList>
            </Command>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>
      <SupplierFormModal
        open={newSupplierName !== undefined}
        onOpenChange={(isOpen) => !isOpen && setNewSupplierName(undefined)}
        initialName={newSupplierName}
        onSaved={(supplier) => chooseSupplier(supplier)}
      />
    </>
  );
}
