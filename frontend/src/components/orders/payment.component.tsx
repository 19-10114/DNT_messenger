'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ORDERS, ORDERS_NEW, DELIVERY_NOTES } from '@/constants/routes';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  User,
  Users,
  Tag,
} from 'lucide-react';
import {
  useSelectedBikes,
  useSelectedParts,
  useSelectedOthers,
  useOrderActions,
  usePaymentMethods,
  useOrderDetails,
  useAuthorizeZeroPrice,
  useIsDeliveryNote,
  useDeliveryNoteNumber,
} from '@/stores/order/order.store';
import { useToken, useUser } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useOrders } from '@/hooks/useOrders';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useSellers } from '@/hooks/useSeller';
import { OrderDetailsForm } from './orderDetailsForm.component';
import { PaymentMethodsSelector } from './paymentMethodsSelector.component';
import { OrderSummary } from './orderSummary.component';
import { buildOrderPayload } from '@/utils/orderUtils';
import { useToast } from '@/components/ui/use-toast';
import {
  formatCurrency,
  formatCurrencyBolivares,
  getParsedAmount,
} from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useRoles } from '@/stores/auth/auth.store';

export function OrderPayment() {
  const router = useRouter();
  const roles = useRoles();
  const canChangeSeller = roles.some(
    (role) =>
      role.includes('admin') ||
      (!role.includes('seller') && !role.includes('cashier'))
  );
  const searchParams = useSearchParams();
  const invoicingOrderId = searchParams.get('orderId');
  const isInvoicingDeliveryNote = !!invoicingOrderId;
  const isPartsOrder = searchParams.get('isPartsOrder') === 'true';
  const selectedMotorcycles = useSelectedBikes();
  const selectedSpareParts = useSelectedParts();
  const selectedOthers = useSelectedOthers();
  const orderDetails = useOrderDetails();
  const paymentMethods = usePaymentMethods();
  const orderActions = useOrderActions();
  const authorizeZeroPrice = useAuthorizeZeroPrice();
  const currentBranchId = useCurrentBranchId();
  const token = useToken();
  const user = useUser();
  const { toast } = useToast();
  const isDeliveryNote = useIsDeliveryNote();
  const deliveryNoteNumber = useDeliveryNoteNumber();
  const [isClientLoading, setIsClientLoading] = useState(true);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  // Obtener vendedores
  const {
    sellers,
    isLoading: isSellersLoading,
    isError: isSellersError,
  } = useSellers();

  const {
    createOrder,
    isCreatingOrder,
    patchOrder,
    isPatchingOrder,
    orderById,
    isLoadingOrderById,
  } = useOrders(
    token,
    false, // shouldFetchOrders
    undefined, // branchId
    {}, // queryParameters
    invoicingOrderId ?? undefined, // orderId para fetch
    isInvoicingDeliveryNote // shouldFetchOrderById
  );

  const isProcessing = isCreatingOrder || isPatchingOrder;

  const { data: allBranches = [] } = useAllBranches();

  const isBikeOrder = selectedMotorcycles.length > 0;

  // Actualizar orderDetails con los datos de orderById cuando se factura una pre orden
  useEffect(() => {
    if (isInvoicingDeliveryNote && orderById) {
      if (orderById.client) {
        if (typeof orderById.client === 'object') {
          orderActions.updateOrderDetails({
            client: orderById.client.id,
          });
        } else {
          orderActions.updateOrderDetails({
            client: orderById.client,
          });
        }
      }

      if (orderById.seller) {
        orderActions.updateOrderDetails({
          seller: orderById.seller.toString(),
        });
      }

      // La sede es la de la pre orden, no la de la sesión de quien factura.
      // El store arranca con la sede del menú (orderDetailsForm), y si quien
      // factura tiene el menú en otra sede, el PATCH mandaba esa y la orden
      // quedaba facturada por una sede distinta a la que descontó el stock.
      const originBranchId =
        typeof orderById.originBranch === 'object'
          ? orderById.originBranch?.id
          : orderById.originBranch;
      const targetBranchId =
        typeof orderById.targetBranch === 'object'
          ? orderById.targetBranch?.id
          : orderById.targetBranch;
      if (originBranchId && targetBranchId) {
        orderActions.updateOrderDetails({
          origin_branch: originBranchId,
          target_branch: targetBranchId,
        });
      }
    }
  }, [orderById, isInvoicingDeliveryNote]);

  // Preseleccionar vendedor
  useEffect(() => {
    if (isInvoicingDeliveryNote && orderById?.seller && sellers.length > 0) {
      const existingSeller = sellers.find(
        (seller) => seller.id === orderById.seller?.toString()
      );
      if (existingSeller) {
        setSelectedSellerId(existingSeller.id);
      }
      return;
    }

    if (orderDetails?.seller && sellers.length > 0) {
      const existingSeller = sellers.find(
        (seller) => seller.id === orderDetails.seller
      );
      if (existingSeller) {
        setSelectedSellerId(existingSeller.id);
      }
    }
  }, [
    orderDetails?.seller,
    orderById?.seller,
    sellers,
    isInvoicingDeliveryNote,
  ]);

  // Calcular el total de la orden
  const orderTotal = useMemo(() => {
    if (isInvoicingDeliveryNote && orderById) {
      return (
        getParsedAmount(orderById.totalInvoiceUsd) ||
        getParsedAmount(orderById.totalUsd) ||
        0
      );
    }
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
    return motorcycleTotal + sparePartsTotal + othersTotal;
  }, [
    selectedMotorcycles,
    selectedSpareParts,
    selectedOthers,
    isInvoicingDeliveryNote,
    orderById,
  ]);

  // Calcular el total pagado
  const totalPaid = useMemo(() => {
    return paymentMethods.reduce((sum, method) => {
      return sum + (method.amount || 0);
    }, 0);
  }, [paymentMethods]);

  const totalPaidBs = useMemo(() => {
    return paymentMethods.reduce((sum, method) => {
      if (method.currency === 'BS' && method.amount_bs) {
        return sum + method.amount_bs;
      }
      return sum;
    }, 0);
  }, [paymentMethods]);

  const exchangeRate = orderDetails?.rate || 0;

  const maxBsAllowed = useMemo(() => {
    return orderTotal * exchangeRate * 2;
  }, [orderTotal, exchangeRate]);

  const remainingAmount = Math.max(0, orderTotal - totalPaid);
  const isOrderComplete =
    remainingAmount === 0 && (orderTotal > 0 || authorizeZeroPrice);

  const canProcessOrder = useMemo(() => {
    const hasClient = !!orderDetails?.client;
    const hasInvoice = !!orderDetails?.invoice_number?.trim();
    const hasRate = !!orderDetails?.rate && orderDetails.rate > 0;
    const hasItems =
      isInvoicingDeliveryNote ||
      selectedMotorcycles.length +
        selectedSpareParts.length +
        selectedOthers.length >
        0;
    const paymentComplete = isOrderComplete;

    return hasClient && hasInvoice && hasRate && hasItems && paymentComplete;
  }, [
    orderDetails,
    selectedMotorcycles.length,
    selectedSpareParts.length,
    selectedOthers.length,
    isOrderComplete,
    isInvoicingDeliveryNote,
  ]);

  // Desglose de canProcessOrder para el banner de estado -- antes decía
  // "Complete todos los campos requeridos" sin decir cuál, lo que hacía
  // imposible saber por qué el botón seguía deshabilitado (p.ej. con
  // autorizeZeroPrice ya activado).
  const missingRequirements = useMemo(() => {
    const missing: string[] = [];
    if (!orderDetails?.client) missing.push('cliente');
    if (!orderDetails?.invoice_number?.trim())
      missing.push('número de factura');
    if (!orderDetails?.rate || orderDetails.rate <= 0)
      missing.push('tasa cambiaria');
    if (!isOrderComplete) {
      missing.push(
        orderTotal === 0 ? 'autorizar orden con precio $0' : 'pago completo'
      );
    }
    return missing;
  }, [orderDetails, isOrderComplete, orderTotal]);

  // Redirigir si no hay productos seleccionados (solo para flujo normal)
  useEffect(() => {
    if (isInvoicingDeliveryNote) return;

    if (
      selectedMotorcycles.length === 0 &&
      selectedSpareParts.length === 0 &&
      selectedOthers.length === 0
    ) {
      router.push(ORDERS_NEW);
    }
  }, [
    selectedMotorcycles.length,
    selectedSpareParts.length,
    selectedOthers.length,
    router,
    isInvoicingDeliveryNote,
  ]);

  useEffect(() => {
    if (orderDetails?.client) {
      setIsClientLoading(false);
    }
  }, [orderDetails?.client]);

  useEffect(() => {
    if (isInvoicingDeliveryNote) return;
    if (orderDetails && orderDetails.origin_branch && currentBranchId) {
      if (orderDetails.origin_branch !== currentBranchId) {
        orderActions.clearOrder();
        router.push(ORDERS_NEW);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    orderDetails?.origin_branch,
    currentBranchId,
    router,
    orderActions,
    isInvoicingDeliveryNote,
  ]);

  useEffect(() => {
    orderActions.initializeOrderTotalPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    orderActions.clearOrder();
    if (isInvoicingDeliveryNote) {
      router.push(DELIVERY_NOTES);
    } else {
      router.push(ORDERS_NEW);
    }
  };

  const handleProcessOrder = async () => {
    if (!isInvoicingDeliveryNote && totalPaid > orderTotal + 0.1) {
      toast({
        title: 'Error',
        description:
          '¡El monto pagado no puede ser mayor al monto a pagar, por favor, revisa el tipo de moneda y los montos ingresados!',
        variant: 'destructive',
      });
      return;
    }

    if (!isInvoicingDeliveryNote && totalPaidBs > maxBsAllowed + 0.1) {
      toast({
        title: 'Error',
        description: `¡La suma de los pagos en BS excede el máximo permitido!`,
        variant: 'destructive',
      });
      return;
    }

    if (isProcessing) return;

    try {
      const userId = user?.id?.toString() || '1';
      const clientId = orderDetails?.client?.toString() || '';
      const totalInvoiceUsd = orderTotal;

      if (isInvoicingDeliveryNote) {
        const orderPayload = buildOrderPayload(
          orderDetails!,
          paymentMethods,
          selectedMotorcycles,
          selectedSpareParts,
          selectedOthers,
          userId,
          clientId,
          totalInvoiceUsd,
          true
        );

        patchOrder(
          { orderId: invoicingOrderId, orderData: orderPayload.order },
          {
            onSuccess: () => {
              toast({
                title: 'Éxito',
                description: 'Pre Orden Facturada Correctamente',
              });
              setTimeout(() => {
                orderActions.clearOrder();
                router.push(ORDERS);
              }, 1500);
            },
            onError: (error: any) => {
              console.error('Error al facturar la pre orden:', error);
              const errorMessage =
                error?.response?.data?.message ||
                error?.message ||
                'Error desconocido al facturar la pre orden';
              toast({
                title: 'Error',
                description: `Error al facturar: ${errorMessage}`,
                variant: 'destructive',
              });
            },
          }
        );
      } else {
        const orderPayload = buildOrderPayload(
          orderDetails!,
          paymentMethods,
          selectedMotorcycles,
          selectedSpareParts,
          selectedOthers,
          userId,
          clientId,
          totalInvoiceUsd,
          !isDeliveryNote,
          isDeliveryNote ? deliveryNoteNumber : undefined
        );

        createOrder(orderPayload, {
          onSuccess: () => {
            toast({
              title: 'Éxito',
              description: isDeliveryNote
                ? 'Pre Orden Creada Correctamente'
                : 'Orden Creada Correctamente',
            });
            setTimeout(() => {
              orderActions.clearOrder();
              router.push(isDeliveryNote ? DELIVERY_NOTES : ORDERS);
            }, 1500);
          },
          onError: (error: any) => {
            console.error('Error al procesar la orden:', error);
            const errorMessage =
              error?.response?.data?.message ||
              error?.message ||
              'Error desconocido al procesar la orden';
            toast({
              title: 'Error',
              description: `Error al procesar la orden: ${errorMessage}`,
              variant: 'destructive',
            });
          },
        });
      }
    } catch (error: any) {
      console.error('Error al procesar la orden:', error);
      toast({
        title: 'Error',
        description: 'Error inesperado al preparar la orden',
        variant: 'destructive',
      });
    }
  };

  return (
    <section className="container bg-background w-full min-h-screen py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver a Selección
              </Button>
              <div>
                <CardTitle>
                  {isInvoicingDeliveryNote
                    ? `Facturar Pre Orden #${invoicingOrderId}`
                    : 'Sistema de Órdenes Completo'}
                </CardTitle>
                <CardDescription>
                  {isInvoicingDeliveryNote
                    ? 'Complete la información de la orden, métodos de pago y revise el resumen'
                    : 'Configure la información de la orden, métodos de pago y revise el resumen'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Estado de la Orden */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center justify-items-center">
              {/* Información del Vendedor */}
              <div className="text-center w-full">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Users className="h-4 w-4 text-gray-500" />
                  <p className="text-md font-medium text-gray-700">Vendedor</p>
                </div>
                {isSellersLoading ? (
                  <div className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500">
                    Cargando vendedores...
                  </div>
                ) : isSellersError ? (
                  <div className="w-full px-3 py-2 border rounded-md bg-red-50 text-red-500">
                    Error al cargar vendedores
                  </div>
                ) : (
                  <Select
                    value={selectedSellerId}
                    onValueChange={(value) => {
                      const selectedSeller = sellers.find(
                        (s) => s.id === value
                      );
                      setSelectedSellerId(value);
                      orderActions.updateOrderDetails({
                        seller: value,
                        sellerName: selectedSeller?.name,
                      });
                    }}
                    disabled={!canChangeSeller}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccione un vendedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {sellers.map((seller) => (
                        <SelectItem key={seller.id} value={seller.id}>
                          {seller.name} {seller.ci ? `- ${seller.ci}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {/* Información del Cliente */}
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <User className="h-4 w-4 text-gray-500" />
                  <p className="text-md font-medium text-gray-700">Cliente</p>
                </div>
                {isInvoicingDeliveryNote ? (
                  orderById?.client ? (
                    <div>
                      <p className="text-xl text-gray-900 font-bold">
                        {typeof orderById.client === 'object'
                          ? `${orderById.client.firstName} ${orderById.client.lastName} - ${orderById.client.id}`
                          : orderById.client}
                      </p>
                    </div>
                  ) : (
                    <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                      <p className="text-xs text-yellow-800">
                        ⚠️ No hay cliente asociado a esta pre orden.
                      </p>
                    </div>
                  )
                ) : isClientLoading ? (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <p className="text-sm text-gray-500">Cargando cliente...</p>
                  </div>
                ) : orderDetails?.client ? (
                  <div>
                    <p className="text-xl text-gray-900 font-bold">
                      {orderDetails.client_name} - {orderDetails.client}
                    </p>
                  </div>
                ) : (
                  <div className="p-2 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-800">
                      ⚠️ No hay cliente seleccionado. Por favor, regrese a la
                      página anterior y seleccione un cliente.
                    </p>
                  </div>
                )}
              </div>
              {/* Total de la Orden */}
              <div className="text-center">
                <div className="flex items-center gap-2 mb-2 justify-center">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <p className="text-md font-medium text-gray-700">
                    Total de la Orden
                  </p>
                </div>
                <p className="text-xl font-bold text-blue-600">
                  ${orderTotal.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Estado de la Orden - Fila inferior */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                {canProcessOrder ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Orden lista para procesar
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Falta: {missingRequirements.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Layout Principal */}
        <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
          {/* Columna 1: Información de la Orden */}
          <div className="space-y-6">
            <OrderDetailsForm isPartsOrder={isPartsOrder} />
          </div>

          {/* Columna 2: Métodos de Pago */}
          <div className="space-y-6">
            <PaymentMethodsSelector
              totalAmount={orderTotal}
              onPaymentComplete={() => {
                console.log('Pago completado');
              }}
            />
          </div>

          {/* Columna 3: Resumen de la Orden */}
          <div className="space-y-6">
            {isInvoicingDeliveryNote ? (
              <Card>
                <CardHeader>
                  <CardTitle>Resumen de Pre Orden</CardTitle>
                  <CardDescription>
                    Pre Orden #{invoicingOrderId}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingOrderById ? (
                    <p className="text-sm text-muted-foreground">
                      Cargando datos de la orden...
                    </p>
                  ) : orderById ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total (USD):</span>
                        <span>
                          $
                          {getParsedAmount(orderById.totalInvoiceUsd).toFixed(
                            2
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total (Bs):</span>
                        <span>
                          {formatCurrencyBolivares(
                            getParsedAmount(
                              Number(orderById.totalInvoiceBs) *
                                Number(orderDetails?.rate)
                            )
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Sucursal origen:</span>
                        <span>
                          {(() => {
                            const branchId =
                              typeof orderById.originBranch === 'object'
                                ? orderById.originBranch.id
                                : orderById.originBranch;
                            return (
                              allBranches.find((b) => b.id === branchId)
                                ?.name || branchId
                            );
                          })()}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Fecha:</span>
                        <span>{orderById.createdAt}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-destructive">
                      No se pudo cargar la orden.
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <OrderSummary />
            )}
          </div>
        </div>

        {/* Botones de Acción */}
        <Card>
          <CardContent className="pt-6">
            {/* Autorización para orden en $0. En el flujo de creación este
                toggle vive en OrderForm, pero facturar una pre orden existente
                llega directo a esta pantalla sin pasar por ahí -- sin este
                control, una pre orden en $0 no tenía forma de facturarse. */}
            {orderTotal === 0 && (
              <div className="mb-4">
                <Button
                  onClick={() =>
                    orderActions.setAuthorizeZeroPrice(!authorizeZeroPrice)
                  }
                  variant={authorizeZeroPrice ? 'default' : 'outline'}
                  size="sm"
                  className="w-full"
                >
                  {authorizeZeroPrice ? '✓' : ''} Autorizar orden con precio $0
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center">
              <div className="space-y-1">
                <p className="text-lg font-semibold">
                  Total: ${orderTotal.toFixed(2)} USD
                </p>
                {remainingAmount > 0 && (
                  <p className="text-sm text-orange-600">
                    Faltan ${remainingAmount.toFixed(2)} por pagar
                  </p>
                )}
                {isOrderComplete && (
                  <p className="text-sm text-green-600">✓ Pago completado</p>
                )}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleProcessOrder}
                  disabled={!canProcessOrder || isProcessing}
                  className="min-w-[150px]"
                >
                  {isProcessing
                    ? 'Procesando...'
                    : canProcessOrder
                      ? isInvoicingDeliveryNote
                        ? 'Facturar Orden'
                        : isDeliveryNote
                          ? 'Crear Pre Orden'
                          : 'Procesar Orden'
                      : 'Completar Información'}
                </Button>
              </div>
            </div>

            {/* Información adicional */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Información Importante:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>
                  • Complete la información de la orden (número de factura
                  requerido)
                </li>
                <li>• Configure los métodos de pago hasta cubrir el total</li>
                <li>• Revise el resumen antes de procesar</li>
                <li>• Puede eliminar productos del resumen si es necesario</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
