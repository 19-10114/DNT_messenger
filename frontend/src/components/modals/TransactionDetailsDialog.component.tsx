import React, { useState } from 'react';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { formatDate, usdFormatCurrency } from '@/lib/utils';
import { TransactionOrderModal } from '@/components/modals/transactionOrderModal.component';
import { RevertMovementDialog } from '@/components/modals/RevertMovementDialog.component';
import { useCanRevert } from '@/hooks/useRevertMovement';

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction?: TransactionDataResult;
  /**
   * Para quien pide la ficha a demanda: el modal abre igual y muestra el
   * estado mientras llega la transacción.
   */
  isLoading?: boolean;
  isError?: boolean;
}

const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  isLoading = false,
  isError = false,
}) => {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showRevertDialog, setShowRevertDialog] = useState(false);
  const canRevert = useCanRevert();

  // Solo las transacciones SIN orden se revierten desde acá: las que
  // pertenecen a una orden se revierten desde la orden, para que sus totales y
  // métodos de pago se vayan con ella. El backend rechaza lo contrario con 409,
  // así que esto es la comodidad, no la garantía.
  const isRevertible = Boolean(
    canRevert && transaction && !transaction.orderNumber
  );

  if (!transaction && !isLoading && !isError) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Detalles de Transacción {transaction ? `#${transaction.id}` : ''}
            </DialogTitle>
          </DialogHeader>

          {!transaction ? (
            <p
              className={
                isError
                  ? 'py-8 text-center text-sm text-destructive'
                  : 'py-8 text-center text-sm text-muted-foreground'
              }
            >
              {isError
                ? 'No se pudo cargar la transacción.'
                : 'Cargando transacción...'}
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Información General
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">ID:</span>
                    <span>{transaction.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Tipo:</span>
                    <span className="capitalize">{transaction.type}</span>
                  </div>
                  {transaction.orderNumber && (
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Número de orden:</span>
                      <Button
                        variant="link"
                        className="h-auto p-0"
                        onClick={() => setShowOrderModal(true)}
                      >
                        #{transaction.orderNumber}
                      </Button>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Caso:</span>
                    <span>{transaction.case}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Monto individual:</span>
                    <span>{usdFormatCurrency(Number(transaction.amount))}</span>
                  </div>
                  {transaction.tax && (
                    <div className="flex justify-between">
                      <span className="font-medium">Impuesto:</span>
                      <span>{usdFormatCurrency(Number(transaction.tax))}</span>
                    </div>
                  )}
                  {transaction.quantity && (
                    <div className="flex justify-between">
                      <span className="font-medium">Cantidad:</span>
                      <span>{Number(transaction.quantity)}</span>
                    </div>
                  )}
                  {transaction.quantity && transaction.amount && (
                    <div className="flex justify-between">
                      <span className="font-medium">Monto Total:</span>
                      <span>
                        {usdFormatCurrency(
                          Number(transaction.quantity) *
                            Number(transaction.amount)
                        )}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Fecha de Creación:</span>
                    <span>{formatDate(transaction.createdAt)}</span>
                  </div>
                  {transaction.dateDelivered && (
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Entrega:</span>
                      <span>{formatDate(transaction.dateDelivered)}</span>
                    </div>
                  )}
                  {transaction.receptionDate && (
                    <div className="flex justify-between">
                      <span className="font-medium">Fecha de Recepción:</span>
                      <span>{formatDate(transaction.receptionDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">
                  Información del Producto
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Nombre:</span>
                    <span>{transaction.product.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SKU:</span>
                    <span>{transaction.product.sku}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Modelo:</span>
                    <span>{transaction.product.model}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Marca:</span>
                    <span>{transaction.product.brand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Categoría ID:</span>
                    <span>{transaction.product.category}</span>
                  </div>
                </div>
              </div>

              {(transaction.originBranch || transaction.targetBranch) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">
                    Información de Sucursales
                  </h3>
                  <div className="space-y-2">
                    {transaction.originBranch && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            Sucursal de Origen:
                          </span>
                          <span>{transaction.originBranch.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tipo de Origen:</span>
                          <span className="capitalize">
                            {transaction.originBranch.type}
                          </span>
                        </div>
                      </>
                    )}
                    {transaction.targetBranch && (
                      <>
                        <div className="flex justify-between">
                          <span className="font-medium">
                            Sucursal de Destino:
                          </span>
                          <span>{transaction.targetBranch.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-medium">Tipo de Destino:</span>
                          <span className="capitalize">
                            {transaction.targetBranch.type}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {(transaction.user || transaction.responsible) && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-3">
                    Información de Usuarios
                  </h3>
                  <div className="space-y-2">
                    {transaction.user && (
                      <div className="flex justify-between">
                        <span className="font-medium">Usuario:</span>
                        <span>{transaction.user.username}</span>
                      </div>
                    )}
                    {transaction.responsible && (
                      <div className="flex justify-between">
                        <span className="font-medium">Responsable:</span>
                        <span>{transaction.responsible.username}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(transaction.orderId ||
                transaction.plate ||
                transaction.color ||
                transaction.serialNumber ||
                transaction.inNumber ||
                transaction.year ||
                transaction.invoiceNumber ||
                transaction.description ||
                transaction.notes) && (
                <div className="bg-gray-50 p-4 rounded-lg col-span-1 md:col-span-2">
                  <h3 className="text-lg font-semibold mb-3">
                    Información Adicional
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {transaction.orderId && (
                      <div className="flex justify-between">
                        <span className="font-medium">
                          Número de aprobación:
                        </span>
                        <span>{transaction.orderId}</span>
                      </div>
                    )}
                    {transaction.plate && (
                      <div className="flex justify-between">
                        <span className="font-medium">Placa:</span>
                        <span>{transaction.plate}</span>
                      </div>
                    )}
                    {transaction.color && (
                      <div className="flex justify-between">
                        <span className="font-medium">Color:</span>
                        <span>{transaction.color}</span>
                      </div>
                    )}
                    {transaction.serialNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium">Número de Chasis:</span>
                        <span>{transaction.serialNumber}</span>
                      </div>
                    )}
                    {transaction.inNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium">Número de entrada:</span>
                        <span>{transaction.inNumber}</span>
                      </div>
                    )}
                    {transaction.year && (
                      <div className="flex justify-between">
                        <span className="font-medium">Año:</span>
                        <span>{transaction.year}</span>
                      </div>
                    )}
                    {transaction.invoiceNumber && (
                      <div className="flex justify-between">
                        <span className="font-medium">Número de Factura:</span>
                        <span>{transaction.invoiceNumber}</span>
                      </div>
                    )}
                    {transaction.description && (
                      <div className="flex justify-between col-span-1 md:col-span-2">
                        <span className="font-medium">Descripción:</span>
                        <span>{transaction.description}</span>
                      </div>
                    )}
                    {transaction.notes && (
                      <div className="flex justify-between col-span-1 md:col-span-2">
                        <span className="font-medium">Observaciones:</span>
                        <span>{transaction.notes}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-6 sm:justify-between">
            {isRevertible ? (
              <Button
                variant="destructive"
                onClick={() => setShowRevertDialog(true)}
              >
                Revertir movimiento
              </Button>
            ) : (
              <span />
            )}
            <Button onClick={onClose}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {transaction?.orderNumber && (
        <TransactionOrderModal
          orderId={transaction.orderNumber}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}

      {isRevertible && transaction && (
        <RevertMovementDialog
          open={showRevertDialog}
          onOpenChange={setShowRevertDialog}
          target="transaction"
          id={transaction.id}
          summary={
            <p className="text-sm">
              {transaction.product?.name}
              {transaction.plate ? ` — placa ${transaction.plate}` : ''}
              {transaction.originBranch && transaction.targetBranch
                ? `: vuelve de ${transaction.targetBranch.name} a ${transaction.originBranch.name}.`
                : '.'}
            </p>
          }
          // La fila desaparece de todas las listas al revertirse
          // (`Transaction.objects` está filtrado), así que la ficha abierta ya
          // no describe nada.
          onReverted={onClose}
        />
      )}
    </>
  );
};

export default TransactionDetailsDialog;
