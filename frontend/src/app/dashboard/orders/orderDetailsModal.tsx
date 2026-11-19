'use client';
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.component';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card.component';
import {
  OrderData,
  OrderPaymentMethodDetail,
} from '@/services/orders/types/Order.type';
import {
  formatDate,
  formatCurrencyBolivares,
  usdFormatCurrency,
  getParsedAmount,
} from '@/lib/utils';
import TransactionsTable from './transactionsTable.component';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';
import InvoiceGenerationModal from './InvoiceGenerationModal.component';
import CertificateOriginModal from './CertificateOriginModal.component';
import { useUser } from '@/stores/auth/auth.store';
import { useOrderTransactions } from '@/hooks/useOrders';
import { RevertMovementDialog } from '@/components/modals/RevertMovementDialog.component';
import { useCanRevert } from '@/hooks/useRevertMovement';

type Props = {
  order: OrderData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hidePaymentInfo?: boolean;
};

function renderPaymentDetail(pm: OrderPaymentMethodDetail) {
  const typeLabels: Record<OrderPaymentMethodDetail['type'], string> = {
    pago_movil: 'Pago móvil',
    punto_de_venta: 'Punto de Venta',
    efectivo_usd: 'Efectivo USD',
    efectivo_bs: 'Efectivo Bs',
    zelle: 'Zelle',
    binance: 'Binance',
    transferencia: 'Transferencia',
    abono: 'Abono',
  };

  return (
    <Card key={pm.id} className="mb-3">
      <CardHeader>
        <CardTitle className="text-base">
          {typeLabels[pm.type]}{' '}
          {pm.amountBs
            ? `– ${formatCurrencyBolivares(pm.amountBs)}`
            : pm.amountUsd
              ? `– ${usdFormatCurrency(pm.amountUsd)}`
              : pm.amount
                ? pm.currency === 'Bs'
                  ? `– ${formatCurrencyBolivares(pm.amount)}`
                  : `– ${pm.amount} ${pm.currency ?? ''}`
                : ''}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        {pm.originBank && (
          <div>
            <span className="font-medium">Banco origen:</span> {pm.originBank}
          </div>
        )}
        {pm.targetBank && (
          <div>
            <span className="font-medium">Banco destino:</span> {pm.targetBank}
          </div>
        )}
        {pm.phoneNumber && (
          <div>
            <span className="font-medium">Teléfono:</span> {pm.phoneNumber}
          </div>
        )}
        {pm.originAccount && (
          <div>
            <span className="font-medium">Cuenta origen:</span>{' '}
            {pm.originAccount}
          </div>
        )}
        {pm.targetAccount && (
          <div>
            <span className="font-medium">Cuenta destino:</span>{' '}
            {pm.targetAccount}
          </div>
        )}
        {pm.confirmationId && (
          <div>
            <span className="font-medium">Id confirmación:</span>{' '}
            {pm.confirmationId}
          </div>
        )}
        {pm.reference && (
          <div>
            <span className="font-medium">Referencia:</span> {pm.reference}
          </div>
        )}
        {pm.beneficiary && (
          <div>
            <span className="font-medium">Beneficiario:</span> {pm.beneficiary}
          </div>
        )}
        {pm.amountUsd && (
          <div>
            <span className="font-medium">Monto USD:</span> {pm.amountUsd}
          </div>
        )}
        {pm.notes && (
          <div className="col-span-2">
            <span className="font-medium">Notas:</span> {pm.notes}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function OrderDetailsModal({
  order,
  open,
  onOpenChange,
  hidePaymentInfo = false,
}: Props) {
  const [showInvoiceModal, setShowInvoiceModal] = React.useState(false);
  const [showCertOriginModal, setShowCertOriginModal] = React.useState(false);
  const [showRevertDialog, setShowRevertDialog] = React.useState(false);
  const user = useUser();
  const canRevert = useCanRevert();
  // Una orden ya revertida no se revierte de nuevo -- el backend contesta 409,
  // y ofrecer el botón igual sería prometer algo que no va a pasar.
  const isRevertible = Boolean(
    canRevert && order && order.status !== 'canceled'
  );

  const {
    data: transactions = [],
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
  } = useOrderTransactions(order?.id ?? 0);

  const getParsedNumber = (
    val?: number | { source?: string; parsedValue?: number }
  ): number | undefined => {
    if (val == null) return undefined;
    if (typeof val === 'object') {
      return (val as any).parsedValue as number;
    }
    return val as number;
  };

  const typeLabels: Record<NonNullable<OrderData['type']>, string> = {
    sale: 'Venta',
    purchase: 'Compra',
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent width="max-w-3xl" maxHeight="80vh">
          <DialogHeader>
            <div className="flex justify-between items-center pr-8">
              <div>
                <DialogTitle>
                  Detalles de la orden #{order?.id ?? ''}
                </DialogTitle>
                <DialogDescription>
                  Creada el{' '}
                  {order?.createdAt ? formatDate(order.createdAt) : ''}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                {order && order.billed === true && (
                  <>
                    {transactions[0]?.product?.category === 1 && (
                      <button
                        className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium"
                        onClick={() => setShowCertOriginModal(true)}
                      >
                        Certificado de Origen
                      </button>
                    )}
                    <button
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                      onClick={() => setShowInvoiceModal(true)}
                    >
                      Generar Factura
                    </button>
                  </>
                )}
                {isRevertible && (
                  <button
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90 px-4 py-2 rounded-md text-sm font-medium"
                    onClick={() => setShowRevertDialog(true)}
                  >
                    Revertir orden
                  </button>
                )}
              </div>
            </div>
          </DialogHeader>

          {!order ? (
            <div className="py-4">No hay datos de la orden.</div>
          ) : (
            <div className="space-y-6">
              {/* Detalles de la orden */}
              <section>
                <h3 className="text-lg font-semibold mb-2">Detalles</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {order?.seller && (
                    <div>
                      <span className="font-medium">Vendedor:</span>{' '}
                      {order.seller.firstName} {order.seller.lastName}
                    </div>
                  )}
                  {order?.invoiceNumber && (
                    <div>
                      <span className="font-medium">Factura:</span>{' '}
                      {order.invoiceNumber}
                    </div>
                  )}
                  {order?.type && (
                    <div>
                      <span className="font-medium">Tipo:</span>{' '}
                      {typeLabels[order.type]}
                    </div>
                  )}
                  {order?.originBranch != null && (
                    <div>
                      <span className="font-medium">Sucursal origen:</span>{' '}
                      {typeof order.originBranch === 'object'
                        ? order.originBranch.name
                        : order.originBranch}
                    </div>
                  )}
                  {order?.targetBranch != null && (
                    <div>
                      <span className="font-medium">Sucursal destino:</span>{' '}
                      {typeof order.targetBranch === 'object'
                        ? order.targetBranch.name
                        : order.targetBranch}
                    </div>
                  )}
                  {order?.billed === false && (
                    <div className="col-span-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
                        📋 Pre Orden
                        {order.deliveryNoteNumber
                          ? ` — #${order.deliveryNoteNumber}`
                          : ''}
                      </span>
                    </div>
                  )}
                </div>
              </section>
              {/* Información básica del cliente */}
              {!hidePaymentInfo && (
                <section>
                  <h3 className="text-lg font-semibold mb-2">Cliente</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium">Nombre:</span>{' '}
                      {order?.client
                        ? `${order.client.firstName} ${order.client.lastName}`
                        : 'CLIENTE NO ENCONTRADO'}
                    </div>
                    {order?.client?.phoneNumber && (
                      <div>
                        <span className="font-medium">Teléfono:</span>{' '}
                        {order.client.phoneNumber}
                      </div>
                    )}
                    {order?.client?.countryId && (
                      <div>
                        <span className="font-medium">CI/RIF:</span>{' '}
                        {order.client.countryId}
                      </div>
                    )}
                    {order?.client?.city && (
                      <div>
                        <span className="font-medium">Ciudad:</span>{' '}
                        {order.client.city}
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Métodos de pago */}
              {!hidePaymentInfo && (
                <section>
                  <h3 className="text-lg font-semibold mb-2">
                    Métodos de pago
                  </h3>
                  {order.paymentMethods?.length ? (
                    <div>{order.paymentMethods.map(renderPaymentDetail)}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      No hay métodos de pago registrados.
                    </div>
                  )}
                </section>
              )}

              {/* Total facturado */}
              <section>
                <h3 className="text-lg font-semibold mb-2">Total facturado</h3>
                <div className="text-sm">
                  <span className="font-medium">Bs:</span>{' '}
                  {formatCurrencyBolivares(
                    getParsedAmount(order.totalInvoiceBs)
                  )}
                  {getParsedNumber(order.totalInvoiceUsd) != null && (
                    <span className="ml-4">
                      <span className="font-medium">USD:</span>{' '}
                      {usdFormatCurrency(
                        getParsedNumber(order.totalInvoiceUsd) as number
                      )}
                    </span>
                  )}
                </div>
              </section>

              {/* Totales */}
              <section>
                <h3 className="text-lg font-semibold mb-2">Totales</h3>
                <div className="text-sm">
                  {getParsedNumber(order.totalUsd) != null && (
                    <span className="mr-4">
                      <span className="font-medium">Total USD:</span>{' '}
                      {usdFormatCurrency(
                        getParsedNumber(order.totalUsd) as number
                      )}
                    </span>
                  )}
                  {getParsedNumber(order.totalBs) != null && (
                    <span>
                      <span className="font-medium">Total Bs:</span>{' '}
                      {formatCurrencyBolivares(
                        getParsedNumber(order.totalBs) as number
                      )}
                    </span>
                  )}
                </div>
              </section>

              {/* Notas */}
              {order?.notes ? (
                <section>
                  <h3 className="text-lg font-semibold mb-2">Notas</h3>
                  <div className="text-sm">
                    <ul className="list-disc pl-5 space-y-1">
                      {(Array.isArray(order.notes)
                        ? order.notes
                        : (order.notes as string).split('\n')
                      ).map((line, idx) => (
                        <li key={`note-line-${idx}`}>{line}</li>
                      ))}
                    </ul>
                  </div>
                </section>
              ) : null}

              {/* Tabla de transacciones (placeholder) */}
              <section>
                <h3 className="text-lg font-semibold mb-2">Transacciones</h3>
                <div className="text-sm">
                  <TransactionsTable
                    transactions={transactions}
                    isLoading={isLoadingTransactions}
                    isError={isErrorTransactions}
                  />
                </div>
              </section>

              {order && (
                <ActivityTimeline
                  targetModel="order"
                  targetId={order.id}
                  variant="collapsible"
                />
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <InvoiceGenerationModal
        order={order}
        open={showInvoiceModal}
        onOpenChange={setShowInvoiceModal}
      />
      <CertificateOriginModal
        order={order}
        open={showCertOriginModal}
        onOpenChange={setShowCertOriginModal}
      />
      {isRevertible && order && (
        <RevertMovementDialog
          open={showRevertDialog}
          onOpenChange={setShowRevertDialog}
          target="order"
          id={order.id}
          summary={
            <p className="text-sm">
              Se anulan {transactions.length} línea(s) de la orden
              {order.client
                ? ` de ${order.client.firstName} ${order.client.lastName}`
                : ''}
              . Si el cliente tenía saldo a favor por esta orden, se recalcula.
            </p>
          }
          onReverted={() => onOpenChange(false)}
        />
      )}
    </>
  );
}
