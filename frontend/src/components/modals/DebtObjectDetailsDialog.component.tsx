import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { usdFormatCurrency } from '@/lib/utils';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import { DebtObjectItem } from '@/services/transactions/types/DebtObjects.type';
import {
  canViewTransactionDetails,
  normalizeTypeLabel,
} from '@/utils/debtObjects.utils';

interface DebtObjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  debtObject: DebtObjectItem | null;
  token: string;
  transactionId?: string | number;
}

export const DebtObjectDetailsDialog: React.FC<
  DebtObjectDetailsDialogProps
> = ({ isOpen, onClose, debtObject, token, transactionId }) => {
  const transactionService = useMemo(() => new TransactionService(), []);
  const [transaction, setTransaction] = useState<TransactionDataResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const idToFetch =
      transactionId ||
      (debtObject && canViewTransactionDetails(debtObject.type)
        ? debtObject.id
        : null);

    if (isOpen && idToFetch) {
      setIsLoading(true);
      setTransaction(null);
      transactionService
        .getTransactionById(token, idToFetch.toString())
        .then((tx) => setTransaction(tx))
        .catch(() => setTransaction(null))
        .finally(() => setIsLoading(false));
    } else {
      setTransaction(null);
      setIsLoading(false);
    }
  }, [isOpen, debtObject, token, transactionService, transactionId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent width="800px" maxHeight="80vh">
        <DialogHeader>
          <DialogTitle>Detalles del objeto de deuda</DialogTitle>
        </DialogHeader>

        {debtObject && (
          <div className="mb-4 p-3 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Fecha:</span>{' '}
                {new Date(debtObject.date).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Producto:</span>{' '}
                {debtObject.product}
              </div>
              <div>
                <span className="font-semibold">Monto:</span>{' '}
                <span
                  className={
                    debtObject.adds ? 'text-red-600' : 'text-green-600'
                  }
                >
                  {usdFormatCurrency(debtObject.amount)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Acción:</span>{' '}
                <span
                  className={
                    debtObject.adds ? 'text-red-600' : 'text-green-600'
                  }
                >
                  {debtObject.adds ? 'Suma' : 'Resta'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Tipo:</span>{' '}
                {normalizeTypeLabel(debtObject.type)}
              </div>
            </div>
          </div>
        )}

        {isLoading && <div>Cargando detalles...</div>}

        {!isLoading &&
          debtObject &&
          !canViewTransactionDetails(debtObject.type) && (
            <div className="p-3 border rounded-md bg-yellow-50 text-yellow-700 text-sm">
              Los detalles de órdenes están en progreso en el backend.
            </div>
          )}

        {!isLoading && transaction && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Transacción</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span>{transaction.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tipo:</span>
                  <span className="capitalize">{transaction.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Monto individual:</span>
                  <span>
                    {usdFormatCurrency(
                      Number((transaction as any)?.amount || 0)
                    )}
                  </span>
                </div>
                {transaction.quantity && (
                  <div className="flex justify-between">
                    <span className="font-medium">Cantidad:</span>
                    <span>
                      {Number((transaction as any)?.quantity?.parsedValue || 1)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Fecha de creación:</span>
                  <span>
                    {new Date(transaction.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Producto</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Nombre:</span>
                  <span>{transaction.product?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">SKU:</span>
                  <span>{transaction.product?.sku}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Modelo:</span>
                  <span>{transaction.product?.model}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Marca:</span>
                  <span>{transaction.product?.brand}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Sucursales</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Sucursal Origen:</span>
                  <span>{transaction.originBranch?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Sucursal Destino:</span>
                  <span>{transaction.targetBranch?.name || 'N/A'}</span>
                </div>
                {transaction.invoiceOrigin && (
                  <div className="flex justify-between">
                    <span className="font-medium">Origen Factura:</span>
                    <span>
                      {typeof transaction.invoiceOrigin === 'object'
                        ? transaction.invoiceOrigin.name ||
                          JSON.stringify(transaction.invoiceOrigin)
                        : transaction.invoiceOrigin}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
