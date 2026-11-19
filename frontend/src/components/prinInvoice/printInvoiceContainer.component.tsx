import React, { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import PrintInvoice from './printInvoice.component';
import { Button } from '../ui/button.component';
import { PrinterIcon } from 'lucide-react';

interface PrintInvoiceContainerProps {
  clientDetails: {
    name?: string;
    extraField?: string;
    id: string;
  };
  orderDetails: {
    items: { label: string; value: string }[];
  };
}

const PrintInvoiceContainer: React.FC<PrintInvoiceContainerProps> = ({
  clientDetails,
  orderDetails,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    documentTitle: 'Factura',
    onAfterPrint: () => alert('Factura impresa correctamente'),
    contentRef: printRef,
  });

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handlePrint as any}
          className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
        >
          <PrinterIcon />
        </Button>
      </div>
      <div>
        <PrintInvoice
          ref={printRef}
          clientDetails={clientDetails}
          orderDetails={orderDetails}
        />
      </div>
    </div>
  );
};

export default PrintInvoiceContainer;
