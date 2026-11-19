'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Expense } from '@/services/expenses/types/Expense.type';
import { ExpenseForm } from './expenseForm.component';
import { ModalSelectContainerContext } from './modalSelectContent.component';

interface ExpenseFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edición; ausente = registro de un gasto nuevo. */
  editExpense?: Expense;
  /** Registro desde Pre Gastos: queda pendiente, también para un admin. */
  asRequest?: boolean;
}

/**
 * Registro o edición de un gasto en un modal, sin salir del listado. El
 * formulario se monta al abrir y se desmonta al cerrar, así cada alta empieza
 * en blanco. Se cierra solo al guardar; Cancelar y Escape descartan.
 */
export function ExpenseFormModal({
  open,
  onOpenChange,
  editExpense,
  asRequest = false,
}: ExpenseFormModalProps) {
  const isEditing = !!editExpense;
  const close = () => onOpenChange(false);
  // Los selects del formulario montan su desplegable aquí dentro (ver
  // ModalSelectContent). El modal en sí NO hace scroll: lo hace el cuerpo de
  // abajo. Así un desplegable, que se monta en el modal pero fuera de ese
  // cuerpo, no puede desplazar el formulario al abrirse (el foco en su
  // buscador y el scrollIntoView de cmdk movían todo el modal).
  const [container, setContainer] = useState<HTMLDivElement | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={setContainer}
        className="flex max-w-3xl flex-col gap-0 overflow-hidden p-0"
        // DialogContent pone `overflowY: auto` en línea, y eso pisa las
        // clases: el modal hacía scroll además del cuerpo (doble barra). Aquí
        // solo desplaza el cuerpo; el alto máximo va también en línea por lo
        // mismo.
        style={{ width: '75%', maxHeight: '90vh', overflowY: 'hidden' }}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>
            {isEditing
              ? `Editar gasto ${editExpense.displayCode}`
              : asRequest
                ? 'Registrar pre-gasto'
                : 'Registrar gasto'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Los cambios quedan registrados en la auditoría. La sucursal no se puede cambiar: si es otra, anula el gasto y regístralo de nuevo.'
              : asRequest
                ? 'Queda en Pre Gastos hasta que un admin lo apruebe; mientras tanto no cuenta en la caja ni en los reportes.'
                : 'Solo los pagados en efectivo USD descuentan el efectivo de la sucursal.'}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          <ModalSelectContainerContext.Provider value={container}>
            <ExpenseForm
              editExpense={editExpense}
              asRequest={asRequest}
              onSaved={close}
              onCancel={close}
            />
          </ModalSelectContainerContext.Provider>
        </div>
      </DialogContent>
    </Dialog>
  );
}
