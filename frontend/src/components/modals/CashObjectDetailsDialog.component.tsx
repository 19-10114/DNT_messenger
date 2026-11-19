import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import { CashObjectItem } from '@/services/transactions/types/CashObjects.type';
import {
  canViewTransactionDetails,
  normalizeTypeLabel,
} from '@/utils/debtObjects.utils';
import { useOrders } from '@/hooks/useOrders';

interface CashObjectDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  cashObject: CashObjectItem | null;
  token: string;
}

export const CashObjectDetailsDialog: React.FC<
  CashObjectDetailsDialogProps
> = ({ isOpen, onClose, cashObject, token }) => {
  const transactionService = useMemo(() => new TransactionService(), []);
  const [transaction, setTransaction] = useState<TransactionDataResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const isOrder = useMemo(() => {
    const t = (cashObject?.type || '').toLowerCase();
    return t === 'order' || t === 'orden';
  }, [cashObject]);
  const isTransaction = useMemo(() => {
    const t = (cashObject?.type || '').toLowerCase();
    return t === 'transaction' || t === 'transferencia' || t === 'transaccion';
  }, [cashObject]);

  const { orderById, isLoadingOrderById, isErrorOrderById } = useOrders(
    token,
    false,
    undefined,
    {},
    isOrder ? cashObject?.id.toString() : undefined,
    isOrder
  );

  useEffect(() => {
    if (isOpen && cashObject && isTransaction) {
      setIsLoading(true);
      setTransaction(null);
      transactionService
        .getTransactionById(token, cashObject.id.toString())
        .then((tx) => setTransaction(tx))
        .catch(() => setTransaction(null))
        .finally(() => setIsLoading(false));
    } else {
      setTransaction(null);
      setIsLoading(false);
    }
  }, [isOpen, cashObject, token, transactionService, isTransaction]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent width="800px" maxHeight="80vh">
        <DialogHeader>
          <DialogTitle>Detalles del objeto de efectivo</DialogTitle>
        </DialogHeader>

        {cashObject && (
          <div className="mb-4 p-3 border rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Fecha:</span>{' '}
                {new Date(cashObject.date).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Producto:</span>{' '}
                {cashObject.product}
              </div>
              <div>
                <span className="font-semibold">Monto:</span>{' '}
                <span
                  className={
                    cashObject.adds ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {usdFormatCurrency(cashObject.amount)}
                </span>
              </div>
              <div>
                <span className="font-semibold">Acción:</span>{' '}
                <span
                  className={
                    cashObject.adds ? 'text-green-600' : 'text-red-600'
                  }
                >
                  {cashObject.adds ? 'Suma' : 'Resta'}
                </span>
              </div>
              <div>
                <span className="font-semibold">Tipo:</span>{' '}
                {normalizeTypeLabel(cashObject.type)}
              </div>
            </div>
          </div>
        )}

        {isOrder && isLoadingOrderById && (
          <div>Cargando detalles de la orden...</div>
        )}
        {isOrder && !isLoadingOrderById && isErrorOrderById && (
          <div className="p-3 border rounded-md bg-red-50 text-red-700 text-sm">
            No se pudo cargar los detalles de la orden.
          </div>
        )}

        {isOrder && !isLoadingOrderById && orderById && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Orden</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">ID:</span>
                  <span>{orderById.id ?? cashObject?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Factura:</span>
                  <span>{orderById.invoiceNumber || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Tipo:</span>
                  <span className="capitalize">{orderById.type || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total (USD):</span>
                  <span>
                    {usdFormatCurrency(
                      Number(orderById.totalInvoiceUsd?.parsedValue || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Total (BS):</span>
                  <span>
                    {usdFormatCurrency(
                      Number(orderById.totalInvoiceBs?.parsedValue || 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Origen:</span>
                  <span>
                    {typeof orderById.originBranch === 'object'
                      ? orderById.originBranch.name
                      : orderById.originBranch}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Destino:</span>
                  <span>
                    {typeof orderById.targetBranch === 'object'
                      ? orderById.targetBranch.name
                      : orderById.targetBranch}
                  </span>
                </div>
                {orderById.createdAt && (
                  <div className="flex justify-between">
                    <span className="font-medium">Creada:</span>
                    <span>
                      {new Date(orderById.createdAt).toLocaleString()}
                    </span>
                  </div>
                )}
                {orderById.paymentMethods &&
                  orderById.paymentMethods.length > 0 && (
                    <div className="mt-3">
                      <span className="font-medium">Métodos de pago:</span>
                      <ul className="mt-1 space-y-1">
                        {orderById.paymentMethods.map((pm) => (
                          <li
                            key={pm.id}
                            className="flex justify-between text-xs"
                          >
                            <span className="capitalize">
                              {pm.type.replace('_', ' ')}
                            </span>
                            <span>
                              {((pm.currency || '')
                                .toUpperCase()
                                .includes('USD')
                                ? usdFormatCurrency
                                : formatCurrencyBolivares)(
                                Number(pm.amount || 0)
                              )}{' '}
                              {/* {pm.currency} */}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                {orderById.notes && (
                  <div className="mt-3">
                    <span className="font-medium">Notas:</span>
                    <p className="mt-1 whitespace-pre-line text-xs text-gray-700">
                      {orderById.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Cliente</h3>
              <div className="space-y-1 text-sm">
                {orderById.client && typeof orderById.client === 'object' && (
                  <>
                    <div className="flex justify-between">
                      <span className="font-medium">Nombre:</span>
                      <span>
                        {orderById.client.firstName} {orderById.client.lastName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Cédula/Pasaporte:</span>
                      <span>{orderById.client.countryId || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Teléfono:</span>
                      <span>{orderById.client.phoneNumber || '—'}</span>
                    </div>
                    {orderById.client.email && (
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{orderById.client.email}</span>
                      </div>
                    )}
                    {orderById.client.address && (
                      <div className="flex justify-between">
                        <span className="font-medium">Dirección:</span>
                        <span>{orderById.client.address}</span>
                      </div>
                    )}
                    {orderById.client.city && (
                      <div className="flex justify-between">
                        <span className="font-medium">Ciudad:</span>
                        <span>{orderById.client.city}</span>
                      </div>
                    )}
                    {orderById.client.inFavor && (
                      <div className="flex justify-between">
                        <span className="font-medium">Saldo a favor:</span>
                        <span>
                          {usdFormatCurrency(
                            Number(orderById.client.inFavor.parsedValue || 0)
                          )}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {!isOrder && isLoading && <div>Cargando detalles...</div>}

        {!isOrder &&
          !isLoading &&
          cashObject &&
          !canViewTransactionDetails(cashObject.type) && (
            <div className="p-3 border rounded-md bg-yellow-50 text-yellow-700 text-sm">
              Los detalles de órdenes están en progreso en el backend.
            </div>
          )}

        {!isOrder && !isLoading && transaction && (
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
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
