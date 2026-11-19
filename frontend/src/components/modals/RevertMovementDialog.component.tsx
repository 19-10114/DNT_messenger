'use client';

import React, { useState } from 'react';

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useRevertOrder,
  useRevertTransaction,
} from '@/hooks/useRevertMovement';

interface RevertMovementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `order` revierte la orden completa; `transaction` una línea suelta. */
  target: 'order' | 'transaction';
  id: number | string;
  /** Resumen de lo que se va a deshacer, mostrado antes de confirmar. */
  summary?: React.ReactNode;
  /** Se llama tras un revert exitoso -- normalmente para cerrar la ficha. */
  onReverted?: () => void;
}

/**
 * Confirmación de un revert, compartida por la ficha de transacción y la de
 * orden.
 *
 * Una sola pieza para los dos casos porque la decisión del usuario es la misma
 * y los errores que puede recibir también: el backend contesta 409 con un
 * mensaje que nombra el obstáculo -- movimientos posteriores de la moto, stock
 * ya vendido, un GPS instalado -- y ese texto es la mitad útil de la
 * interacción, así que se muestra tal cual en vez de resumirlo a "error".
 */
export function RevertMovementDialog({
  open,
  onOpenChange,
  target,
  id,
  summary,
  onReverted,
}: RevertMovementDialogProps) {
  const [reason, setReason] = useState('');
  const { toast } = useToast();
  const { revertTransaction, isRevertingTransaction } = useRevertTransaction();
  const { revertOrder, isRevertingOrder } = useRevertOrder();

  const isReverting = isRevertingTransaction || isRevertingOrder;
  const noun = target === 'order' ? 'la orden' : 'la transacción';

  const handleConfirm = () => {
    const onSuccess = () => {
      toast({
        title: 'Movimiento revertido',
        description: `Se revirtió ${noun} #${id}.`,
      });
      setReason('');
      onOpenChange(false);
      onReverted?.();
    };

    const onError = (error: any) => {
      toast({
        title: 'No se pudo revertir',
        // El mensaje del backend nombra qué lo impide y qué hacer al
        // respecto; perderlo deja al admin sin nada accionable.
        description:
          error?.response?.data?.message ??
          'Ocurrió un error al revertir el movimiento.',
        variant: 'destructive',
      });
    };

    if (target === 'order') {
      revertOrder({ id, reason }, { onSuccess, onError });
    } else {
      revertTransaction({ id, reason }, { onSuccess, onError });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Revertir {noun} #{id}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>
                Se deshace el movimiento completo: el inventario, la deuda entre
                sucursales y la caja vuelven a como estaban antes. Queda
                registrado quién lo hizo.
              </p>
              {summary}
              <p className="text-destructive font-medium">
                Esta acción no se puede deshacer desde el sistema.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2">
          <Label htmlFor="revert-reason">Motivo (opcional)</Label>
          <Textarea
            id="revert-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ej: placa mal cargada, se vuelve a registrar"
            maxLength={300}
            disabled={isReverting}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isReverting}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isReverting}
          >
            {isReverting ? 'Revirtiendo...' : 'Revertir'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
