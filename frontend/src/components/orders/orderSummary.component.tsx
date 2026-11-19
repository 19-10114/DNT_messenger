'use client';

import React, { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import { Badge } from '@/components/ui/badge.component';
import { Separator } from '@/components/ui/separator.component';
import {
  ShoppingCart,
  Trash2,
  DollarSign,
  Calculator,
  AlertCircle,
} from 'lucide-react';
import {
  useSelectedBikes,
  useSelectedParts,
  useSelectedOthers,
  useOrderActions,
  usePaymentMethods,
} from '@/stores/order/order.store';
import { formatCurrency } from '@/lib/utils';

export function OrderSummary() {
  const selectedMotorcycles = useSelectedBikes();
  const selectedSpareParts = useSelectedParts();
  const selectedOthers = useSelectedOthers();
  const paymentMethods = usePaymentMethods();
  const orderActions = useOrderActions();

  // Calcular totales
  const totals = useMemo(() => {
    const motorcycleTotal = selectedMotorcycles.reduce(
      (sum, moto) => sum + (moto.price || 0),
      0
    );
    const sparePartsTotal = selectedSpareParts.reduce(
      (sum, part) => sum + (part.price || 0) * (part.quantity || 1),
      0
    );
    const othersTotal = selectedOthers.reduce(
      (sum, other) => sum + (other.price || 0) * (other.quantity || 1),
      0
    );
    const orderTotal = motorcycleTotal + sparePartsTotal + othersTotal;

    const paidAmount = paymentMethods.reduce((sum, method) => {
      return sum + (method.amount || 0);
    }, 0);

    const remainingAmount = Math.max(0, orderTotal - paidAmount);

    return {
      motorcycleTotal,
      sparePartsTotal,
      othersTotal,
      orderTotal,
      paidAmount,
      remainingAmount,
    };
  }, [selectedMotorcycles, selectedSpareParts, selectedOthers, paymentMethods]);

  const handleRemoveMotorcycle = (motorcycleId: string) => {
    orderActions.removeSelectedBike(motorcycleId);
  };

  const handleRemoveSparePart = (sparePartId: string) => {
    orderActions.removeSelectedPart(sparePartId);
  };

  const handleRemoveOther = (otherId: string) => {
    orderActions.removeSelectedOther(otherId);
  };

  const hasProducts =
    selectedMotorcycles.length > 0 ||
    selectedSpareParts.length > 0 ||
    selectedOthers.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Resumen de la Orden
        </CardTitle>
        <CardDescription>
          Productos seleccionados y totales de la venta
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasProducts ? (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay productos seleccionados</p>
            <p className="text-sm">
              Agregue motocicletas o repuestos para continuar
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lista de Motocicletas */}
            {selectedMotorcycles.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  🏍️ Motocicletas ({selectedMotorcycles.length})
                </h4>
                <div className="space-y-2">
                  {selectedMotorcycles.map((motorcycle) => (
                    <div
                      key={motorcycle.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{motorcycle.productName}</p>
                        <p className="text-sm text-gray-600">
                          Marca: {motorcycle.brand} | Placa: {motorcycle.plate}
                        </p>
                        <p className="text-sm text-gray-600">
                          Serial: {motorcycle.serialNumber} | Motor:{' '}
                          {motorcycle.motorSerial}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {formatCurrency(motorcycle.price || 0)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveMotorcycle(motorcycle.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Repuestos */}
            {selectedSpareParts.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  🔧 Repuestos ({selectedSpareParts.length})
                </h4>
                <div className="space-y-2">
                  {selectedSpareParts.map((sparePart) => (
                    <div
                      key={sparePart.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{sparePart.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {sparePart.sku}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {sparePart.quantity || 1} x{' '}
                          {formatCurrency(sparePart.price || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {formatCurrency(
                            (sparePart.price || 0) * (sparePart.quantity || 1)
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveSparePart(sparePart.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Otros Productos */}
            {selectedOthers.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  📦 Otros ({selectedOthers.length})
                </h4>
                <div className="space-y-2">
                  {selectedOthers.map((other) => (
                    <div
                      key={other.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{other.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {other.sku}
                        </p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {other.quantity || 1} x{' '}
                          {formatCurrency(other.price || 0)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary">
                          {formatCurrency(
                            (other.price || 0) * (other.quantity || 1)
                          )}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveOther(other.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Resumen de Totales */}
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Totales
              </h4>

              <div className="space-y-2 text-sm">
                {selectedMotorcycles.length > 0 && (
                  <div className="flex justify-between">
                    <span>Subtotal Motocicletas:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.motorcycleTotal)}
                    </span>
                  </div>
                )}

                {selectedSpareParts.length > 0 && (
                  <div className="flex justify-between">
                    <span>Subtotal Repuestos:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.sparePartsTotal)}
                    </span>
                  </div>
                )}

                {selectedOthers.length > 0 && (
                  <div className="flex justify-between">
                    <span>Subtotal Otros:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.othersTotal)}
                    </span>
                  </div>
                )}

                <Separator />

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total a Pagar:</span>
                  <span className="text-green-600">
                    {formatCurrency(totals.orderTotal)}
                  </span>
                </div>

                {paymentMethods.length > 0 && (
                  <>
                    <div className="flex justify-between text-blue-600">
                      <span>Monto Pagado:</span>
                      <span className="font-medium">
                        {formatCurrency(totals.paidAmount)}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Monto Restante:</span>
                      <span
                        className={`font-semibold ${
                          totals.remainingAmount > 0
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(totals.remainingAmount)}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Alertas */}
              {totals.remainingAmount > 0 && paymentMethods.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <p className="text-sm text-yellow-700">
                    Aún falta por pagar{' '}
                    <strong>{formatCurrency(totals.remainingAmount)}</strong>
                  </p>
                </div>
              )}

              {totals.remainingAmount === 0 && paymentMethods.length > 0 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <p className="text-sm text-green-700">
                    ¡Orden completamente pagada!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
