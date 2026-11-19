import React from 'react';
import { Payment } from '@/models/lease.model';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  formatCurrency,
  formatCurrencyBolivares,
  formatDate,
} from '@/lib/utils';

interface PaymentHistoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  payments: Payment[];
  productName: string;
}

const PaymentHistoryDialog = ({
  isOpen,
  onClose,
  payments,
  productName,
}: PaymentHistoryDialogProps) => {
  const filteredPayments = payments.filter(
    (payment) => payment.status !== 'CANCELED' && payment.status !== 'REJECTED'
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Historial de Pagos - {productName}
          </DialogTitle>
        </DialogHeader>

        {filteredPayments.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Monto</th>
                  <th className="px-4 py-2">Concepto</th>
                  <th className="px-4 py-2">Fecha</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-2">
                      {payment.currency === 'USD'
                        ? formatCurrency(payment.amount)
                        : formatCurrencyBolivares(payment.amountCharged)}
                    </td>
                    <td className="px-4 py-2">{payment.concept}</td>
                    <td className="px-4 py-2">{formatDate(payment.date)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-1 rounded-full text-sm ${
                          payment.status === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center py-4">
            No hay pagos registrados para este arrendamiento.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHistoryDialog;
