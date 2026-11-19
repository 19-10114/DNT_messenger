'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
// Eliminamos hooks de productos para que las consultas sólo se hagan en los subcomponentes activos.
import { OrderBikesList } from './orderForm/OrderBikesList.component';
import { OrderPartsList } from './orderForm/OrderPartsList.component';
import { OrderOthersList } from './orderForm/OrderOthersList.component';
import {
  useSelectedBikes,
  useSelectedParts,
  useAuthorizeZeroPrice,
  useOrderActions,
  SelectedBike,
  SelectedPart,
  useSelectedOthers,
  SelectedOtherProduct,
  useIsDeliveryNote,
  useDeliveryNoteAmount,
  useDeliveryNoteNumber,
  useOrderDetails,
} from '@/stores/order/order.store';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ORDERS_PAYMENT, DELIVERY_NOTES } from '@/constants/routes';
import { useOrders } from '@/hooks/useOrders';
import { useToken, useUser } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { buildOrderPayload } from '@/utils/orderUtils';
import { useToast } from '@/components/ui/use-toast';
import { ClientSearch } from '@/components/clients/ClientSearch.component';
import { ClientData } from '@/services/clients/types/Client.type';
import { CheckCircle } from 'lucide-react';
import { useSellers } from '@/hooks/useSeller';
import { ConfirmPreOrderModal } from '../modals/ConfirmPreOrderModal.component';
import { OrderBranchSelector } from './orderForm/OrderBranchSelector.component';
import { useRoles } from '@/stores/auth/auth.store';

interface OrderFormProps {
  isPreOrden?: boolean;
}

export function OrderForm({ isPreOrden }: OrderFormProps) {
  const router = useRouter();
  const roles = useRoles();
  const userIsSeller = roles.includes('seller');
  const userIsPartsAdmin = roles.includes('parts_admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(
    userIsPartsAdmin ? 'repuestos' : 'motos'
  );
  const [onlyUsedBikes, setOnlyUsedBikes] = useState(false);

  const selectedBikes = useSelectedBikes();
  const selectedParts = useSelectedParts();
  const selectedOthers = useSelectedOthers();
  const authorizeZeroPrice = useAuthorizeZeroPrice();
  const storeIsDeliveryNote = useIsDeliveryNote();
  const isDeliveryNote = isPreOrden ? true : storeIsDeliveryNote;
  const deliveryNoteAmount = useDeliveryNoteAmount();
  const deliveryNoteNumber = useDeliveryNoteNumber();
  const orderActions = useOrderActions();
  const orderDetails = useOrderDetails();
  const token = useToken();
  const user = useUser();
  const currentBranchId = useCurrentBranchId();
  const { createOrder, isCreatingOrder } = useOrders(token);
  const { toast } = useToast();
  const [selectedClientData, setSelectedClientData] =
    useState<ClientData | null>(null);
  const { sellers } = useSellers();
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');
  const [showPreOrderModal, setShowPreOrderModal] = useState(false);
  const [preOrderBranchId, setPreOrderBranchId] = useState<number | null>(
    currentBranchId ?? null
  );

  // Agregar moto a la selección (solo una moto por orden)
  const addBike = (bike: any) => {
    if (!bike.available) return;

    if (selectedBikes.length > 0) {
      alert('Solo se puede agregar una moto por orden');
      return;
    }

    const existingBike = selectedBikes.find((b) => b.id === bike.id);
    if (existingBike) return;

    const newBike: SelectedBike = {
      id: bike.id,
      plate: bike.plate,
      color: bike.color,
      serialNumber: bike.serialNumber,
      motorSerial: bike.motorSerial || bike.motor_serial || '',
      inNumber: bike.inNumber,
      outNumber: bike.outNumber,
      productName: bike.productName,
      brand: bike.brand,
      quantity: 1,
      // `price` ya viene resuelto por el listado (precio de lista). No caer en
      // `amount`: es lo que costó la unidad al entrar al inventario, no el
      // precio de venta.
      price: bike.price || 0,
    };
    orderActions.addSelectedBike(newBike);
  };

  useEffect(() => {
    if (!orderDetails) {
      orderActions.setOrderDetails({
        invoice_number: '',
        type: 'sale',
        notes: '',
        origin_branch: currentBranchId ?? 0,
        target_branch: 24,
        total_invoice_bs: 0,
      } as any);
    }
  }, []);

  useEffect(() => {
    if (userIsSeller && user?.id && sellers.length > 0) {
      const currentSeller = sellers.find(
        (seller) => Number(seller.id) === Number(user.id)
      );

      if (currentSeller) {
        setSelectedSellerId(currentSeller.id);
        orderActions.updateOrderDetails({
          seller: currentSeller.id,
          sellerName: currentSeller.name,
        });
      }
    }
  }, [user, sellers]);

  const addPart = (part: any) => {
    if (!part.available) return;

    const newPart: SelectedPart = {
      id: part.id,
      sku: part.sku,
      name: part.name,
      model: part.model,
      price: part.price,
      quantity: 1,
      availableQuantity: part.quantity,
    };
    orderActions.addSelectedPart(newPart);
  };

  const addOther = (other: any) => {
    const newOther: SelectedOtherProduct = {
      id: other.id,
      sku: other.sku,
      name: other.name,
      model: other.model,
      brand: other.brand,
      price: other.price,
      quantity: 1,
      availableQuantity: 999,
    };
    orderActions.addSelectedOther(newOther);
  };

  const updatePartQuantity = (id: string, newQuantity: number) => {
    orderActions.updatePartQuantity(id, newQuantity);
  };

  const updateBikePrice = (id: string, newPrice: number) => {
    orderActions.updateBikePrice(id, newPrice);
  };

  const updateBikeOutNumber = (id: string, newOutNumber: string) => {
    orderActions.updateBikeOutNumber(id, newOutNumber);
  };

  const updatePartPrice = (id: string, newPrice: number) => {
    orderActions.updatePartPrice(id, newPrice);
  };

  const updateOtherQuantity = (id: string, newQuantity: number) => {
    orderActions.updateOtherQuantity(id, newQuantity);
  };

  const updateOtherPrice = (id: string, newPrice: number) => {
    orderActions.updateOtherPrice(id, newPrice);
  };

  const removeBike = (id: string) => {
    orderActions.removeSelectedBike(id);
  };

  const removePart = (id: string) => {
    orderActions.removeSelectedPart(id);
  };

  const removeOther = (id: string) => {
    orderActions.removeSelectedOther(id);
  };

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
  const hasZeroPriceItems = [
    ...selectedBikes,
    ...selectedParts,
    ...selectedOthers,
  ].some((item) => item.price === 0);

  // Validar si se puede procesar la orden
  const canProcessOrder = () => {
    const hasItems =
      selectedBikes.length > 0 ||
      selectedParts.length > 0 ||
      selectedOthers.length > 0;
    const zeroAuthorized = !hasZeroPriceItems || authorizeZeroPrice;
    const hasClient = !!orderDetails?.client;
    return hasItems && zeroAuthorized && hasClient;
  };

  const handleNext = () => {
    if (!orderDetails?.client) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un cliente antes de continuar',
        variant: 'destructive',
      });
      return;
    }

    if (canProcessOrder()) {
      // Actualizar la autorización de precio cero en el store
      orderActions.setAuthorizeZeroPrice(authorizeZeroPrice);

      if (isDeliveryNote) {
        setShowPreOrderModal(true);
      } else {
        // Flujo normal: navegar a la página de pago
        router.push(ORDERS_PAYMENT);
      }
    }
  };

  const handleConfirmPreOrder = () => {
    if (!orderDetails?.client) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar un cliente antes de continuar',
        variant: 'destructive',
      });
      return;
    }

    orderActions.updateOrderDetails({
      status: 'incomplete',
    });

    const userId = user?.id?.toString() || '1';
    const orderPayload = buildOrderPayload(
      {
        invoice_number: '',
        type: 'sale',
        notes: '',
        origin_branch: (isPreOrden ? preOrderBranchId : currentBranchId) ?? 0,
        target_branch: 24,
        total_invoice_bs: grandTotal,
      },
      [], // Sin métodos de pago
      selectedBikes,
      selectedParts,
      selectedOthers,
      userId,
      orderDetails?.client.toString(),
      grandTotal,
      false, // billed = false
      deliveryNoteNumber,
      userIsSeller ? user?.id.toString() : undefined
    );

    createOrder(orderPayload, {
      onSuccess: () => {
        toast({
          title: 'Éxito',
          description: 'Pre Orden Creada Correctamente',
        });
        setShowPreOrderModal(false);
        setTimeout(() => {
          orderActions.clearOrder();
          router.push(DELIVERY_NOTES);
        }, 1500);
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description:
            error?.response?.data?.message || 'Error al crear la pre orden',
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* Selector de sucursal */}
      {isPreOrden && (
        <Card>
          <CardHeader>
            <CardTitle>Sucursal</CardTitle>
            <CardDescription>
              Seleccione la sucursal para consultar inventario y asignar la pre
              orden
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OrderBranchSelector
              value={preOrderBranchId}
              onChange={(id) => {
                setPreOrderBranchId(id);
                orderActions.updateOrderDetails({ origin_branch: id });
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Información del Cliente */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
          <CardDescription>
            Busque el cliente por cédula de identidad o cree uno nuevo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientSearch
            isBikeOrder={selectedBikes.length > 0}
            onClientSelect={(client: ClientData | null) => {
              if (client) {
                setSelectedClientData(client);
                orderActions.updateOrderDetails({
                  client: client.id,
                  client_country_id: client.countryId,
                  client_name: `${client.firstName} ${client.lastName}`,
                });
              } else {
                setSelectedClientData(null);
                orderActions.updateOrderDetails({
                  client: undefined,
                  client_country_id: undefined,
                  client_name: undefined,
                });
              }
            }}
          />
          {selectedClientData && selectedClientData.inFavor !== undefined && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-green-800">
                Abono a favor: ${selectedClientData.inFavor.toFixed(2)}
              </p>
            </div>
          )}
          {!selectedClientData && (
            <p className="mt-2 text-sm text-red-600">
              ⚠️ Seleccione un cliente para continuar
            </p>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Panel principal de búsqueda */}
        <div className="flex-1 min-h-0">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Búsqueda de Productos - Ventas</CardTitle>
              <div className="space-y-4">
                {/* Tabs alternativo usando botones */}
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 border-b">
                  {!userIsPartsAdmin && (
                    <Button
                      variant={activeTab === 'motos' ? 'default' : 'ghost'}
                      onClick={() => {
                        setActiveTab('motos');
                        orderActions.clearSelectedBikes();
                        orderActions.clearSelectedParts();
                      }}
                      className="rounded-b-none flex-1 sm:flex-none"
                    >
                      Motos
                    </Button>
                  )}

                  <Button
                    variant={activeTab === 'repuestos' ? 'default' : 'ghost'}
                    onClick={() => {
                      setActiveTab('repuestos');
                      orderActions.clearSelectedBikes();
                    }}
                    className="rounded-b-none flex-1 sm:flex-none"
                  >
                    Repuestos
                  </Button>
                  <Button
                    variant={activeTab === 'otros' ? 'default' : 'ghost'}
                    onClick={() => {
                      setActiveTab('otros');
                      orderActions.clearSelectedBikes();
                    }}
                    className="rounded-b-none flex-1 sm:flex-none"
                  >
                    Otros
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder={
                      activeTab === 'motos'
                        ? 'Buscar por placa, serial o modelo...'
                        : activeTab === 'repuestos'
                          ? 'Buscar por SKU, nombre o modelo...'
                          : 'Buscar por SKU, nombre o modelo...'
                    }
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {activeTab === 'motos' && !userIsPartsAdmin && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="order-form-used-bikes"
                      checked={onlyUsedBikes}
                      onCheckedChange={(checked) =>
                        setOnlyUsedBikes(checked === true)
                      }
                    />
                    <label
                      htmlFor="order-form-used-bikes"
                      className="text-sm cursor-pointer select-none"
                    >
                      Motos Usadas
                    </label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {activeTab === 'motos' && !userIsPartsAdmin && (
                <OrderBikesList
                  searchTerm={searchTerm}
                  onAddBike={addBike}
                  branchId={isPreOrden ? preOrderBranchId : undefined}
                  onlyUsed={onlyUsedBikes}
                />
              )}

              {activeTab === 'repuestos' && (
                <OrderPartsList
                  searchTerm={searchTerm}
                  onAddPart={addPart}
                  branchId={isPreOrden ? preOrderBranchId : undefined}
                />
              )}

              {activeTab === 'otros' && (
                <OrderOthersList
                  searchTerm={searchTerm}
                  onAddOther={addOther}
                  branchId={isPreOrden ? preOrderBranchId : undefined}
                />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Panel lateral de productos seleccionados */}
        <div className="w-full lg:w-96 lg:min-w-96">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Productos Seleccionados</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto space-y-4">
              {/* Motos seleccionadas */}
              {selectedBikes.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Motos</h3>
                  <div className="space-y-2">
                    {selectedBikes.map((bike: any) => (
                      <Card key={bike.id} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {bike.productName}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Placa: {bike.plate}
                            </p>
                            <p className="text-xs text-gray-600">
                              Serial: {bike.serialNumber}
                            </p>
                            <p className="text-xs text-gray-600">
                              Motor: {bike.motorSerial}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <Label className="text-xs">Precio:</Label>
                              <Input
                                type="number"
                                value={bike.price}
                                onChange={(e) =>
                                  updateBikePrice(
                                    bike.id,
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="w-20 h-6 text-xs"
                                step="0.01"
                                min="0"
                              />
                            </div>
                            {!isPreOrden && (
                              <div className="flex items-center gap-2 mt-2">
                                <Label className="text-xs">N° salida:</Label>
                                <Input
                                  type="number"
                                  value={bike.outNumber ?? ''}
                                  onChange={(e) =>
                                    updateBikeOutNumber(bike.id, e.target.value)
                                  }
                                  className="w-28 h-6 text-xs"
                                  step="1"
                                  min="0"
                                  inputMode="numeric"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            onClick={() => removeBike(bike.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 self-start sm:self-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Repuestos seleccionados */}
              {selectedParts.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Repuestos</h3>
                  <div className="space-y-2">
                    {selectedParts.map((part: any) => (
                      <Card key={part.id} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{part.name}</h4>
                            <p className="text-xs text-gray-600">
                              SKU: {part.sku}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() =>
                                    updatePartQuantity(
                                      part.id,
                                      part.quantity - 1
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs w-8 text-center">
                                  {part.quantity}
                                </span>
                                <Button
                                  onClick={() =>
                                    updatePartQuantity(
                                      part.id,
                                      part.quantity + 1
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={
                                    part.quantity >= part.availableQuantity
                                  }
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">$</Label>
                                <Input
                                  type="number"
                                  value={part.price}
                                  onChange={(e) =>
                                    updatePartPrice(
                                      part.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 h-6 text-xs text-center"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removePart(part.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 self-start sm:self-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Otros seleccionados */}
              {selectedOthers.length > 0 && (
                <div>
                  <h3 className="font-medium mb-2">Otros</h3>
                  <div className="space-y-2">
                    {selectedOthers.map((other: any) => (
                      <Card key={other.id} className="p-3">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">
                              {other.name}
                            </h4>
                            <p className="text-xs text-gray-600">
                              SKU: {other.sku}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center gap-1">
                                <Button
                                  onClick={() =>
                                    updateOtherQuantity(
                                      other.id,
                                      Math.max(1, other.quantity - 1)
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="text-xs w-8 text-center">
                                  {other.quantity}
                                </span>
                                <Button
                                  onClick={() =>
                                    updateOtherQuantity(
                                      other.id,
                                      other.quantity + 1
                                    )
                                  }
                                  variant="outline"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                              <div className="flex items-center gap-1">
                                <Label className="text-xs">$</Label>
                                <Input
                                  type="number"
                                  value={other.price}
                                  onChange={(e) =>
                                    updateOtherPrice(
                                      other.id,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-24 h-6 text-xs text-center"
                                  step="0.01"
                                  min="0"
                                />
                              </div>
                            </div>
                          </div>
                          <Button
                            onClick={() => removeOther(other.id)}
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 self-start sm:self-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Resumen y autorización */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Motos:</span>
                    <span>${totalBikes.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Repuestos:</span>
                    <span>${totalParts.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Otros:</span>
                    <span>${totalOthers.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total:</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Autorización para precios $0 */}
                {hasZeroPriceItems && (
                  <div className="space-y-2">
                    <Button
                      onClick={() =>
                        orderActions.setAuthorizeZeroPrice(!authorizeZeroPrice)
                      }
                      variant={authorizeZeroPrice ? 'default' : 'outline'}
                      size="sm"
                      className="w-full"
                    >
                      {authorizeZeroPrice ? '✓' : ''} Autorizar productos con
                      precio $0
                    </Button>
                  </div>
                )}

                {/* Nota de Entrega */}
                {(selectedBikes.length > 0 ||
                  selectedParts.length > 0 ||
                  selectedOthers.length > 0) && (
                  <div className="space-y-3">
                    {!isPreOrden && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="deliveryNote"
                          checked={isDeliveryNote}
                          onChange={(e) =>
                            orderActions.setIsDeliveryNote(e.target.checked)
                          }
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label
                          htmlFor="deliveryNote"
                          className="text-sm font-medium"
                        >
                          Habilitar Pre Orden
                        </Label>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  onClick={handleNext}
                  disabled={!canProcessOrder() || isCreatingOrder}
                  className="w-full"
                >
                  {isCreatingOrder
                    ? 'Creando...'
                    : isDeliveryNote
                      ? 'Crear Pre Orden'
                      : 'Procesar Orden'}
                </Button>
              </div>

              {selectedBikes.length === 0 &&
                selectedParts.length === 0 &&
                selectedOthers.length === 0 && (
                  <p className="text-center text-gray-500 text-sm mt-8">
                    No hay productos seleccionados
                  </p>
                )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ConfirmPreOrderModal
        open={showPreOrderModal}
        onOpenChange={setShowPreOrderModal}
        deliveryNoteNumber={deliveryNoteNumber}
        onDeliveryNoteNumberChange={(value) =>
          orderActions.setDeliveryNoteNumber(value)
        }
        onConfirm={handleConfirmPreOrder}
        isCreatingOrder={isCreatingOrder}
      />
    </div>
  );
}
