'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { Textarea } from '@/components/ui/textarea.component';
import { ReasonSchema } from '@/schemas/expense.schema';

interface ReasonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  /** Texto del botón mientras `onConfirm` corre. */
  busyLabel: string;
  placeholder?: string;
  /**
   * Recibe el motivo ya validado (3 a 300 caracteres). Si resuelve, el diálogo
   * se cierra y limpia; si lanza, queda abierto (quien llama muestra el error).
   */
  onConfirm: (reason: string) => Promise<void>;
}

/**
 * Pedir un motivo obligatorio antes de una acción definitiva sobre un gasto:
 * anularlo o rechazarlo. Un `Dialog` propio y no `ConfirmDialog`, porque este
 * mete la descripción en un `<p>` (sin lugar para un textarea) y se cierra solo
 * al confirmar.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  busyLabel,
  placeholder = 'Motivo',
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  const close = (next: boolean) => {
    if (!next) {
      setReason('');
      setError(undefined);
    }
    onOpenChange(next);
  };

  const confirm = async () => {
    const parsed = ReasonSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setBusy(true);
    try {
      await onConfirm(parsed.data.reason);
      close(false);
    } catch {
      // Quien llama ya avisó; el diálogo queda abierto para reintentar.
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1">
          <Textarea
            rows={3}
            placeholder={placeholder}
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              setError(undefined);
            }}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => close(false)}
            disabled={busy}
          >
            Volver
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
