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
import { getParsedAmount } from '@/lib/utils';
import { Plus } from 'lucide-react';

export type BikeItem = {
  /**
   * Id del **producto**, no de la unidad: viaja al backend como `product` en
   * el payload de la orden, así que se repite entre motos del mismo modelo.
   * Por eso nunca sirve como key de React — para eso está `rowKey`.
   */
  id: string;
  /** Identifica la fila de forma única dentro del listado */
  rowKey: string;
  plate: string;
  color: string;
  /** Color del cuadrito, ya resuelto: el backend lo manda como `hexCode` */
  hexCode: string;
  serialNumber: string;
  inNumber?: string;
  motorSerial?: string;
  productName: string;
  brand: string;
  model: string;
  available: boolean;
  quantity: number;
  price: number;
  /** Lo que costó la unidad al entrar; con `price` sale el margen */
  amount: number;
  used?: boolean;
  /**
   * Los campos de acá abajo solo existen en la fila por unidad y los usa la
   * venta por sucursal para precargar su formulario; el flujo de órdenes los
   * ignora, por eso son opcionales.
   */
  year?: string;
  /** Número de aprobación con el que entró la unidad */
  orderId?: string;
  receptionDate?: string;
  /**
   * Costo de la lista de precios del producto (`prices.cost`). No confundir
   * con `amount`, que es lo que costó **esa unidad** al entrar al inventario.
   */
  cost?: number;
  /** Listas de precio propias de DalePlay / El Panita */
  dpPrice?: number;
  epPrice?: number;
  /** IMEI del GPS instalado; `null` o vacío si la unidad no tiene GPS */
  gpsImei?: string | null;
};

/**
 * Descuento que se le concede al margen según en qué tramo caiga, ambos en
 * porcentaje. Los tramos abren en su límite inferior y cierran antes del
 * siguiente, así que un margen de 15 exacto ya descuenta 15.
 *
 * Se recorre de mayor a menor y el primer tramo que entra gana, de modo que
 * cualquier margen de 20 para arriba se queda en 20: la tabla no sigue más
 * allá y ese es el descuento máximo.
 */
const MARGIN_DISCOUNT_BRACKETS = [
  { from: 20, discount: 20 },
  { from: 15, discount: 15 },
  { from: 10, discount: 10 },
  { from: 0, discount: 0 },
];

function discountForMargin(margin: number): number {
  const bracket = MARGIN_DISCOUNT_BRACKETS.find(
    (entry) => margin >= entry.from
  );
  return bracket?.discount ?? 0;
}

/**
 * Piso al que se puede negociar la unidad: se le recorta al margen el
 * descuento de su tramo y se rehace el precio con lo que queda.
 *
 * Devuelve `null` cuando no hay margen que recortar —sin costo, sin precio, o
 * vendiendo a pérdida—: ahí solo se muestra el precio de lista.
 */
function minSalePrice(amount: number, price: number): number | null {
  if (amount <= 0 || price <= 0) return null;

  const profitMargin = 100 * (1 - amount / price);
  if (profitMargin <= 0) return null;

  const minProfitMargin =
    profitMargin * (1 - discountForMargin(profitMargin) / 100);

  return amount / (1 - minProfitMargin / 100);
}

/**
 * Del piso negociable al precio de lista. El rango es cosa de **motos
 * usadas**: en las nuevas el precio no se negocia contra el margen, así que
 * se muestra el precio y ya. Tampoco hay rango si no salió un piso.
 *
 * Va por `used` de cada fila y no por el filtro `onlyUsed`: con el filtro
 * apagado el listado igual trae usadas, y esas también deben mostrar el rango.
 */
function priceRange({ amount, price, used }: BikeItem): string {
  const minPrice = used ? minSalePrice(amount, price) : null;

  return minPrice === null
    ? `$${price.toFixed(2)}`
    : `$${minPrice.toFixed(2)} - $${price.toFixed(2)}`;
}

interface OrderBikesListProps {
  searchTerm: string;
  onAddBike: (bike: BikeItem) => void;
  branchId?: number | null;
  /** Deja solo motos usadas; sin esto el parámetro no viaja en la consulta */
  onlyUsed?: boolean;
  /**
   * Pide el inventario con `needGps=true`, muestra el IMEI del GPS debajo del
   * color y deshabilita las motos sin GPS. Lo usa la venta por sucursal cuando
   * el destino es Arranca; en órdenes queda apagado y el parámetro no viaja.
   */
  requireGpsImei?: boolean;
  /**
   * Monto a mostrar en cada fila. Sin esto se muestra el precio de lista —y el
   * rango negociable de las usadas—, que es lo que cobra una orden. La venta
   * por sucursal lo usa para mostrar el monto que esa transacción va a cargar.
   */
  priceFor?: (bike: BikeItem) => number;
}

/** Sin color no se pinta blanco sobre blanco: el cuadrito cae a negro */
const FALLBACK_HEX = '#000000';

/**
 * El hex del color según cómo lo nombre cada forma de la respuesta: las filas
 * por unidad traen `hexCode` y el agregado por modelo/color, `colorHex`.
 */
function resolveHex(source: any): string {
  return source?.hexCode || source?.colorHex || FALLBACK_HEX;
}

const productsService = new ProductsService();

export function OrderBikesList({
  searchTerm,
  onAddBike,
  branchId,
  onlyUsed = false,
  requireGpsImei = false,
  priceFor,
}: OrderBikesListProps) {
  const token = useToken();
  const currentBranchId = useCurrentBranchId();
  const effectiveBranchId = branchId ?? currentBranchId;
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [debouncedSearch] = useDebounce(searchTerm, 500);

  /**
   * El listado filtrado es más corto: la página en la que estabas puede no
   * existir. Se ajusta durante el render y no en un efecto, para que no salga
   * una consulta de más con la página vieja antes de corregirse.
   */
  const [previousOnlyUsed, setPreviousOnlyUsed] = useState(onlyUsed);
  if (previousOnlyUsed !== onlyUsed) {
    setPreviousOnlyUsed(onlyUsed);
    setPage(1);
  }

  // Mismo caso con el filtro de GPS: cambia el largo del listado
  const [previousRequireGps, setPreviousRequireGps] = useState(requireGpsImei);
  if (previousRequireGps !== requireGpsImei) {
    setPreviousRequireGps(requireGpsImei);
    setPage(1);
  }

  const bikeQuery = useQuery({
    queryKey: [
      'orderForm_bikeInventory',
      token,
      effectiveBranchId,
      page,
      pageSize,
      debouncedSearch,
      onlyUsed,
      requireGpsImei,
    ],
    queryFn: async () => {
      return productsService.getBikeInventory(
        token as string,
        effectiveBranchId!.toString(),
        {
          page: page.toString(),
          pageSize: pageSize.toString(),
          search: debouncedSearch,
          ...(onlyUsed && { used: 'true' }),
          ...(requireGpsImei && { needGps: 'true' }),
        }
      );
    },
    enabled: !!token && !!effectiveBranchId,
  });

  const bikeInventoryData = bikeQuery.data?.data || null;

  const bikes = useMemo(() => {
    let bikeData: any[] | null = null;
    if (bikeInventoryData?.results) {
      bikeData = bikeInventoryData.results;
    } else if (bikeInventoryData?.inventory) {
      bikeData = bikeInventoryData.inventory;
    } else if (Array.isArray(bikeInventoryData)) {
      bikeData = bikeInventoryData as any[];
    }

    if (!bikeData || bikeData.length === 0) {
      return [] as BikeItem[];
    }

    const processedBikes: BikeItem[] = [];

    bikeData.forEach((bike: any) => {
      if (bike.colors && Array.isArray(bike.colors)) {
        bike.colors.forEach((colorInfo: any) => {
          processedBikes.push({
            id: `${bike.model}-${colorInfo.color}`,
            // Agregado por modelo y color: la combinación ya es única
            rowKey: `${bike.model}-${colorInfo.color}`,
            plate: '',
            color: colorInfo.color,
            hexCode: resolveHex(colorInfo),
            serialNumber: '',
            productName: bike.model,
            brand: bike.brand,
            model: bike.model,
            available: colorInfo.quantity > 0,
            quantity: colorInfo.quantity,
            price: bike.price || 0,
            // Agregado por modelo y color: no hay costo de una unidad concreta
            amount: 0,
            used: bike.used || false,
          });
        });
      } else {
        processedBikes.push({
          id:
            bike?.product?.id?.toString() ||
            bike.id?.toString() ||
            `${bike.product?.model}-${bike.color}`,
          // El id de la fila del inventario sí es por unidad
          rowKey:
            bike.id?.toString() ||
            `${bike.product?.id}-${bike.plate}-${bike.serialNumber}`,
          plate: bike.plate || '',
          color: bike.color || '',
          hexCode: resolveHex(bike),
          serialNumber: bike.serialNumber || '',
          motorSerial: bike.motorSerial || '',
          inNumber: bike.inNumber || bike.in_number || '',
          productName: bike.product?.name || bike.name || '',
          brand: bike.product?.brand || bike.brand || '',
          model: bike.product?.model || bike.model || '',
          available: true,
          quantity: 1,
          price: bike.prices?.price || bike.amount || bike.price || 0,
          // Puede venir como `{ source, parsedValue }`, de ahí el helper
          amount: getParsedAmount(bike.amount) || bike.prices?.cost || 0,
          used: bike.used || false,
          year: bike.year || '',
          orderId: bike.orderId || bike.order_id || '',
          receptionDate: bike.receptionDate || bike.reception_date || '',
          cost: bike.prices?.cost,
          dpPrice: bike.prices?.dpPrice,
          epPrice: bike.prices?.epPrice,
          gpsImei: bike.gpsImei ?? null,
        });
      }
    });

    return processedBikes;
  }, [bikeInventoryData]);

  const totalPages = useMemo(() => {
    return bikeInventoryData?.totalPages || 1;
  }, [bikeInventoryData]);

  return (
    <div className="space-y-2">
      {bikeQuery.isLoading ? (
        <p>Cargando motos...</p>
      ) : bikes.length === 0 ? (
        <p>No se encontraron motos</p>
      ) : (
        <>
          {bikes.map((bike) => {
            const hasGps = !!bike.gpsImei?.trim();
            // Sin GPS no se puede elegir cuando el destino lo exige
            const selectable = bike.available && (!requireGpsImei || hasGps);

            return (
              <Card
                key={bike.rowKey}
                // Toda la fila agrega: el `+` es solo la señal visual
                onClick={() => selectable && onAddBike(bike)}
                className={`p-4 hover:bg-gray-50 ${selectable ? 'cursor-pointer' : 'cursor-default opacity-50'}`}
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="font-medium">
                        {bike.productName} - {bike.brand}
                      </h3>
                      {bike.used && (
                        <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded border border-blue-700 text-blue-700 bg-blue-50">
                          Usada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Modelo: {bike.model}
                    </p>
                    <p className="text-sm text-gray-600">
                      Placa: {bike.plate || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Serial: {bike.serialNumber || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-gray-600">
                        Color: {bike.color}
                      </p>
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: bike.hexCode }}
                        title={bike.color}
                      ></div>
                    </div>
                    {requireGpsImei &&
                      (hasGps ? (
                        <p className="text-sm text-gray-600">
                          IMEI GPS: {bike.gpsImei}
                        </p>
                      ) : (
                        <p className="text-sm text-red-600">
                          Sin GPS instalado
                        </p>
                      ))}
                    {/*
                      Con `priceFor` manda el monto que decida quien consume el
                      listado. Si no, el rango negociable: del piso que deja el
                      margen descontado hasta el precio de lista, y sin piso que
                      calcular, solo el precio.
                    */}
                    <p className="text-sm font-medium">
                      {priceFor
                        ? `$${priceFor(bike).toFixed(2)}`
                        : priceRange(bike)}
                    </p>
                  </div>
                  <Button
                    // El card ya agrega: sin esto el click contaría dos veces
                    onClick={(event) => {
                      event.stopPropagation();
                      onAddBike(bike);
                    }}
                    disabled={!selectable}
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
