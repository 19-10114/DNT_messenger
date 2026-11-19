import React from 'react';
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import DalePlayLogo from '@/../public/DalePlay-logo.png';

interface PrintInvoiceProps {
  clientDetails: {
    name?: string;
    extraField?: string;
    id: string;
  };
  orderDetails: {
    items: { label: string; value: string }[];
  };
}

const PrintInvoice = React.forwardRef<HTMLDivElement, PrintInvoiceProps>(
  ({ clientDetails, orderDetails }, ref) => {
    return (
      <div ref={ref} className="p-8">
        <Card>
          <CardHeader className="relative px-5 py-8 border-b border-gray-300">
            <div className="flex items-center justify-between mb-6">
              <div className="bg-primary items-center justify-center rounded">
                <Image
                  src={DalePlayLogo}
                  alt="Company Logo"
                  width={150}
                  height={150}
                />
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">Recibo</h2>
                <p className="text-sm text-gray-500">
                  Número: {clientDetails.id || clientDetails.name}
                </p>
                <p className="text-sm text-gray-500">DalePlay CA</p>
                <p className="text-sm text-gray-500">RIF J-505863797</p>
              </div>
            </div>
            <div className="flex items-start justify-between">
              {(clientDetails.name || clientDetails.extraField) && (
                <div className="w-full">
                  <CardTitle className="text-lg font-semibold mb-4">
                    Detalles del Cliente
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {clientDetails.name || ''}
                  </CardDescription>
                  <CardDescription className="text-sm">
                    {clientDetails.extraField || ''}
                  </CardDescription>
                </div>
              )}
              <div
                className={
                  clientDetails.name || clientDetails.extraField
                    ? `${'text-right w-1/3'}`
                    : 'text-right w-full'
                }
              >
                <CardDescription className="text-sm">
                  <b>Fecha:</b>{' '}
                  {new Date().toLocaleDateString('es-VE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="py-8">
            <div className="w-full mb-6">
              <CardTitle className="text-xl font-semibold underline">
                Detalle de la orden
              </CardTitle>
              {orderDetails.items.map((item, index) => (
                <div key={index} className="flex justify-between border-b py-2">
                  <b>{item.label}</b>
                  <span>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              Pagos en moneda diferente a lo convenido en el contrato, genera
              ajustes administrativos.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }
);

PrintInvoice.displayName = 'PrintInvoice';

export default PrintInvoice;
