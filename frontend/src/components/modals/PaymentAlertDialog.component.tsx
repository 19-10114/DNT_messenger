import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { AlertTriangle, AlertOctagon } from 'lucide-react';
import { cn, getDaysUntil, formatDate, usdFormatCurrency } from '@/lib/utils';

interface PaymentAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  leases: Array<{
    id: number;
    nextPaymentDate: string;
    productName?: string;
    monthlyFee?: number;
  }>;
}

const PaymentAlertDialog = ({
  isOpen,
  onClose,
  leases,
}: PaymentAlertDialogProps) => {
  const categorizedLeases = leases.reduce(
    (acc, lease) => {
      const daysUntilPayment = getDaysUntil(lease.nextPaymentDate);

      if (daysUntilPayment < 0) {
        acc.overdue.push(lease);
      } else if (daysUntilPayment <= 3) {
        acc.upcoming.push(lease);
      }

      return acc;
    },
    { overdue: [], upcoming: [] } as {
      overdue: typeof leases;
      upcoming: typeof leases;
    }
  );

  const hasAlerts =
    categorizedLeases.overdue.length > 0 ||
    categorizedLeases.upcoming.length > 0;

  if (!hasAlerts) return null;

  const renderAlertCard = (
    lease: (typeof leases)[0],
    variant: 'overdue' | 'upcoming'
  ) => {
    const isOverdue = variant === 'overdue';
    const Icon = isOverdue ? AlertOctagon : AlertTriangle;

    return (
      <div
        key={lease.id}
        className={cn(
          'p-4 border rounded-lg',
          isOverdue
            ? 'bg-red-50 border-red-200'
            : 'bg-yellow-50 border-yellow-200'
        )}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={cn(
              'h-5 w-5 mt-1 flex-shrink-0',
              isOverdue ? 'text-red-600' : 'text-yellow-600'
            )}
          />
          <div className="space-y-2">
            <div
              className={cn(
                'font-medium',
                isOverdue ? 'text-red-900' : 'text-yellow-900'
              )}
            >
              <p className="font-semibold">
                {lease.productName || 'Producto'} - Próximo pago:{' '}
                {formatDate(lease.nextPaymentDate)}
              </p>
              <p className="mt-1">
                {isOverdue
                  ? 'Estimado cliente Dale Play, su cuota esta vencida y su moto desconectada. Realice el pago a la brevedad.'
                  : 'Estimado cliente Dale Play, su cuota está por vencerse, realice el pago.'}
              </p>
              {lease.monthlyFee && (
                <p className="mt-1">
                  Monto a pagar: {usdFormatCurrency(lease.monthlyFee)}
                </p>
              )}
            </div>
            <p
              className={cn(
                'text-sm',
                isOverdue ? 'text-red-700' : 'text-yellow-700'
              )}
            >
              Si requiere información, comuníquese con Cobranzas 04126500162
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600 flex items-center gap-2">
            <AlertOctagon className="h-6 w-6" />
            Alerta de Pagos Pendientes
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {categorizedLeases.overdue.length > 0 && (
            <div className="space-y-4">
              {categorizedLeases.overdue.map((lease) =>
                renderAlertCard(lease, 'overdue')
              )}
            </div>
          )}

          {categorizedLeases.upcoming.length > 0 && (
            <div className="space-y-4">
              {categorizedLeases.upcoming.map((lease) =>
                renderAlertCard(lease, 'upcoming')
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full sm:w-auto bg-primary hover:bg-primary/90"
          >
            Entendido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentAlertDialog;
