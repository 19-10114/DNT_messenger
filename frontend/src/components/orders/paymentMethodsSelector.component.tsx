'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';
import { Badge } from '@/components/ui/badge.component';
import { Separator } from '@/components/ui/separator.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import {
  Trash2,
  Plus,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import {
  usePaymentMethods,
  useOrderActions,
  useOrderDetails,
  PaymentMethod,
} from '@/stores/order/order.store';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { useToken } from '@/stores/auth/auth.store';
import { formatCurrency, formatCurrencyBolivares } from '@/lib/utils';

const PAYMENT_TYPES = [
  {
    value: 'pago_movil',
    label: 'Pago Móvil',
    requiresPhone: true,
    requiresBank: true,
    currency: 'BS',
  },
  { value: 'punto_de_venta', label: 'Punto de Venta', currency: 'BS' },
  { value: 'efectivo_usd', label: 'Efectivo USD', currency: 'USD' },
  { value: 'efectivo_bs', label: 'Efectivo BS', currency: 'BS' },
  { value: 'zelle', label: 'Zelle', requiresAccount: true, currency: 'USD' },
  {
    value: 'binance',
    label: 'Binance',
    requiresAccount: true,
    currency: 'USD',
  },
  {
    value: 'transferencia',
    label: 'Transferencia Bancaria',
    requiresBank: true,
    requiresAccount: true,
  },
  { value: 'abono', label: 'Abono', currency: 'USD' },
] as const;

const CURRENCIES = [
  { value: 'USD', label: 'Dólares (USD)' },
  { value: 'BS', label: 'Bolívares (BS)' },
] as const;

const BANKS = [
  'Banesco',
  'BNC',
  'Mercantil',
  'Venezuela',
  'Provincial',
  'Bicentenario',
  'Tesoro',
  'Exterior',
  'Caroni',
  'Sofitasa',
  'Activo',
  'Bancamiga',
  'Banplus',
  'Mi Banco (R4)',
  'Otros',
] as const;

interface PaymentFormData {
  type: string;
  amount: string;
  amount_bs: string;
  currency: string;
  reference: string;
  origin_bank: string;
  target_bank: string;
  origin_account: string;
  target_account: string;
  phone_number: string;
}

interface PaymentMethodsSelectorProps {
  totalAmount: number;
  onPaymentComplete?: () => void;
}

export function PaymentMethodsSelector({
  totalAmount,
  onPaymentComplete,
}: PaymentMethodsSelectorProps) {
  const paymentMethods = usePaymentMethods();
  const orderActions = useOrderActions();
  const orderDetails = useOrderDetails();
  const token = useToken();
  const {
    rate: exchangeRate,
    eurRate,
    usdtRate,
  } = useExchangeRate(token?.toString() || '');

  const [formData, setFormData] = useState<PaymentFormData>({
    type: '',
    amount: '',
    amount_bs: '',
    currency: 'USD',
    reference: '',
    origin_bank: '',
    target_bank: '',
    origin_account: '',
    target_account: '',
    phone_number: '',
  });

  const [errors, setErrors] = useState<Partial<PaymentFormData>>({});
  const [paymentExceedsError, setPaymentExceedsError] = useState<string>('');

  useEffect(() => {
    if (formData.currency !== 'BS' || !formData.amount) return;
    const rate = orderDetails?.rate ?? 0;
    const calculatedBs =
      rate > 0 ? (parseFloat(formData.amount) * rate).toFixed(2) : '';
    setFormData((prev) => ({ ...prev, amount_bs: calculatedBs }));
  }, [orderDetails?.rate]);

  // Calcular totales
  const totalPaid = paymentMethods.reduce((sum, method) => {
    return sum + (method.amount || 0);
  }, 0);

  const totalPaidBs = paymentMethods.reduce((sum, method) => {
    if (method.currency === 'BS' && method.amount_bs) {
      return sum + method.amount_bs;
    }
    return sum;
  }, 0);

  const remainingAmount = Math.max(0, totalAmount - totalPaid);
  const isFullyPaid = remainingAmount === 0;
  const maxBsAllowed = totalAmount * (exchangeRate || 0) * 2;

  const selectedPaymentType = PAYMENT_TYPES.find(
    (type) => type.value === formData.type
  );

  const validateForm = (): boolean => {
    const newErrors: Partial<PaymentFormData> = {};

    if (!formData.type) newErrors.type = 'Seleccione un tipo de pago';
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Ingrese un monto válido';
    }
    if (!formData.currency) newErrors.currency = 'Seleccione una moneda';

    // Validación específica para pagos en BS
    if (formData.currency === 'BS') {
      if (!formData.amount_bs || parseFloat(formData.amount_bs) <= 0) {
        newErrors.amount_bs = 'Ingrese un monto en BS válido';
      }
    }

    // Validaciones específicas por tipo de pago
    if (selectedPaymentType) {
      if (
        'requiresPhone' in selectedPaymentType &&
        selectedPaymentType.requiresPhone &&
        !formData.phone_number
      ) {
        newErrors.phone_number = 'Número de teléfono requerido';
      }
      if (
        'requiresBank' in selectedPaymentType &&
        selectedPaymentType.requiresBank &&
        !formData.origin_bank
      ) {
        newErrors.origin_bank = 'Banco de origen requerido';
      }
      if (
        'requiresAccount' in selectedPaymentType &&
        selectedPaymentType.requiresAccount &&
        !formData.origin_account
      ) {
        newErrors.origin_account = 'Cuenta de origen requerida';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddPaymentMethod = () => {
    if (!validateForm()) return;

    const amount = parseFloat(formData.amount);

    // Calcular lo que quedaría después de agregar este pago
    const wouldBeTotalPaid = totalPaid + amount;

    // Validar que no exceda el total a pagar
    if (wouldBeTotalPaid > totalAmount + 0.1) {
      setPaymentExceedsError(
        `ERROR AL AGREGAR EL METODO DE PAGO:
        El monto agregado haría que el total pagado (${formatCurrency(wouldBeTotalPaid)}) exceda el total a pagar (${formatCurrency(totalAmount)}) por ${formatCurrency(wouldBeTotalPaid - totalAmount)}. 
        Verifica: MONTO, TIPO DE PAGO Y MONEDA.`
      );
      return;
    }

    if (formData.currency === 'BS' && formData.amount_bs) {
      const amountBs = parseFloat(formData.amount_bs);
      const wouldBeTotalPaidBs = totalPaidBs + amountBs;

      if (wouldBeTotalPaidBs > maxBsAllowed + 0.1) {
        // +0.1 para margen por decimales
        setPaymentExceedsError(
          `ERROR AL AGREGAR EL METODO DE PAGO EN BS:
          El monto en BS (${formatCurrencyBolivares(amountBs)}) haría que el total pagado en BS 
          (${formatCurrencyBolivares(wouldBeTotalPaidBs)}) exceda el máximo permitido (${formatCurrencyBolivares(maxBsAllowed)}).`
        );
        return;
      }
    }

    const newPaymentMethod: PaymentMethod = {
      id: Date.now().toString(),
      type: formData.type as PaymentMethod['type'],
      amount,
      amount_bs:
        formData.currency === 'BS' && formData.amount_bs
          ? parseFloat(formData.amount_bs)
          : undefined,
      currency: formData.currency as 'USD' | 'BS',
      reference: formData.reference,
      origin_bank: formData.origin_bank,
      target_bank: formData.target_bank,
      origin_account: formData.origin_account,
      target_account: formData.target_account,
      phone_number: formData.phone_number,
    };

    orderActions.addTotalPaymentMethod(newPaymentMethod);

    // Limpiar formulario
    setFormData({
      type: '',
      amount: '',
      amount_bs: '',
      currency: 'USD',
      reference: '',
      origin_bank: '',
      target_bank: '',
      origin_account: '',
      target_account: '',
      phone_number: '',
    });
    setErrors({});
    setPaymentExceedsError('');

    // Notificar si el pago está completo
    if (onPaymentComplete && remainingAmount - amount <= 0) {
      onPaymentComplete();
    }
  };

  const handleRemovePaymentMethod = (paymentMethodId: string) => {
    orderActions.removeTotalPaymentMethod(paymentMethodId);
    setPaymentExceedsError('');
  };

  const updateFormData = (field: keyof PaymentFormData, value: string) => {
    if (field === 'amount' && formData.currency === 'BS') {
      const rate = orderDetails?.rate || 0;
      const calculatedBs =
        rate > 0 ? (parseFloat(value) * rate).toFixed(2) : '';
      setFormData((prev) => ({
        ...prev,
        amount: value,
        amount_bs: calculatedBs,
      }));
      setPaymentExceedsError('');
      if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
      return;
    }

    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (field === 'amount') {
      setPaymentExceedsError('');
    }

    if (field === 'type') {
      const paymentType = PAYMENT_TYPES.find((type) => type.value === value);
      if (paymentType && 'currency' in paymentType) {
        setFormData((prev) => ({ ...prev, currency: paymentType.currency! }));
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Métodos de Pago
        </CardTitle>
        <CardDescription>
          Configure los métodos de pago para completar la orden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Estado del Pago */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total a Pagar</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalAmount)}
              </p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-600">Total a Pagar (BCV)</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency((totalAmount * usdtRate) / exchangeRate)}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-600">Monto Pagado</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-gray-600">Monto Restante</p>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(remainingAmount)}
              </p>
            </div>
          </div>

          {/* Estado de Completitud */}
          {isFullyPaid ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-green-700 font-medium">
                ¡Pago completado! La orden está lista para procesar.
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-700">
                Faltan <strong>{formatCurrency(remainingAmount)}</strong> por
                pagar
              </p>
            </div>
          )}

          {/* Mensaje de error si el pago excede el total */}
          {paymentExceedsError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium whitespace-pre-line">
                  {paymentExceedsError}
                </p>
              </div>
            </div>
          )}

          {/* Lista de Métodos de Pago Configurados */}
          {paymentMethods.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">
                Métodos de Pago Configurados
              </h4>
              <div className="space-y-3">
                {paymentMethods.map((method) => {
                  const paymentType = PAYMENT_TYPES.find(
                    (type) => type.value === method.type
                  );
                  return (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline">
                            {paymentType?.label || method.type}
                          </Badge>
                          <span className="font-semibold text-lg text-green-600">
                            {formatCurrency(method.amount || 0)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {method.reference && (
                            <p>Referencia: {method.reference}</p>
                          )}
                          {method.phone_number && (
                            <p>Teléfono: {method.phone_number}</p>
                          )}
                          {method.origin_bank && (
                            <p>Banco: {method.origin_bank}</p>
                          )}
                          {method.origin_account && (
                            <p>Cuenta: {method.origin_account}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemovePaymentMethod(method.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Separator />

          {/* Formulario para Agregar Método de Pago */}
          {!isFullyPaid && (
            <div>
              <h4 className="font-semibold mb-4">Agregar Método de Pago</h4>
              <div className="space-y-4">
                {/* Tipo de Pago y Moneda */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Tipo de Pago *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => updateFormData('type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && (
                      <p className="text-sm text-red-600 mt-1">{errors.type}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="currency">Moneda *</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value) =>
                        updateFormData('currency', value)
                      }
                      disabled={
                        !!(
                          selectedPaymentType &&
                          'currency' in selectedPaymentType &&
                          selectedPaymentType.currency
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.currency && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.currency}
                      </p>
                    )}
                  </div>
                </div>

                {/* Monto y Referencia */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">
                      {formData.currency === 'BS'
                        ? 'Monto en USD *'
                        : 'Monto *'}
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => updateFormData('amount', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs text-blue-600"
                      onClick={() => {
                        const remaining = Math.max(0, totalAmount - totalPaid);
                        updateFormData('amount', remaining.toFixed(2));
                      }}
                    >
                      Agregar restante (${remainingAmount.toFixed(2)})
                    </Button>
                    {errors.amount && (
                      <p className="text-sm text-red-600 mt-1">
                        {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Campo amount_bs solo para pagos en BS */}
                  {formData.currency === 'BS' && (
                    <div>
                      <Label htmlFor="amount_bs">Monto en BS *</Label>
                      <Input
                        id="amount_bs"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={formData.amount_bs}
                        onChange={(e) =>
                          updateFormData('amount_bs', e.target.value)
                        }
                      />
                      {errors.amount_bs && (
                        <p className="text-sm text-red-600 mt-1">
                          {errors.amount_bs}
                        </p>
                      )}
                    </div>
                  )}

                  <div>
                    <Label htmlFor="reference">Referencia</Label>
                    <Input
                      id="reference"
                      placeholder="Número de referencia"
                      value={formData.reference}
                      onChange={(e) =>
                        updateFormData('reference', e.target.value)
                      }
                    />
                  </div>
                </div>

                {/* Campos específicos según el tipo de pago */}
                {selectedPaymentType && (
                  <div className="space-y-4">
                    {/* Teléfono (para Pago Móvil) */}
                    {'requiresPhone' in selectedPaymentType &&
                      selectedPaymentType.requiresPhone && (
                        <div>
                          <Label htmlFor="phone_number">
                            Número de Teléfono *
                          </Label>
                          <Input
                            id="phone_number"
                            placeholder="0414-1234567"
                            value={formData.phone_number}
                            onChange={(e) =>
                              updateFormData('phone_number', e.target.value)
                            }
                          />
                          {errors.phone_number && (
                            <p className="text-sm text-red-600 mt-1">
                              {errors.phone_number}
                            </p>
                          )}
                        </div>
                      )}

                    {/* Bancos */}
                    {'requiresBank' in selectedPaymentType &&
                      selectedPaymentType.requiresBank && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="origin_bank">
                              Banco de Origen *
                            </Label>
                            <Select
                              value={formData.origin_bank}
                              onValueChange={(value) =>
                                updateFormData('origin_bank', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar banco" />
                              </SelectTrigger>
                              <SelectContent>
                                {BANKS.map((bank) => (
                                  <SelectItem key={bank} value={bank}>
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.origin_bank && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.origin_bank}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="target_bank">
                              Banco de Destino
                            </Label>
                            <Select
                              value={formData.target_bank}
                              onValueChange={(value) =>
                                updateFormData('target_bank', value)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar banco" />
                              </SelectTrigger>
                              <SelectContent>
                                {BANKS.map((bank) => (
                                  <SelectItem key={bank} value={bank}>
                                    {bank}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}

                    {/* Cuentas */}
                    {'requiresAccount' in selectedPaymentType &&
                      selectedPaymentType.requiresAccount && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="origin_account">
                              Cuenta de Origen *
                            </Label>
                            <Input
                              id="origin_account"
                              placeholder="Número de cuenta"
                              value={formData.origin_account}
                              onChange={(e) =>
                                updateFormData('origin_account', e.target.value)
                              }
                            />
                            {errors.origin_account && (
                              <p className="text-sm text-red-600 mt-1">
                                {errors.origin_account}
                              </p>
                            )}
                          </div>

                          <div>
                            <Label htmlFor="target_account">
                              Cuenta de Destino
                            </Label>
                            <Input
                              id="target_account"
                              placeholder="Número de cuenta destino"
                              value={formData.target_account}
                              onChange={(e) =>
                                updateFormData('target_account', e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                  </div>
                )}

                {/* Botón para agregar */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddPaymentMethod}
                    disabled={!formData.type || !formData.amount}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Agregar Método de Pago
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
