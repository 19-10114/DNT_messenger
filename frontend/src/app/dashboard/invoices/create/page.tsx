'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { InvoiceForm } from '@/components/forms/InvoiceForm.component';
import FacturaDocument from '@/components/prinInvoice/FacturaDocument';
import { InvoiceSchemaType } from '@/schemas/invoice.schema';
import { Button } from '@/components/ui/button.component';
import { usePDFProcessor } from '@/hooks/usePDFProcessor';

// Dynamically import PDFViewer to avoid SSR issues
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => <p>Cargando previsualización...</p>,
  }
);

export default function CreateInvoicePage() {
  const [previewData, setPreviewData] = useState<InvoiceSchemaType | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);
  const { generatePdf } = usePDFProcessor();

  const handleFormSubmit = (data: InvoiceSchemaType) => {
    setPreviewData(data);
    setShowPreview(true);
  };

  const handlePrint = async () => {
    if (!previewData) return;
    try {
      await generatePdf(
        <FacturaDocument data={previewData} />,
        `factura-${previewData.clientId}-${Date.now()}.pdf`
      );
    } catch (error) {
      console.error('Error al descargar PDF:', error);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Generar Factura</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <InvoiceForm onSubmit={handleFormSubmit} />
        </div>

        <div>
          {previewData ? (
            <div className="sticky top-4 border rounded-lg p-4 bg-white shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Vista Previa</h2>
              <div className="h-[600px] w-full bg-gray-100 border mb-4">
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                  <FacturaDocument data={previewData} />
                </PDFViewer>
              </div>
              <div className="flex gap-4">
                <Button onClick={handlePrint} className="w-full">
                  Descargar / Imprimir
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed rounded-lg p-12">
              <p>Completa el formulario para ver la previsualización aquí.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
