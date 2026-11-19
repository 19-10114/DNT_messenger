'use client';

import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useDebounce } from 'use-debounce';
import { Card } from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { Plus } from 'lucide-react';
import { useExchangeRate } from '@/hooks';
import { amountRoundedUp } from '@/lib/utils';

export type PartItem = {
  id: string;
  sku: string;
  name: string;
  model: string;
  price: number;
  /**
   * Lo que costó el repuesto. El flujo de órdenes no lo usa —vende al precio
   * de lista—, pero la transferencia entre sucursales se carga al costo.
   */
  cost?: number;
  quantity: number;
  available: boolean;
};

interface OrderPartsListProps {
  searchTerm: string;
  onAddPart: (part: PartItem) => void;
  branchId?: number | null;
  /**
   * Deja seleccionar repuestos sin stock, manteniendo la etiqueta "No
   * disponible". Solo para flujos que no descuentan inventario (evaluación de
   * motos usadas); en órdenes se queda en `false`.
   */
  allowUnavailable?: boolean;
  /**
   * Monto a mostrar en cada fila. Sin esto se muestra el precio de lista, que
   * es lo que cobra una orden. La venta por sucursal lo usa para mostrar el
   * costo, que es el monto que esa transacción va a cargar.
   */
  priceFor?: (part: PartItem) => number;
}

const productsService = new ProductsService();

export function OrderPartsList({
  searchTerm,
  onAddPart,
  branchId,
  allowUnavailable = false,
  priceFor,
}: OrderPartsListProps) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const effectiveBranchId = branchId ?? currentBranchId;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [debouncedSearch] = useDebounce(searchTerm, 500);
  const { rate: bcvRate, usdtRate } = useExchangeRate(token?.toString() || '');

  const partQuery = useQuery({
    queryKey: [
      'orderForm_partInventory',
      token,
      effectiveBranchId,
      page,
      pageSize,
      debouncedSearch,
    ],
    queryFn: async () => {
      return productsService.getPartInventory(
        token as string,
        effectiveBranchId!.toString(),
        {
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: debouncedSearch,
        }
      );
    },
    enabled: !!token && !!effectiveBranchId,
  });

  const partInventoryData = partQuery.data?.data || null;

  const parts = useMemo<PartItem[]>(() => {
    if (!partInventoryData?.results) return [] as PartItem[];
    return partInventoryData.results.map(
      (part: {
        id?: string | number;
        sku?: string;
        name?: string;
        model?: string;
        price?: number;
        cost?: number;
        quantity?: number;
      }) => ({
        id: part.id?.toString() || Math.random().toString(),
        sku: part.sku || '',
        name: part.name || '',
        model: part.model || '',
        price: part.price || 0,
        cost: part.cost,
        quantity: part.quantity || 0,
        available: (part.quantity ?? 0) > 0,
      })
    );
  }, [partInventoryData]);

  const totalPages = useMemo(() => {
    return partInventoryData?.totalPages || 1;
  }, [partInventoryData]);

  return (
    <div className="space-y-2">
      {partQuery.isLoading ? (
        <p>Cargando repuestos...</p>
      ) : parts.length === 0 ? (
        <p>No se encontraron repuestos</p>
      ) : (
        <>
          {parts.map((part: PartItem) => {
            const displayPrice = priceFor ? priceFor(part) : part.price;

            return (
              <Card
                key={part.id}
                // Toda la fila agrega: el `+` es solo la señal visual
                onClick={() =>
                  (part.available || allowUnavailable) && onAddPart(part)
                }
                className={`p-4 hover:bg-gray-50 ${
                  part.available || allowUnavailable
                    ? 'cursor-pointer'
                    : 'cursor-default opacity-50'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <h3 className="font-medium">{part.name}</h3>
                      <div className="flex gap-2 ">
                        {!part.available && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-red-500 rounded">
                            No disponible
                          </span>
                        )}
                        {part.available && (
                          <span className="inline-block px-2 py-1 text-xs font-semibold text-white bg-green-500 rounded">
                            {part.quantity} disponibles
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">SKU: {part.sku}</p>
                    <p className="text-sm text-gray-600">
                      Modelo: {part.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      Stock: {part.quantity}
                    </p>
                    <p className="text-sm font-medium">
                      ${displayPrice.toFixed(2)} (BCV: $
                      {amountRoundedUp((displayPrice * usdtRate) / bcvRate, 2)}{' '}
                      - {(displayPrice * usdtRate).toFixed(1)} Bs)
                    </p>
                  </div>
                  <Button
                    // El card ya agrega: sin esto el click contaría dos veces
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddPart(part);
                    }}
                    disabled={!part.available && !allowUnavailable}
                    size="sm"
                    className="w-full sm:w-auto mt-2 sm:mt-0"
                  >
                    <Plus className="h-4 w-4 sm:mr-0 mr-2" />
                    <span className="sm:hidden">Agregar</span>
                  </Button>
                </div>
              </Card>
            );
          })}

          {totalPages > 1 && (
            <PaginationComponent
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          )}
        </>
      )}
    </div>
  );
}
