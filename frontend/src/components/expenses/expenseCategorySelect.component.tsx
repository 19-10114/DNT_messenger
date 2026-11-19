'use client';

import { useContext, useMemo, useRef, useState } from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { Check, ChevronDown } from 'lucide-react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command.component';
import { useExpenseCategories } from '@/hooks/expenses';
import { cn } from '@/lib/utils';
import { KIND_LABELS } from './expense.utils';
import { ModalSelectContainerContext } from './modalSelectContent.component';

interface ExpenseCategorySelectProps {
  /** Id de la categoría como string; `''` = ninguna (o "Todas" con `allLabel`). */
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  /** Si viene, agrega una primera opción con este texto que devuelve `''` (filtros). */
  allLabel?: string;
  className?: string;
  /**
   * `expense`: solo categorías de gasto (filas de cargo). `deduction`: solo
   * descuentos (filas de descuento). Sin valor: todas (filtros).
   */
  only?: 'expense' | 'deduction';
  placeholder?: string;
}

const ALL = '__all__';

/** Minúsculas y sin tildes: "dia" encuentra "Día de descanso". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

/**
 * Filtro de cmdk: cada palabra buscada debe aparecer en el nombre, el código de
 * cuenta o el grupo. El score por defecto de cmdk no ignora tildes.
 */
function matchCategory(value: string, search: string, keywords?: string[]) {
  // Solo las palabras clave: `value` es el id, y buscar "1" no debe
  // encontrar la categoría 1.
  const haystack = normalize((keywords?.length ? keywords : [value]).join(' '));
  return normalize(search)
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word))
    ? 1
    : 0;
}

/**
 * Selector de categoría con buscador, agrupado por cuenta contable (grupos de
 * 4 dígitos del plan de cuentas). Las categorías que no son gasto operativo
 * llevan su tipo al lado para que un retiro no se confunda con un gasto.
 *
 * Dentro del modal de gastos el desplegable se monta en el propio modal (ver
 * `ModalSelectContent`: el Popover también trae su propia copia de
 * react-focus-scope y el modal le quitaría el foco al buscador).
 */
export function ExpenseCategorySelect({
  value,
  onChange,
  disabled,
  allLabel,
  className,
  only,
  placeholder,
}: ExpenseCategorySelectProps) {
  const {
    categories,
    categoriesByGroup: allGroups,
    isLoading,
  } = useExpenseCategories();
  const categoriesByGroup = useMemo(() => {
    if (!only) return allGroups;
    const wanted = (kind: string) =>
      only === 'deduction'
        ? kind === 'deduccion'
        : // El IVA y las retenciones los agrega el sistema, nunca a mano.
          !['deduccion', 'impuesto', 'retencion'].includes(kind);
    return allGroups
      .map((group) => ({
        ...group,
        categories: group.categories.filter((category) =>
          wanted(category.kind)
        ),
      }))
      .filter((group) => group.categories.length > 0);
  }, [allGroups, only]);
  const container = useContext(ModalSelectContainerContext);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const selected = categories.find((category) => String(category.id) === value);
  const label = selected
    ? selected.name
    : value === '' && allLabel
      ? allLabel
      : undefined;

  const choose = (categoryId: string) => {
    onChange(categoryId);
    setOpen(false);
  };

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          // Radix pone aria-expanded / aria-controls / aria-haspopup.
          type="button"
          disabled={disabled || isLoading}
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span className={cn('truncate', !label && 'text-muted-foreground')}>
            {isLoading
              ? 'Cargando...'
              : (label ?? placeholder ?? 'Selecciona una categoría')}
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
          <Command filter={matchCategory}>
            <CommandInput
              ref={searchRef}
              placeholder="Buscar por nombre, cuenta o grupo..."
            />
            {/* Cabe en el espacio disponible (dentro del modal, en el modal). */}
            <CommandList
              style={{
                maxHeight:
                  'min(300px, calc(var(--radix-popover-content-available-height) - 3rem))',
              }}
            >
              <CommandEmpty>No se encontró ninguna categoría.</CommandEmpty>
              {allLabel && (
                <CommandGroup>
                  <CommandItem
                    value={ALL}
                    keywords={[allLabel]}
                    onSelect={() => choose('')}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === '' ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {allLabel}
                  </CommandItem>
                </CommandGroup>
              )}
              {categoriesByGroup.map((group) => (
                <CommandGroup
                  key={group.groupCode}
                  heading={`${group.groupCode} · ${group.groupName}`}
                >
                  {group.categories.map((category) => (
                    <CommandItem
                      key={category.id}
                      value={String(category.id)}
                      keywords={[
                        category.name,
                        category.accountCode,
                        group.groupCode,
                        group.groupName,
                      ]}
                      onSelect={() => choose(String(category.id))}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === String(category.id)
                            ? 'opacity-100'
                            : 'opacity-0'
                        )}
                      />
                      {category.name}
                      {category.kind !== 'gasto' && (
                        <span className="ml-2 text-xs text-amber-700">
                          ({KIND_LABELS[category.kind]})
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
