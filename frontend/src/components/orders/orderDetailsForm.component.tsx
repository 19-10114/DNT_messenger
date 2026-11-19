'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { FileText, Building2, Shield } from 'lucide-react';
import {
  useOrderDetails,
  useOrderActions,
  OrderDetails,
  useSelectedBikes,
} from '@/stores/order/order.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useToken } from '@/stores/auth/auth.store';
import { useExchangeRate } from '@/hooks/useExchangeRate';

interface OrderDetailsFormProps {
  isPartsOrder: boolean;
}

export function OrderDetailsForm({ isPartsOrder }: OrderDetailsFormProps) {
  const orderDetails = useOrderDetails();
  const orderActions = useOrderActions();
  const currentBranchId = useCurrentBranchId();
  const selectedBikes = useSelectedBikes();

  const isBikeOrder = selectedBikes.length > 0;

  const token = useToken();
  const {
    rate: bcvRate,
    eurRate,
    usdtRate,
  } = useExchangeRate(token?.toString() || '');

  const [rateType, setRateType] = useState('');

  const handleRateBlur = () => {
    const rate = formData.rate ?? 0;
    setRateType(rate > 0 ? `confirmed_${rate}` : '');
  };

  const [formData, setFormData] = useState<OrderDetails>({
    invoice_number: '',
    type: 'sale',
    notes: '',
    origin_branch: currentBranchId || 0,
    target_branch: 24, // Sucursal de ventas por defecto
    total_invoice_bs: 0,
  });

  useEffect(() => {
    if (orderDetails) {
      setFormData(orderDetails);
    } else if (currentBranchId) {
      const initialData: OrderDetails = {
        invoice_number: '',
        type: 'sale',
        notes: '',
        origin_branch: currentBranchId,
        target_branch: 24,
        total_invoice_bs: 0,
        rate: 0,
      };
      setFormData(initialData);
      orderActions.setOrderDetails(initialData);
    }
  }, [orderDetails, currentBranchId, orderActions]);

  useEffect(() => {
    // `usdtRate` llega async -- en el primer render suele ser 0, así que hay
    // que esperar a que resuelva antes de fijarlo. `!formData.rate` evita
    // pisar una tasa que el usuario ya haya elegido manualmente.
    if (isPartsOrder && usdtRate > 0 && !formData.rate) {
      setRateType('usdt');
      handleInputChange('rate', usdtRate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPartsOrder, usdtRate]);

  const handleInputChange = (
    field: keyof OrderDetails,
    value: string | number
  ) => {
    const updatedData = { ...formData, [field]: value };
    setFormData(updatedData);
    orderActions.updateOrderDetails({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Información de la Orden
        </CardTitle>
        <CardDescription>
          Complete los detalles generales de la orden de venta
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="invoice_number">Número de Factura *</Label>
            <Input
              id="invoice_number"
              type="text"
              placeholder="Ej: FAC-001234"
              value={formData.invoice_number}
              onChange={(e) =>
                handleInputChange('invoice_number', e.target.value)
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="type">Tipo de Orden</Label>
            <Input
              id="type"
              type="text"
              value="Venta"
              disabled
              className="bg-gray-100"
            />
          </div>

          <div>
            <Label htmlFor="target_branch">
              <Building2 className="h-4 w-4 inline mr-1" />
              Sucursal de Destino
            </Label>
            <Input
              id="target_branch"
              type="text"
              value="Ventas"
              disabled
              className="bg-gray-100"
            />
            <p className="text-xs text-gray-500 mt-1"></p>
          </div>

          <div>
            <Label htmlFor="total_invoice_bs">Monto Facturado (Bs.)</Label>
            <Input
              id="total_invoice_bs"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ingrese Bs"
              value={
                formData.total_invoice_bs === 0 ? '' : formData.total_invoice_bs
              }
              onChange={(e) =>
                handleInputChange(
                  'total_invoice_bs',
                  parseFloat(e.target.value) || 0
                )
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto que aparecerá en la factura en bolívares
            </p>
          </div>

          <div>
            <Label htmlFor="total_billed_usd">Total Factura (USD) *</Label>
            <Input
              id="total_billed_usd"
              type="number"
              step="0.01"
              min="0"
              placeholder="Ingrese USD"
              value={
                !formData.total_billed_usd ? '' : formData.total_billed_usd
              }
              onChange={(e) =>
                handleInputChange(
                  'total_billed_usd',
                  parseFloat(e.target.value) || 0
                )
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Monto a facturar en dólares
            </p>
          </div>

          <div>
            <Label htmlFor="rate">Tasa Cambiaria (Bs.) *</Label>
            <div className="space-y-2">
              <Select
                value={rateType}
                onValueChange={(value) => {
                  setRateType(value);
                  if (value === 'dolar_bcv') handleInputChange('rate', bcvRate);
                  else if (value === 'euro_bcv')
                    handleInputChange('rate', eurRate);
                  else if (value === 'usdt')
                    handleInputChange('rate', usdtRate);
                  else if (value === 'personalizada')
                    handleInputChange('rate', 0);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccione un tipo de tasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dolar_bcv">
                    Dolar BCV - {bcvRate.toFixed(2)}
                  </SelectItem>
                  <SelectItem value="euro_bcv">
                    Euro BCV - {eurRate.toFixed(2)}
                  </SelectItem>
                  <SelectItem value="usdt">
                    USDT - {usdtRate.toFixed(2)}
                  </SelectItem>
                  <SelectItem value="personalizada">Personalizada</SelectItem>
                  {(formData.rate ?? 0) > 0 &&
                    rateType.startsWith('confirmed_') && (
                      <SelectItem value={rateType}>{formData.rate}</SelectItem>
                    )}
                </SelectContent>
              </Select>
              {rateType === 'personalizada' && (
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ingrese tasa"
                  value={!formData.rate ? '' : formData.rate}
                  onChange={(e) =>
                    handleInputChange('rate', parseFloat(e.target.value) || 0)
                  }
                  onBlur={handleRateBlur}
                />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Tasa de cambio utilizada para la conversión a bolívares
            </p>
          </div>

          {isBikeOrder && (
            <>
              <div className="md:col-span-2 mt-4">
                <h4 className="font-semibold flex items-center gap-2 text-blue-800 border-b pb-1">
                  <Shield className="h-4 w-4" />
                  Datos Complementarios (Certificado de Origen)
                </h4>
              </div>

              <div>
                <Label htmlFor="dom_reserve">Reserva de Dominio</Label>
                <Input
                  id="dom_reserve"
                  type="text"
                  placeholder="Ej: Si / No / Entidad"
                  value={formData.dom_reserve || ''}
                  onChange={(e) =>
                    handleInputChange('dom_reserve', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="dom_number">Número de Reserva</Label>
                <Input
                  id="dom_number"
                  type="text"
                  placeholder="Número de contrato o reserva"
                  value={formData.dom_number || ''}
                  onChange={(e) =>
                    handleInputChange('dom_number', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="insurance_company">Compañía de Seguros</Label>
                <Input
                  id="insurance_company"
                  type="text"
                  placeholder="Nombre de la aseguradora"
                  value={formData.insurance_company || ''}
                  onChange={(e) =>
                    handleInputChange('insurance_company', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="insurance_number">Número de Póliza</Label>
                <Input
                  id="insurance_number"
                  type="text"
                  placeholder="Número de póliza de seguro"
                  value={formData.insurance_number || ''}
                  onChange={(e) =>
                    handleInputChange('insurance_number', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="insurance_expiration">Vencimiento Seguro</Label>
                <Input
                  id="insurance_expiration"
                  type="date"
                  value={formData.insurance_expiration || ''}
                  onChange={(e) =>
                    handleInputChange('insurance_expiration', e.target.value)
                  }
                />
              </div>

              <div>
                <Label htmlFor="observations">Observaciones Certificado</Label>
                <Input
                  id="observations"
                  type="text"
                  placeholder="Notas para el certificado de origen"
                  value={formData.observations || ''}
                  onChange={(e) =>
                    handleInputChange('observations', e.target.value)
                  }
                />
              </div>
            </>
          )}

          <div className="md:col-span-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Observaciones adicionales sobre la orden..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Nota:</strong> El número de factura debe ser único y seguir
            el formato establecido por la empresa. Las sucursales se identifican
            por su número correspondiente.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
