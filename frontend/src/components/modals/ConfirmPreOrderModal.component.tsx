'use client';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  useSelectedBikes,
  useSelectedParts,
  useSelectedOthers,
  useOrderDetails,
} from '@/stores/order/order.store';

interface ConfirmPreOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryNoteNumber: string;
  onDeliveryNoteNumberChange: (value: string) => void;
  onConfirm: () => void;
  isCreatingOrder: boolean;
}

export function ConfirmPreOrderModal({
  open,
  onOpenChange,
  deliveryNoteNumber,
  onDeliveryNoteNumberChange,
  onConfirm,
  isCreatingOrder,
}: ConfirmPreOrderModalProps) {
  // Obtener datos del store
  const selectedBikes = useSelectedBikes();
  const selectedParts = useSelectedParts();
  const selectedOthers = useSelectedOthers();
  const orderDetails = useOrderDetails();

  // Calcular totales
  const totalBikes = selectedBikes.reduce(
    (sum, bike) => sum + bike.price * bike.quantity,
    0
  );
  const totalParts = selectedParts.reduce(
    (sum, part) => sum + part.price * part.quantity,
    0
  );
  const totalOthers = selectedOthers.reduce(
    (sum, other) => sum + other.price * other.quantity,
    0
  );
  const grandTotal = totalBikes + totalParts + totalOthers;
  const grandTotalQuantity =
    selectedBikes.reduce((sum, bike) => sum + bike.quantity, 0) +
    selectedParts.reduce((sum, part) => sum + part.quantity, 0) +
    selectedOthers.reduce((sum, other) => sum + other.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Confirmar Pre Orden</DialogTitle>
          <DialogDescription>
            Verifique los datos y complete el número de pre orden para
            continuar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Información de la orden */}
          <div className="space-y-3">
            {/* Vendedor */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm w-24">Vendedor:</span>
              <span className="text-sm">
                {orderDetails?.sellerName || 'No asignado'}
              </span>
            </div>

            {/* Cliente */}
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm w-24">Cliente:</span>
              <span className="text-sm">
                {orderDetails?.client_name || 'No seleccionado'}
              </span>
            </div>
          </div>

          {/* Lista de productos */}
          {(selectedBikes.length > 0 ||
            selectedParts.length > 0 ||
            selectedOthers.length > 0) && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Productos:</h4>
              <div className="border rounded-md p-3 max-h-60 overflow-auto">
                {/* Motos */}
                {selectedBikes.map((bike) => (
                  <div
                    key={bike.id}
                    className="mb-2 pb-2 border-b last:border-0"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Moto:</span>
                      <span>{bike.productName}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Placa: {bike.plate}</span>
                      <span>${bike.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Repuestos */}
                {selectedParts.map((part) => (
                  <div
                    key={part.id}
                    className="mb-2 pb-2 border-b last:border-0"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Repuesto:</span>
                      <span>{part.name}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Cantidad: {part.quantity}</span>
                      <span>${(part.price * part.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                {/* Otros */}
                {selectedOthers.map((other) => (
                  <div
                    key={other.id}
                    className="mb-2 pb-2 border-b last:border-0"
                  >
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Otro:</span>
                      <span>{other.name}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Cantidad: {other.quantity}</span>
                      <span>${(other.price * other.quantity).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total */}
          <div className="pt-2 border-t">
            <div className="flex justify-between font-medium">
              <span>Monto Total:</span>
              <span>${grandTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Cantidad Total:</span>
              <span>{grandTotalQuantity}</span>
            </div>
          </div>

          {/* Input para número de pre orden */}
          <div className="space-y-2 pt-2">
            <Label htmlFor="preorder-number" className="text-sm font-medium">
              Número de pre orden
            </Label>
            <Input
              id="preorder-number"
              type="text"
              value={deliveryNoteNumber}
              onChange={(e) => onDeliveryNoteNumberChange(e.target.value)}
              placeholder="Ej: NE-001"
              className="w-full"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Si no se proporciona un número de pre orden, se generará uno
              automáticamente.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onConfirm} disabled={isCreatingOrder}>
            {isCreatingOrder ? 'Creando...' : 'Confirmar Pre Orden'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
