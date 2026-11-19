'use client';

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.component';
import { useGlobalPartInventory } from '@/hooks/useGlobalPartInventory';
import { useExchangeRate } from '@/hooks';
import { useToken } from '@/stores/auth/auth.store';
import { amountRoundedUp } from '@/lib/utils';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { Package2, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface PartInventoryBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: string;
  productName: string;
  productModel: string;
  price: number;
  /** Sin definir = ocultar el costo (rol sin acceso a esa columna en la tabla). */
  cost?: number;
}

export function PartInventoryBranchModal({
  isOpen,
  onClose,
  sku,
  productName,
  productModel,
  price,
  cost,
}: PartInventoryBranchModalProps) {
  const token = useToken();
  // Misma cuenta que la búsqueda de productos de Ventas (OrderPartsList): el
  // precio catálogo convertido a Bs con la tasa interna (usdtRate), y ese
  // monto en Bs vuelto a USD con la tasa BCV oficial -- la diferencia entre
  // ambas tasas es lo que separa "precio catálogo" de "precio BCV".
  const { rate: bcvRate, usdtRate } = useExchangeRate(token?.toString() || '');
  const bcvPrice =
    bcvRate > 0 ? amountRoundedUp((price * usdtRate) / bcvRate, 2) : null;
  const bsPrice = price * usdtRate;

  const globalPartInventory = useGlobalPartInventory({
    page: '1',
    pageSize: '10',
    search: sku,
  });

  useEffect(() => {
    if (isOpen && sku) {
      globalPartInventory.setSearch(sku);
    }
  }, [sku, isOpen]);

  const results = globalPartInventory.data?.results ?? [];
  const product = results[0];
  const branches = product?.branches ?? [];
  const totalQuantity = branches.reduce((sum, b) => sum + b.quantity, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent width="480px" maxHeight="85vh">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <Package2 className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-gray-900">
                {productName}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500 mt-0.5">
                SKU: <span className="font-medium text-gray-700">{sku}</span>
                <br />
                Modelo:{' '}
                <span className="font-medium text-gray-700">
                  {productModel}
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="mt-2">
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
              Precio
            </p>
            <div
              className={
                cost !== undefined
                  ? 'grid grid-cols-2 gap-3'
                  : 'grid grid-cols-1 gap-3'
              }
            >
              <KpiCardMain
                label="Precio de venta"
                value={`$${price.toFixed(2)}`}
                subtitle={
                  bcvPrice !== null
                    ? `BCV: $${bcvPrice} - ${bsPrice.toFixed(1)} Bs`
                    : undefined
                }
                tone="green"
              />
              {cost !== undefined && (
                <KpiCardMain
                  label="Costo"
                  value={`$${cost.toFixed(2)}`}
                  tone="red"
                />
              )}
            </div>
          </div>

          {globalPartInventory.isLoading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="text-sm text-gray-500">
                Cargando disponibilidad...
              </p>
            </div>
          )}

          {globalPartInventory.isError && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm text-gray-500">
                Error al cargar los datos. Intenta de nuevo.
              </p>
            </div>
          )}

          {!globalPartInventory.isLoading && !globalPartInventory.isError && (
            <>
              {branches.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <MapPin className="h-8 w-8 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No hay stock registrado en ninguna sucursal.
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
                    Disponibilidad por sucursal
                  </p>

                  <div className="space-y-2">
                    {branches.map((branch) => (
                      <div
                        key={branch.branchId}
                        className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-4 py-3"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-700">
                            {branch.branchName}
                          </span>
                        </div>
                        <span className="text-sm font-bold text-gray-700">
                          {branch.quantity.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-lg bg-green-50 border border-green-100 px-4 py-3">
                    <span className="text-sm font-medium text-green-700">
                      Total en todas las sucursales
                    </span>
                    <span className="text-base font-bold text-green-700">
                      {totalQuantity.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
