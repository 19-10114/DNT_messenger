import React, { forwardRef } from 'react';
import { InvoiceSchemaType } from '@/schemas/invoice.schema';
import { formatNumber } from '@/lib/utils';

interface MotoCandelaInvoicePreviewProps {
  data: InvoiceSchemaType;
}

export const MotoCandelaInvoicePreview = forwardRef<
  HTMLDivElement,
  MotoCandelaInvoicePreviewProps
>(({ data }, ref) => {
  // Helper for formatting absolute positions and ensuring uppercase text
  const TextOverlay = ({
    text,
    top,
    left,
    width,
    align = 'left',
    className = '',
    multiline = false,
  }: {
    text: string | number;
    top: string;
    left: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    className?: string;
    multiline?: boolean;
  }) => {
    const displayText = typeof text === 'string' ? text.toUpperCase() : text;

    return (
      <div
        className={`absolute text-sm font-medium text-gray-900 ${className}`}
        style={{
          top,
          left,
          width,
          textAlign: align,
          whiteSpace: multiline ? 'normal' : 'nowrap',
          overflow: multiline ? 'visible' : 'hidden',
          textOverflow: multiline ? 'clip' : 'ellipsis',
          lineHeight: multiline ? '1.1' : undefined,
        }}
      >
        {displayText}
      </div>
    );
  };

  return (
    <div
      ref={ref}
      className="relative w-[794px] h-[1123px] bg-white shadow-lg print:shadow-none overflow-hidden mx-auto"
    >
      {/* Background Image - Hidden in print for pre-printed forms */}
      <img
        src="/templates/moto candela factura.jpeg"
        alt="Factura Template"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none print:hidden"
      />

      {/* --- HEADER --- */}
      {/* Lugar de Emision */}
      <TextOverlay
        text={data.emissionPlace}
        top="14.5%"
        left="21%"
        width="15%"
        align="center"
      />
      {/* Fecha de Emision */}
      <TextOverlay
        text={data.day}
        top="14.5%"
        left="35.5%"
        width="4%"
        align="center"
      />
      <TextOverlay
        text={data.month}
        top="14.5%"
        left="40%"
        width="4%"
        align="center"
      />
      <TextOverlay
        text={data.year}
        top="14.5%"
        left="45%"
        width="5%"
        align="center"
      />

      {/* --- CLIENT INFO --- */}
      {/* Nombre o Razón Social */}
      <TextOverlay text={data.clientName} top="17%" left="20%" width="75%" />
      {/* Domicilio Fiscal */}
      <TextOverlay
        text={data.clientAddress || ''}
        top="19.5%"
        left="13%"
        width="60%"
        multiline={true}
      />
      {/* Teléfono de Contacto */}
      <TextOverlay
        text={data.clientPhone || ''}
        top="21.9%"
        left="55%"
        width="25%"
      />
      {/* C.I. / RIF del Cliente */}
      <TextOverlay text={data.clientId} top="26%" left="10%" width="20%" />
      {/* Orden de Entrega / Guía de Despacho */}
      <TextOverlay
        text={data.deliveryOrder || ''}
        top="26%"
        left="20%"
        width="15%"
        align="center"
      />

      {/* Condiciones de Pago */}
      <TextOverlay
        text={data.paymentConditions || ''}
        top="26%"
        left="50%"
        width="25%"
      />

      {/* --- ITEMS GRID --- */}
      <div
        className="absolute w-full"
        style={{
          top: '31%',
          left: '0',
          height: '42%', // Space available for items in the template
          paddingLeft: '6%',
          paddingRight: '6%',
        }}
      >
        {data.items.map((item, index) => (
          <div
            key={index}
            className="flex text-sm font-medium mb-2 items-start"
          >
            {/* Cantidad */}
            <div className="w-[6%] text-center">{item.quantity}</div>
            {/* Descripción (En Mayúsculas) */}
            <div className="w-[32%] px-2 whitespace-pre-wrap leading-tight">
              {item.description.toUpperCase()}
            </div>
            {/* Precio Unitario */}
            <div className="w-[18%] text-right px-2">
              {formatNumber(Number(item.unitPrice))}
            </div>
            {/* Total por Ítem */}
            <div className="w-[15%] text-right px-2">
              {formatNumber(Number(item.totalPrice))}
            </div>
          </div>
        ))}
      </div>

      {/* --- TOTALS SECTION --- */}
      {/* Sub-Total */}
      <TextOverlay
        text={formatNumber(data.subtotal)}
        top="49.5%"
        left="50%"
        width="16%"
        align="right"
      />

      {/* IVA (Base Imponible) */}
      <TextOverlay
        text={`${data.ivaRate}`}
        top="51.5%"
        left="46%"
        width="5%"
        align="center"
      />
      <TextOverlay
        text={formatNumber(data.ivaAmount)}
        top="51.5%"
        left="50%"
        width="16%"
        align="right"
      />

      {/* Total a Facturar (Subtotal + IVA) */}
      <TextOverlay
        text={formatNumber(data.subtotal + data.ivaAmount)}
        top="53.5%"
        left="50%"
        width="16%"
        align="right"
      />

      {/* IGTF (Impuesto a Grandes Transacciones Financieras) */}
      {(data.applyIgtf || data.igtfAmount > 0) && (
        <>
          <TextOverlay
            text={`${data.igtfRate}`}
            top="55.5%"
            left="46%"
            width="5%"
            align="center"
          />
          <TextOverlay
            text={formatNumber(data.igtfAmount)}
            top="55.5%"
            left="50%"
            width="16%"
            align="right"
          />
        </>
      )}

      {/* TOTAL A PAGAR (Final) */}
      <TextOverlay
        text={formatNumber(data.totalToPay)}
        top="57.5%"
        left="50%"
        width="16%"
        align="right"
        className="font-bold text-base"
      />
    </div>
  );
});

MotoCandelaInvoicePreview.displayName = 'MotoCandelaInvoicePreview';
