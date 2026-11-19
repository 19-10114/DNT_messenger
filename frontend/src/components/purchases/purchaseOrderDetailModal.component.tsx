'use client';

import { Badge } from '@/components/ui/badge.component';
import { Separator } from '@/components/ui/separator.component';
import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  PurchaseOrder,
  PurchaseOrderCategory,
  PurchaseOrderStatus,
} from '@/services/purchases/types/PurchaseOrder.type';

export const CATEGORY_LABELS: Record<PurchaseOrderCategory, string> = {
  bikes: 'Motos',
  parts: 'Repuestos',
};

export const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: 'Borrador',
  pending_approval: 'Pendiente',
  approved: 'Aprobada',
  rejected: 'Rechazada',
};

export const STATUS_BADGE_CLASSES: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-300',
  pending_approval: 'bg-amber-100 text-amber-800 border-amber-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
};

// `approved` y `rejected` son estados terminales: una decisión ya tomada
// sobre una preorden es un registro histórico, no algo para reescribir en
// silencio. Una rechazada no se reenvía -- quien la creó arma una nueva.
// Mismo criterio que el backend (`PurchaseOrderView.patch`).
const EDITABLE_STATUSES: PurchaseOrderStatus[] = ['draft', 'pending_approval'];

export function purchaseOrderTotal(order: PurchaseOrder) {
  return order.lines.reduce((sum, line) => sum + line.quantity * line.cost, 0);
}

/** Mismo cálculo que el carrito de Repuestos (purchasePartsCart): el
 * catálogo no incluye impuesto, cada línea trae su propia tasa. Solo aplica
 * a repuestos -- motos no lleva desglose. */
export function purchaseOrderTaxBreakdown(order: PurchaseOrder) {
  const subtotal = purchaseOrderTotal(order);
  const iva = order.lines.reduce(
    (sum, line) =>
      sum + line.quantity * line.cost * ((line.product.tax?.iva ?? 0) / 100),
    0
  );
  const igtf = order.lines.reduce(
    (sum, line) =>
      sum + line.quantity * line.cost * ((line.product.tax?.igtf ?? 0) / 100),
    0
  );
  return { subtotal, iva, igtf, total: subtotal + iva + igtf };
}

/** Total "de bolsillo" de la preorden -- con impuestos incluidos cuando
 * aplica (repuestos), igual que muestra el carrito al armarla. */
export function purchaseOrderGrandTotal(order: PurchaseOrder) {
  return order.category === 'parts'
    ? purchaseOrderTaxBreakdown(order).total
    : purchaseOrderTotal(order);
}

interface PurchaseOrderDetailModalProps {
  purchaseOrder: PurchaseOrder | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Acciones opcionales. Se omiten (ficha de solo lectura) cuando no se
   * pasan -- p.ej. al abrir esta misma ficha desde el detalle de una
   * transacción, donde no corresponde editar/aprobar/rechazar. El llamador
   * ya filtra por rol y por estado antes de pasarlas; este componente solo
   * decide si mostrar cada botón según el estado de la orden.
   */
  onEdit?: (order: PurchaseOrder) => void;
  onApprove?: (order: PurchaseOrder) => void;
  onReject?: (order: PurchaseOrder) => void;
  isApproving?: boolean;
}

/**
 * Ficha de una preorden de compra: detalle por línea + desglose de
 * impuestos (repuestos) + estado, y opcionalmente Editar/Aprobar/Rechazar en
 * el pie. Compartida entre el listado "Preórdenes de Compra" y el detalle de
 * una transacción que se originó a partir de una (ver
 * `TransactionOrderModal`).
 */
export function PurchaseOrderDetailModal({
  purchaseOrder,
  open,
  onOpenChange,
  onEdit,
  onApprove,
  onReject,
  isApproving = false,
}: PurchaseOrderDetailModalProps) {
  const hasActions = !!(onEdit || onApprove || onReject);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="600px">
        {/* DialogTitle siempre presente (aunque sea sin datos todavía) --
         * Radix exige uno por accesibilidad; guardar solo el contenido de
         * abajo, como ya hace OrderDetailsModal para el mismo caso. */}
        <DialogHeader>
          <DialogTitle>
            Preorden de Compra {purchaseOrder ? `#${purchaseOrder.id}` : ''}
          </DialogTitle>
          {purchaseOrder && (
            <DialogDescription>
              {CATEGORY_LABELS[purchaseOrder.category]} · Recibe:{' '}
              {purchaseOrder.targetBranch?.name} · Creada por{' '}
              {purchaseOrder.createdBy?.username} el{' '}
              {formatDate(purchaseOrder.createdAt)}
            </DialogDescription>
          )}
        </DialogHeader>

        {!purchaseOrder ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Cargando preorden...
          </p>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={STATUS_BADGE_CLASSES[purchaseOrder.status]}
              >
                {STATUS_LABELS[purchaseOrder.status]}
              </Badge>
              {purchaseOrder.status === 'approved' && (
                <span className="text-sm text-muted-foreground">
                  Aprobada por {purchaseOrder.approvedBy?.username} el{' '}
                  {formatDate(purchaseOrder.approvedAt || '')} -- Orden #
                  {purchaseOrder.resultingOrder}
                </span>
              )}
              {purchaseOrder.status === 'rejected' && (
                <span className="text-sm text-red-700">
                  Motivo: {purchaseOrder.rejectionReason}
                </span>
              )}
            </div>

            {purchaseOrder.notes && (
              <p className="text-sm text-gray-700">
                <span className="font-medium">Observación:</span>{' '}
                {purchaseOrder.notes}
              </p>
            )}

            <Separator />

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {purchaseOrder.lines.map((line) => (
                <div
                  key={line.id}
                  className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{line.product.name}</p>
                    <p className="text-sm text-gray-600">
                      SKU: {line.product.sku}
                    </p>
                    {purchaseOrder.category === 'bikes' && (
                      <>
                        <p className="text-sm text-gray-600">
                          Placa: {line.plate} · Color: {line.color} · Año:{' '}
                          {line.year}
                        </p>
                        <p className="text-sm text-gray-600">
                          Chasis:{' '}
                          <span className="font-mono">
                            {line.chassisSerial}
                          </span>{' '}
                          · Motor:{' '}
                          <span className="font-mono">{line.motorSerial}</span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Aprobación Empire:{' '}
                          <span className="font-mono font-medium">
                            {line.approvalNumber || 'sin número'}
                          </span>
                        </p>
                        {(line.invoiceNumber || line.inNumber) && (
                          <p className="text-sm text-gray-600">
                            {line.invoiceNumber &&
                              `Nº de factura: ${line.invoiceNumber}`}
                            {line.invoiceNumber && line.inNumber && ' · '}
                            {line.inNumber && `Nº de entrada: ${line.inNumber}`}
                          </p>
                        )}
                        {line.notes && (
                          <p className="text-sm text-gray-600">
                            Notas: {line.notes}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm text-gray-600">
                      Cantidad: {line.quantity} x {formatCurrency(line.cost)}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {formatCurrency(line.quantity * line.cost)}
                  </Badge>
                </div>
              ))}
            </div>

            <Separator />

            {purchaseOrder.category === 'parts' ? (
              (() => {
                const totals = purchaseOrderTaxBreakdown(purchaseOrder);
                return (
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal (sin impuestos):</span>
                      <span className="font-medium">
                        {formatCurrency(totals.subtotal)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>IVA:</span>
                      <span className="font-medium">
                        {formatCurrency(totals.iva)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>IGTF:</span>
                      <span className="font-medium">
                        {formatCurrency(totals.igtf)}
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total</span>
                      <span className="text-green-600">
                        {formatCurrency(totals.total)}
                      </span>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex justify-between text-lg font-semibold">
                <span>Total</span>
                <span className="text-green-600">
                  {formatCurrency(purchaseOrderTotal(purchaseOrder))}
                </span>
              </div>
            )}

            <ActivityTimeline
              targetModel="purchase_order"
              targetId={purchaseOrder.id}
              variant="collapsible"
            />

            {hasActions && (
              <DialogFooter className="gap-2">
                {onEdit && EDITABLE_STATUSES.includes(purchaseOrder.status) && (
                  <Button
                    variant="outline"
                    onClick={() => onEdit(purchaseOrder)}
                  >
                    Editar
                  </Button>
                )}
                {onReject && purchaseOrder.status === 'pending_approval' && (
                  <Button
                    variant="destructive"
                    onClick={() => onReject(purchaseOrder)}
                  >
                    Rechazar
                  </Button>
                )}
                {onApprove && purchaseOrder.status === 'pending_approval' && (
                  <Button
                    disabled={isApproving}
                    onClick={() => onApprove(purchaseOrder)}
                  >
                    Aprobar
                  </Button>
                )}
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
