'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { useToast } from '@/components/ui/use-toast';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';
import { ReasonDialog } from '@/components/expenses/reasonDialog.component';
import {
  formatExpenseDateTime,
  userDisplayName,
} from '@/components/expenses/expense.utils';
import {
  useCancelCashWithdrawal,
  useCashWithdrawal,
} from '@/hooks/cashWithdrawals';
import { usdFormatCurrency } from '@/lib/utils';
import { getCashWithdrawalErrorMessage } from './cashWithdrawal.utils';

interface CashWithdrawalDetailModalProps {
  withdrawalId: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{children}</span>
    </div>
  );
}

/**
 * Ficha de una salida de efectivo, abierta desde "Movimientos en efectivo".
 * Anular pide motivo y devuelve el efectivo a la caja; el backend dice quién
 * puede (`canCancel`: admin siempre, quien la registró el mismo día).
 */
export function CashWithdrawalDetailModal({
  withdrawalId,
  open,
  onOpenChange,
}: CashWithdrawalDetailModalProps) {
  const { withdrawal, isLoading, isError } = useCashWithdrawal(
    open ? withdrawalId : undefined
  );
  const cancelMutation = useCancelCashWithdrawal();
  const { toast } = useToast();
  // ReasonDialog es un Dialog de la misma copia de Radix: anidarlo funciona.
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const isCancelled = withdrawal?.status === 'cancelled';

  const cancel = async (reason: string) => {
    if (!withdrawal) return;
    const { id, displayCode, amountUsd } = withdrawal;
    try {
      await cancelMutation.mutateAsync({ id, reason });
      toast({
        title: `Salida ${displayCode} anulada`,
        description: `${usdFormatCurrency(amountUsd)} vuelven al efectivo de la sucursal.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'No se pudo anular la salida',
        description: getCashWithdrawalErrorMessage(
          error,
          'Inténtalo de nuevo.'
        ),
        variant: 'destructive',
      });
      throw error;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Salida de efectivo {withdrawal?.displayCode ?? ''}
              {withdrawal && (
                <Badge
                  variant="outline"
                  className={
                    isCancelled
                      ? 'border-gray-300 bg-gray-100 text-gray-600'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }
                >
                  {isCancelled ? 'Anulada' : 'Registrada'}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading && (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          )}
          {isError && (
            <p className="text-sm text-destructive">
              No se pudo cargar la salida.
            </p>
          )}

          {withdrawal && (
            <div className="space-y-4">
              <div className="divide-y">
                <Row label="Monto">
                  <span className="font-semibold">
                    {usdFormatCurrency(withdrawal.amountUsd)}
                  </span>{' '}
                  <span className="text-muted-foreground">efectivo USD</span>
                </Row>
                <Row label="Destino">{withdrawal.destinationLabel}</Row>
                {withdrawal.concept && (
                  <Row label="Motivo">{withdrawal.concept}</Row>
                )}
                <Row label="Entregado a">{withdrawal.deliveredTo}</Row>
                {withdrawal.reference && (
                  <Row label="Referencia">{withdrawal.reference}</Row>
                )}
                <Row label="Sucursal">{withdrawal.branch.name}</Row>
                <Row label="Registrada por">
                  {userDisplayName(withdrawal.createdBy)} ·{' '}
                  {formatExpenseDateTime(withdrawal.createdAt)}
                </Row>
                {withdrawal.notes && (
                  <Row label="Observaciones">{withdrawal.notes}</Row>
                )}
                {isCancelled && (
                  <Row label="Anulada">
                    {userDisplayName(withdrawal.cancelledBy)} ·{' '}
                    {formatExpenseDateTime(withdrawal.cancelledAt)}
                    {withdrawal.cancelReason && (
                      <span className="block text-muted-foreground">
                        Motivo: {withdrawal.cancelReason}
                      </span>
                    )}
                  </Row>
                )}
              </div>

              {withdrawal.receiptMime && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Comprobante</h4>
                  {!withdrawal.receiptUrl ? (
                    <p className="text-sm text-muted-foreground">
                      Comprobante no disponible.
                    </p>
                  ) : withdrawal.receiptMime === 'application/pdf' ? (
                    <a
                      href={withdrawal.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary underline"
                    >
                      Ver PDF
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <a
                      href={withdrawal.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={withdrawal.receiptUrl}
                        alt="Comprobante de la salida"
                        className="max-h-96 rounded border object-contain"
                      />
                    </a>
                  )}
                </div>
              )}

              <ActivityTimeline
                targetModel="cash_withdrawal"
                targetId={withdrawal.id}
                variant="collapsible"
              />
            </div>
          )}

          {withdrawal?.canCancel && (
            <DialogFooter className="sticky bottom-0 -mx-6 -mb-6 mt-2 gap-2 border-t bg-background px-6 py-4">
              <Button
                variant="destructive"
                onClick={() => setIsCancelOpen(true)}
                disabled={cancelMutation.isLoading}
              >
                Anular salida
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={isCancelOpen}
        onOpenChange={setIsCancelOpen}
        title="Anular salida de efectivo"
        description="El monto vuelve al efectivo de la sucursal. La salida queda registrada con el motivo."
        confirmLabel="Anular salida"
        busyLabel="Anulando..."
        placeholder="Motivo de la anulación"
        onConfirm={cancel}
      />
    </>
  );
}
