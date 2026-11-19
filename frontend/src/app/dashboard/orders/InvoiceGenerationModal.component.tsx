'use client';
import React, { useMemo, useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog.component';
import { OrderData } from '@/services/orders/types/Order.type';
import { InvoiceForm } from '@/components/forms/InvoiceForm.component';
import { InvoiceSchemaType } from '@/schemas/invoice.schema';
import { useOrderTransactions, useOrderBilling } from '@/hooks/useOrders';
import { Button } from '@/components/ui/button.component';
import { ArrowLeft, Printer } from 'lucide-react';
import { MotoCandelaInvoicePreview } from '@/components/prinInvoice/MotoCandelaInvoicePreview.component';
import { useReactToPrint } from 'react-to-print';
import { getParsedAmount } from '@/lib/utils';

{
  /*
  Tax data now comes from backend:
  GET /api/orders/billing/:id → { sub_total, iva, igtf, total }
  Frontend only formats and displays.
  */
}

interface Props {
  order: OrderData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InvoiceGenerationModal({
  order,
  open,
  onOpenChange,
}: Props) {
  const [applyIgtf, setApplyIgtf] = useState<boolean>(() => {
    if (!order) return false;
    const foreignCurrencyTypes = ['efectivo_usd', 'zelle', 'binance'];
    const payments = order.paymentMethods || [];
    const sumForeignUsd = payments
      .filter((p) => foreignCurrencyTypes.includes(p.type))
      .reduce((acc, p) => acc + (p.amount || 0), 0);
    return sumForeignUsd > 0;
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } =
    useOrderTransactions(order?.id || 0);
  const { data: billingData, isLoading: isLoadingBilling } = useOrderBilling(
    order?.id || 0,
    applyIgtf
  );
  const [previewData, setPreviewData] = useState<InvoiceSchemaType | null>(
    null
  );
  const componentRef = useRef<HTMLDivElement>(null);

  const pageStyle = `
    @page {
      size: A4;
      margin: 0;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
    }
  `;

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
    documentTitle: `Factura-${order?.id}`,
    pageStyle: pageStyle,
  });

  const defaultValues = useMemo<Partial<InvoiceSchemaType> | undefined>(() => {
    if (!order || !billingData) return undefined;

    // Use the order's creation date as default instead of today's date
    const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();

    // Get the exchange rate for item price conversion
    const exchangeRate = getParsedAmount(order.rate);

    // Tax values from backend
    const baseImponible = billingData.subTotal || 0;
    const ivaAmount = billingData.iva || 0;
    const igtfAmount = billingData.igtf || 0;
    const hasIgtf = igtfAmount > 0;

    // Total a facturar = subTotal + iva (+ igtf if applicable)
    const totalToPay = baseImponible + ivaAmount + igtfAmount;

    // Determine emission place
    let emissionPlace = 'Caracas';
    if (typeof order.originBranch === 'object' && order.originBranch) {
      emissionPlace =
        order.originBranch.billingAddress ||
        order.originBranch.location ||
        'Caracas';
    }

    // Detect Moto (Category 1)
    const motoTransaction = transactions.find(
      (t: any) => t.product?.category === 1
    );
    const isMoto = !!motoTransaction;

    let validItems;

    if (isMoto) {
      const t = motoTransaction;
      const quantity = 1;
      const unitPriceBs = baseImponible;

      const baseDesc = `${t.product?.name || ''}`.trim();
      const parts = [baseDesc || 'MOTO'];
      if (t.color) parts.push(`COLOR: ${t.color}`);
      if (t.plate) parts.push(`PLACA: ${t.plate}`);
      if (t.serialNumber) parts.push(`SERIAL CHASIS: ${t.serialNumber}`);
      if (t.motorSerial) parts.push(`SERIAL MOTOR: ${t.motorSerial}`);

      const description = parts.join('\n').toUpperCase();

      validItems = [
        {
          quantity,
          description,
          unitPrice: unitPriceBs,
          totalPrice: unitPriceBs,
        },
      ];
    } else {
      // Standard Logic for other items - convert each item's USD price to Bs using the rate
      const items = transactions.map((t: any) => {
        const quantity = getParsedAmount(t.quantity) || 1;
        const amountUsd = getParsedAmount(t.amount) || 0;
        const unitPriceBs = exchangeRate ? amountUsd * exchangeRate : amountUsd;

        return {
          quantity,
          description:
            t.product?.name ||
            t.product?.model ||
            t.notes ||
            'Ítem sin descripción',
          unitPrice: unitPriceBs,
          totalPrice: quantity * unitPriceBs,
        };
      });

      validItems = items.length
        ? items
        : [
            {
              quantity: 1,
              description: 'Servicio',
              unitPrice: baseImponible,
              totalPrice: baseImponible,
            },
          ];
    }

    return {
      emissionPlace,
      day: String(orderDate.getDate()).padStart(2, '0'),
      month: String(orderDate.getMonth() + 1).padStart(2, '0'),
      year: String(orderDate.getFullYear()),
      clientName: order.client
        ? `${order.client.firstName} ${order.client.lastName}`
        : '',
      clientId: order.client?.countryId || '',
      clientPhone: order.client?.phoneNumber || '',
      clientAddress: order.client?.address + ' ' + order.client?.city || '',
      items: validItems,
      paymentConditions: 'CONTADO',
      ivaRate: 16,
      igtfRate: 3,
      applyIgtf: hasIgtf,
      ivaAmount: ivaAmount,
      igtfAmount: igtfAmount,
      subtotal: baseImponible,
      totalToPay: totalToPay,
    };
  }, [order, transactions, billingData]);

  const handleSubmit = (data: InvoiceSchemaType) => {
    setPreviewData(data);
  };

  const handleBackToForm = () => {
    setPreviewData(null);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] max-h-[95vh] h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {previewData
              ? 'Previsualización de Factura'
              : `Generar Factura para Orden #${order?.id}`}
          </DialogTitle>
          <DialogDescription>
            {previewData
              ? 'Revise el documento antes de imprimir.'
              : 'Verifique y complete los datos para la factura.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-1 bg-gray-50">
          {isLoadingTransactions || isLoadingBilling ? (
            <div>Cargando datos de facturación...</div>
          ) : previewData ? (
            <div className="flex flex-col gap-4 items-center">
              <div className="w-full flex justify-between px-4">
                <Button
                  variant="outline"
                  onClick={handleBackToForm}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al formulario
                </Button>
                <Button onClick={() => handlePrint()} className="gap-2">
                  <Printer className="w-4 h-4" /> Imprimir
                </Button>
              </div>

              <div className="border shadow-sm">
                <MotoCandelaInvoicePreview
                  ref={componentRef}
                  data={previewData}
                />
              </div>
            </div>
          ) : (
            <InvoiceForm
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isMoto={(defaultValues as any)?._isMoto}
              motoInitialData={(defaultValues as any)?._motoDetails}
              onIgtfChange={setApplyIgtf}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
