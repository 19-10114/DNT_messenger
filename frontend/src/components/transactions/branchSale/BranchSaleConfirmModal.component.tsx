'use client';

import React from 'react';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { BranchSaleBike, BranchSalePart } from './branchSale.model';

interface BranchSaleConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sucursal que recibe la venta, ya resuelta a nombre */
  targetBranchName: string;
  /** Una de las dos viene vacía: la transacción es de motos o de repuestos */
  bikes: BranchSaleBike[];
  parts: BranchSalePart[];
  invoiceNumber: string;
  onInvoiceNumberChange: (value: string) => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

/** Fila de dato del resumen: etiqueta a la izquierda, valor a la derecha */
function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-right">{value || '-'}</span>
    </div>
  );
}

export function BranchSaleConfirmModal({
  open,
  onOpenChange,
  targetBranchName,
  bikes,
  parts,
  invoiceNumber,
  onInvoiceNumberChange,
  onConfirm,
  isSubmitting,
}: BranchSaleConfirmModalProps) {
  const totalBikes = bikes.reduce(
    (sum, bike) => sum + (parseFloat(bike.amount) || 0),
    0
  );
  const totalParts = parts.reduce(
    (sum, part) => sum + part.price * part.quantity,
    0
  );
  const total = bikes.length > 0 ? totalBikes : totalParts;

  /** Una transacción por producto: es lo que se va a enviar */
  const transactionCount = bikes.length > 0 ? bikes.length : parts.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar transacción</DialogTitle>
          <DialogDescription>
            Revise el resumen y complete el número de factura para cargar la
            venta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <SummaryRow label="Sucursal de destino" value={targetBranchName} />
          <SummaryRow
            label="Transacciones a cargar"
            value={transactionCount.toString()}
          />

          {bikes.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Motos ({bikes.length})</h4>
              <div className="border rounded-md p-3 max-h-72 overflow-auto space-y-3">
                {bikes.map((bike) => (
                  <div
                    key={bike.rowKey}
                    className="pb-3 border-b last:border-0 last:pb-0 space-y-2"
                  >
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="font-medium">
                        {`${bike.productName} · ${bike.brand} ${bike.model}`.trim()}
                      </span>
                      <span>${(parseFloat(bike.amount) || 0).toFixed(2)}</span>
                    </div>
                    <SummaryRow label="Placa" value={bike.plate} />
                    <SummaryRow
                      label="Número de aprobación"
                      value={bike.orderId}
                    />
                    <SummaryRow
                      label="Fecha de recepción"
                      value={bike.receptionDate.toLocaleDateString('es-VE')}
                    />
                    <SummaryRow label="Color" value={bike.color} />
                    <SummaryRow
                      label="Serial del chasis"
                      value={bike.serialNumber}
                    />
                    <SummaryRow
                      label="Serial del motor"
                      value={bike.motorSerial}
                    />
                    <SummaryRow
                      label="Número de entrada"
                      value={bike.inNumber}
                    />
                    <SummaryRow label="Año" value={bike.year} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {parts.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                Repuestos ({parts.length})
              </h4>
              <div className="border rounded-md p-3 max-h-60 overflow-auto">
                {parts.map((part) => (
                  <div
                    key={part.productId}
                    className="mb-2 pb-2 border-b last:border-0 last:mb-0 last:pb-0"
                  >
                    <div className="flex justify-between gap-4 text-sm">
                      <span className="font-medium">{part.name}</span>
                      <span>${(part.price * part.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between gap-4 text-xs text-gray-600">
                      <span>SKU: {part.sku || '-'}</span>
                      <span>
                        {part.quantity} × ${part.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-2 border-t flex justify-between font-medium">
            <span>Monto total:</span>
            <span>${total.toFixed(2)}</span>
          </div>

          <div className="space-y-2 pt-2">
            <Label htmlFor="branch-sale-invoice-number">
              Número de factura
            </Label>
            <Input
              id="branch-sale-invoice-number"
              type="text"
              value={invoiceNumber}
              onChange={(e) => onInvoiceNumberChange(e.target.value)}
              placeholder="Ej: 111651322"
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isSubmitting}>
            {isSubmitting ? 'Cargando...' : 'Cargar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
