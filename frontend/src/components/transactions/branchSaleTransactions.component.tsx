'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Input } from '@/components/ui/input.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import { useToast } from '@/components/ui/use-toast';
import {
  BikeItem,
  OrderBikesList,
} from '@/components/forms/orderForm/OrderBikesList.component';
import {
  OrderPartsList,
  PartItem,
} from '@/components/forms/orderForm/OrderPartsList.component';
import { OrderBranchSelector } from '@/components/forms/orderForm/OrderBranchSelector.component';
import { useTransactions } from '@/hooks/useTransactions';
import {
  TransactionDataPayload,
  Type,
} from '@/services/transactions/types/GetAllTransactions';
import { useToken, useUser } from '@/stores/auth/auth.store';
import { useBranches, useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  BranchSaleBike,
  BranchSalePart,
  BranchSalePrices,
} from './branchSale/branchSale.model';
import { BranchSaleBikeCard } from './branchSale/BranchSaleBikeCard.component';
import { BranchSalePartsCard } from './branchSale/BranchSalePartsCard.component';
import { BranchSaleConfirmModal } from './branchSale/BranchSaleConfirmModal.component';

export type BranchSaleTab = 'motos' | 'repuestos';

/**
 * Sucursales con lista de precios propia. Son los mismos ids que usa
 * `TransactionForm` para este mismo cálculo.
 */
const DALE_PLAY_BRANCH_ID = 36;
const EL_PANITA_BRANCH_ID = 32;

/**
 * Arranca no es un destino válido: las motos le llegan solo por el módulo de
 * Solicitudes Arranca (el backend rechaza cualquier otra transferencia a 43).
 */
const ARRANCA_BRANCH_ID = 43;

/**
 * "Ventas" no es un destino válido para una transferencia entre sucursales: es
 * la sucursal contra la que se registra una venta a cliente final.
 */
const VENTAS_BRANCH_ID = 24;

/**
 * La pestaña activa se pinta en negro sobre la línea gris; la inactiva no
 * tiene fondo. Pisa el `bg-white` que trae el primitivo para el estado activo.
 */
const TAB_TRIGGER_CLASS =
  'rounded-t-md rounded-b-none py-2 data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-none';

/**
 * Monto con el que se carga la moto según a qué sucursal va. Por defecto es el
 * **costo**, no el precio de lista: esto es una transferencia entre sucursales,
 * no una venta a cliente final. Las excepciones son las sucursales con lista
 * propia; si esa lista no tiene precio cargado se cae igual al costo.
 */
function priceForBranch(
  prices: BranchSalePrices,
  targetBranchId: number | null
): number {
  if (targetBranchId === DALE_PLAY_BRANCH_ID && prices.dpPrice) {
    return prices.dpPrice;
  }
  if (targetBranchId === EL_PANITA_BRANCH_ID && prices.epPrice) {
    return prices.epPrice;
  }
  // Un costo en 0 es un costo sin cargar: ahí sirve más el precio de lista
  return prices.cost || prices.price;
}

/** Los precios de una fila del inventario, como los espera `priceForBranch` */
function bikePrices(bike: BikeItem): BranchSalePrices {
  return {
    // El costo de la lista de precios, no lo que costó esta unidad (`amount`)
    cost: bike.cost,
    price: bike.price,
    dpPrice: bike.dpPrice,
    epPrice: bike.epPrice,
  };
}

/** Lo que cuesta el repuesto; en 0 (sin cargar) se cae al precio de lista */
function partCost(part: PartItem): number {
  return part.cost || part.price;
}

/**
 * La fecha de recepción del inventario puede venir vacía o ilegible; en ese
 * caso se arranca con hoy, que es lo que el usuario terminaría poniendo.
 */
function parseReceptionDate(value?: string): Date {
  if (!value) return new Date();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Venta por sucursal: carga transacciones `sale` desde la sucursal activa hacia
 * otra, eligiendo los productos sobre el inventario en vez de un selector.
 *
 * Es un módulo aparte de `TransactionForm`, que sigue cubriendo el resto de los
 * tipos (pago, compra, compra Empire). Acá el tipo es siempre `sale` y la
 * sucursal de origen es siempre la activa.
 */
interface BranchSaleTransactionsProps {
  /** Pestaña con la que abre (`?tab=` en la URL); por defecto, motos */
  initialTab?: BranchSaleTab;
}

export function BranchSaleTransactions({
  initialTab = 'motos',
}: BranchSaleTransactionsProps = {}) {
  const token = useToken();
  const user = useUser();
  const currentBranchId = useCurrentBranchId();
  const branches = useBranches();
  const { toast } = useToast();
  const {
    createTransaction,
    isCreatingTransaction,
    createBatchTransactions,
    isCreatingBatchTransactions,
  } = useTransactions(token);

  const [activeTab, setActiveTab] = useState<BranchSaleTab>(initialTab);
  const [targetBranchId, setTargetBranchId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBikes, setSelectedBikes] = useState<BranchSaleBike[]>([]);
  const [selectedParts, setSelectedParts] = useState<BranchSalePart[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const userId = user?.id?.toString() || '';
  const isSubmitting = isCreatingTransaction || isCreatingBatchTransactions;

  const targetBranchName =
    branches.find((branch) => branch.id === targetBranchId)?.name || '';

  const totalBikes = selectedBikes.reduce(
    (sum, bike) => sum + (parseFloat(bike.amount) || 0),
    0
  );

  const totalParts = selectedParts.reduce(
    (sum, part) => sum + part.price * part.quantity,
    0
  );

  /**
   * Cambiar de sucursal en el navbar cambia el inventario que se lista, así que
   * lo ya agregado dejó de existir en la sucursal nueva: se vacía en las dos
   * pestañas. Si la sucursal destino pasó a ser la misma que la de origen,
   * también se suelta — no se puede vender una sucursal a sí misma.
   */
  const previousBranchId = useRef(currentBranchId);
  useEffect(() => {
    if (previousBranchId.current === currentBranchId) return;
    previousBranchId.current = currentBranchId;

    setSelectedBikes([]);
    setSelectedParts([]);
    setTargetBranchId((current) =>
      current === currentBranchId ? null : current
    );
  }, [currentBranchId]);

  /**
   * Cambiar de pestaña limpia lo seleccionado: una transacción es de motos o de
   * repuestos, nunca de las dos. Arranca sigue recibiendo repuestos por aquí,
   * pero las motos solo le llegan por Solicitudes Arranca, así que al pasar a
   * la pestaña de motos se suelta ese destino.
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value as BranchSaleTab);
    setSearchTerm('');
    setSelectedBikes([]);
    setSelectedParts([]);
    if (value === 'motos') {
      setTargetBranchId((current) =>
        current === ARRANCA_BRANCH_ID ? null : current
      );
    }
  };

  const handleTargetBranchChange = (branchId: number) => {
    setTargetBranchId(branchId);

    // El monto depende de a qué sucursal va, así que se rehace con la nueva
    setSelectedBikes((current) =>
      current.map((bike) => ({
        ...bike,
        amount: priceForBranch(bike.prices, branchId).toString(),
      }))
    );
  };

  /** Se pueden cargar varias motos; cada una será su propia transacción */
  const addBike = (bike: BikeItem) => {
    if (!bike.available) return;

    const prices = bikePrices(bike);

    setSelectedBikes((current) => {
      // La misma unidad no se agrega dos veces
      if (current.some((item) => item.rowKey === bike.rowKey)) return current;

      return [
        ...current,
        {
          rowKey: bike.rowKey,
          productId: bike.id,
          productName: bike.productName,
          brand: bike.brand,
          model: bike.model,
          plate: bike.plate,
          amount: priceForBranch(prices, targetBranchId).toString(),
          orderId: bike.orderId || '',
          receptionDate: parseReceptionDate(bike.receptionDate),
          color: bike.color || '',
          serialNumber: bike.serialNumber || '',
          motorSerial: bike.motorSerial || '',
          inNumber: bike.inNumber || '',
          year: bike.year || '',
          prices,
        },
      ];
    });
  };

  const patchBike = (rowKey: string, patch: Partial<BranchSaleBike>) => {
    setSelectedBikes((current) =>
      current.map((bike) =>
        bike.rowKey === rowKey ? { ...bike, ...patch } : bike
      )
    );
  };

  const removeBike = (rowKey: string) => {
    setSelectedBikes((current) =>
      current.filter((bike) => bike.rowKey !== rowKey)
    );
  };

  const addPart = (part: PartItem) => {
    if (!part.available) return;

    setSelectedParts((current) => {
      // Repetir un repuesto suma una unidad en vez de abrir otra fila
      const alreadyAdded = current.some((item) => item.productId === part.id);
      if (alreadyAdded) {
        return current.map((item) =>
          item.productId === part.id && item.quantity < item.availableQuantity
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [
        ...current,
        {
          productId: part.id,
          sku: part.sku,
          name: part.name,
          model: part.model,
          // Va al costo, no al precio de lista
          price: partCost(part),
          quantity: 1,
          availableQuantity: part.quantity,
        },
      ];
    });
  };

  const updatePartQuantity = (productId: string, quantity: number) => {
    setSelectedParts((current) =>
      current.map((part) =>
        part.productId === productId
          ? {
              ...part,
              quantity: Math.min(
                Math.max(1, quantity),
                part.availableQuantity || 1
              ),
            }
          : part
      )
    );
  };

  const updatePartPrice = (productId: string, price: number) => {
    setSelectedParts((current) =>
      current.map((part) =>
        part.productId === productId ? { ...part, price } : part
      )
    );
  };

  const removePart = (productId: string) => {
    setSelectedParts((current) =>
      current.filter((part) => part.productId !== productId)
    );
  };

  /**
   * Lo que comparten las dos pestañas: siempre una venta, siempre desde la
   * sucursal activa hacia la elegida.
   */
  const buildBasePayload = () => ({
    type: Type.Sale,
    invoice_number: invoiceNumber,
    invoice_origin: '',
    out_number: '',
    tax: '0',
    origin_branch: currentBranchId?.toString() || '',
    target_branch: targetBranchId?.toString() || '',
    user: userId,
    responsible: userId,
    notes: '',
  });

  const buildBikePayload = (bike: BranchSaleBike): TransactionDataPayload => ({
    ...buildBasePayload(),
    amount: bike.amount,
    order_id: bike.orderId,
    plate: bike.plate,
    color: bike.color,
    serial_number: bike.serialNumber,
    motor_serial: bike.motorSerial,
    in_number: bike.inNumber,
    year: bike.year,
    reception_date: bike.receptionDate.toISOString(),
    quantity: '1',
    product: bike.productId,
  });

  /** `amount` es el precio unitario, como en `TransactionForm` */
  const buildPartPayload = (part: BranchSalePart): TransactionDataPayload => ({
    ...buildBasePayload(),
    amount: part.price.toString(),
    order_id: '',
    plate: '',
    color: '',
    serial_number: '',
    motor_serial: '',
    in_number: '',
    year: '',
    reception_date: new Date().toISOString(),
    quantity: part.quantity.toString(),
    product: part.productId,
  });

  const hasSelection =
    activeTab === 'motos' ? selectedBikes.length > 0 : selectedParts.length > 0;

  const canSubmit =
    !!targetBranchId &&
    !!currentBranchId &&
    !!userId &&
    hasSelection &&
    !isSubmitting;

  /** El resumen y el número de factura se piden antes de enviar */
  const handleOpenConfirm = () => {
    if (!canSubmit) return;
    setIsConfirmOpen(true);
  };

  const handleConfirm = () => {
    if (!canSubmit) return;

    const payloads =
      activeTab === 'motos'
        ? selectedBikes.map(buildBikePayload)
        : selectedParts.map(buildPartPayload);

    const mutationOptions = {
      onSuccess: () => {
        toast({
          title: 'Éxito',
          description:
            payloads.length === 1
              ? 'Transacción cargada correctamente'
              : `${payloads.length} transacciones cargadas correctamente`,
        });
        setIsConfirmOpen(false);
        setInvoiceNumber('');
        setSelectedBikes([]);
        setSelectedParts([]);
      },
      onError: () => {
        toast({
          title: 'Error',
          description: 'Ocurrió un error al cargar la transacción',
          variant: 'destructive' as const,
        });
      },
    };

    if (payloads.length === 1) {
      createTransaction(payloads[0], mutationOptions);
    } else {
      createBatchTransactions(payloads, mutationOptions);
    }
  };

  const submitButton = (
    <div className="border-t pt-4 space-y-2">
      <Button
        onClick={handleOpenConfirm}
        disabled={!canSubmit}
        className="w-full"
      >
        Cargar transacción
      </Button>
      {!targetBranchId && (
        <p className="text-xs text-amber-600 text-center">
          Seleccione la sucursal de destino para habilitar la carga
        </p>
      )}
    </div>
  );

  return (
    <section className="p-6 space-y-6">
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Transacciones entre sucursales
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Cargue ventas desde la sucursal activa hacia otra, eligiendo los
          productos.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        {/* Sin fondo y con una línea gris al pie: el primitivo trae bg-gray-200 */}
        <TabsList className="mt-2 grid w-full grid-cols-2 h-auto rounded-none border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger value="motos" className={TAB_TRIGGER_CLASS}>
            Motos
          </TabsTrigger>
          <TabsTrigger value="repuestos" className={TAB_TRIGGER_CLASS}>
            Repuestos
          </TabsTrigger>
        </TabsList>

        {/* La sucursal de destino manda en las dos pestañas, por eso va afuera */}
        <Card className="mt-4">
          <CardContent className="pt-6">
            <OrderBranchSelector
              value={targetBranchId}
              onChange={handleTargetBranchChange}
              label="Sucursal de destino"
              helperText="⚠️ Seleccione la sucursal de destino para poder cargar la transacción"
              excludeBranchIds={[
                currentBranchId,
                VENTAS_BRANCH_ID,
                ...(activeTab === 'motos' ? [ARRANCA_BRANCH_ID] : []),
              ]}
            />
          </CardContent>
        </Card>

        <TabsContent value="motos" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* El listado ya trae su propio borde por fila: no lleva card */}
            <div className="flex-1 min-h-0 space-y-4">
              <Input
                placeholder="Buscar por placa, serial o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <OrderBikesList
                searchTerm={searchTerm}
                onAddBike={addBike}
                // El listado muestra el mismo monto que se va a cargar
                priceFor={(bike) =>
                  priceForBranch(bikePrices(bike), targetBranchId)
                }
              />
            </div>

            <div className="w-full lg:w-96 lg:min-w-96">
              <Card className="h-full">
                {/* `mx-6 px-0` deja la línea a la altura de los productos */}
                <CardHeader className="mx-6 px-0 pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrito de transacción
                  </CardTitle>
                  <CardDescription>
                    Motos asignadas a la transacción
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {selectedBikes.length > 0 ? (
                    <>
                      {/* Sin borde por tarjeta: sólo una línea que las separa */}
                      <div className="divide-y divide-gray-200">
                        {selectedBikes.map((bike) => (
                          <div
                            key={bike.rowKey}
                            className="py-3 first:pt-0 last:pb-0"
                          >
                            <BranchSaleBikeCard
                              bike={bike}
                              onChange={(patch) =>
                                patchBike(bike.rowKey, patch)
                              }
                              onRemove={() => removeBike(bike.rowKey)}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between font-medium text-sm">
                        <span>Total:</span>
                        <span>${totalBikes.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No hay motos seleccionadas
                    </p>
                  )}
                  {submitButton}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="repuestos" className="mt-6">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 min-h-0 space-y-4">
              <Input
                placeholder="Buscar por SKU, nombre o modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <OrderPartsList
                searchTerm={searchTerm}
                onAddPart={addPart}
                // El listado muestra el mismo monto que se va a cargar
                priceFor={partCost}
              />
            </div>

            <div className="w-full lg:w-96 lg:min-w-96">
              <Card className="h-full">
                {/* `mx-6 px-0` deja la línea a la altura de los productos */}
                <CardHeader className="mx-6 px-0 pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    Carrito de transacción
                  </CardTitle>
                  <CardDescription>
                    Repuestos asignados a la transacción
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {selectedParts.length > 0 ? (
                    <>
                      <BranchSalePartsCard
                        parts={selectedParts}
                        onQuantityChange={updatePartQuantity}
                        onPriceChange={updatePartPrice}
                        onRemove={removePart}
                      />
                      <div className="flex justify-between font-medium text-sm">
                        <span>Total:</span>
                        <span>${totalParts.toFixed(2)}</span>
                      </div>
                    </>
                  ) : (
                    <p className="text-center text-gray-500 text-sm py-8">
                      No hay repuestos seleccionados
                    </p>
                  )}
                  {submitButton}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <BranchSaleConfirmModal
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        targetBranchName={targetBranchName}
        bikes={activeTab === 'motos' ? selectedBikes : []}
        parts={activeTab === 'repuestos' ? selectedParts : []}
        invoiceNumber={invoiceNumber}
        onInvoiceNumberChange={setInvoiceNumber}
        onConfirm={handleConfirm}
        isSubmitting={isSubmitting}
      />
    </section>
  );
}
