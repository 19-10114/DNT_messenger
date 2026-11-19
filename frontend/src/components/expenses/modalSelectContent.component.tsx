'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import {
  SelectContent,
  SelectScrollDownButton,
  SelectScrollUpButton,
} from '@/components/ui/select.component';

/**
 * El nodo del modal de gastos donde montar los desplegables. `null` fuera del
 * modal (p. ej. los filtros del listado), y entonces se usa `SelectContent`
 * tal cual.
 */
export const ModalSelectContainerContext =
  React.createContext<HTMLElement | null>(null);

/**
 * `SelectContent` para los selects del formulario de gastos dentro de su modal.
 *
 * El `Dialog` compartido (@radix-ui/react-dialog 1.1.4) y el `Select` (2.2.6)
 * traen copias distintas de react-focus-scope, así que el modal no sabe que el
 * desplegable está abierto: su trampa de foco le quita el foco a cada opción
 * (no se resalta y no se puede elegir). Montado dentro del propio modal, el
 * foco no sale de él. Arreglo local del módulo; el de raíz es alinear las
 * versiones de Radix para toda la app.
 */
export const ModalSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const container = React.useContext(ModalSelectContainerContext);

  if (!container) {
    return (
      <SelectContent ref={ref} className={className} {...props}>
        {children}
      </SelectContent>
    );
  }

  // Mismas clases que SelectContent (position popper). El límite de colisión es
  // el modal: el desplegable se recorta con su scroll, así que debe caber en él.
  return (
    <SelectPrimitive.Portal container={container}>
      <SelectPrimitive.Content
        ref={ref}
        position="popper"
        collisionPadding={8}
        collisionBoundary={container}
        className={cn(
          'relative z-50 max-h-96 max-h-[var(--radix-select-content-available-height)] min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        {...props}
      >
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport className="w-full min-w-[var(--radix-select-trigger-width)] p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
});
ModalSelectContent.displayName = 'ModalSelectContent';
