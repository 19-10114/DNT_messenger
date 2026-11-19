'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Download,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { FileUploadButton } from '@/components/ui/fileUploadButton.component';
import { useAllParts, useBulkUpdatePartPrices } from '@/hooks/products';
import { useToast } from '@/components/ui/use-toast';
import { BikeProduct } from '@/services/products/types/BikeProducts.type';

interface UpdatePricesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** `BikeProduct` no declara `price`, pero el endpoint de repuestos sí lo manda. */
type PartWithPrice = BikeProduct & { price?: number };

type Step = 'download' | 'upload';

function getTodayDateString(): string {
  const today = new Date();
  const yyyy = today.getFullYear().toString();
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function validateFileDate(filename: string): {
  valid: boolean;
  error?: string;
} {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    return {
      valid: false,
      error:
        'El nombre del archivo no contiene una fecha en formato aaaa-mm-dd.',
    };
  }

  const [yyyy, mm, dd] = match[1].split('-').map(Number);
  const fileDate = new Date(yyyy, mm - 1, dd);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fileDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - fileDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { valid: false, error: 'La fecha del archivo es futura.' };
  }
  if (diffDays > 4) {
    return {
      valid: false,
      error: `La fecha del archivo (${match[1]}) tiene más de 4 días de antigüedad. Por favor descargue una plantilla nueva.`,
    };
  }

  return { valid: true };
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-2">
      <div
        className={`flex items-center gap-2 text-xs font-medium ${current === 'download' ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${current === 'download' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}
        >
          1
        </div>
        Descargar
      </div>
      <div className="h-px w-8 bg-border" />
      <div
        className={`flex items-center gap-2 text-xs font-medium ${current === 'upload' ? 'text-foreground' : 'text-muted-foreground'}`}
      >
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${current === 'upload' ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground'}`}
        >
          2
        </div>
        Subir
      </div>
    </div>
  );
}

export function UpdatePricesModal({ isOpen, onClose }: UpdatePricesModalProps) {
  const [step, setStep] = useState<Step>('download');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileOk, setFileOk] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * El catálogo completo solo se pide al tocar "Descargar". Este modal está
   * siempre montado en la página de productos (abierto o no), así que una
   * consulta automática se traía los 100.000 repuestos en cada visita a la
   * vista, para algo que la mayoría de las veces nadie usa.
   */
  const allParts = useAllParts(
    { pageSize: '100000', page: '1' },
    { enabled: false }
  );
  const bulkUpdatePartPrices = useBulkUpdatePartPrices();
  const { toast } = useToast();

  const handleClose = () => {
    setStep('download');
    setFileError(null);
    setFileOk(null);
    setSelectedFile(null);
    onClose();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const result = await allParts.refetch();
      if (result.isError) {
        toast({
          title: 'Error',
          description: 'No se pudo obtener el listado de repuestos.',
          variant: 'destructive',
        });
        return;
      }

      const parts = (result.data?.data?.results ?? []) as PartWithPrice[];
      const headers = [
        'id',
        'sku',
        'nombre',
        'modelo',
        'precio',
        'nuevo precio',
      ];
      const rows = parts.map((p) => [
        p.id,
        p.sku,
        p.name,
        p.model,
        p.price,
        '',
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Precios');
      XLSX.writeFile(wb, `Precios_${getTodayDateString()}.xlsx`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setFileError(null);
    setFileOk(null);
    setSelectedFile(null);
    const result = validateFileDate(file.name);
    if (!result.valid) {
      setFileError(result.error ?? 'Archivo inválido.');
      return;
    }
    setSelectedFile(file);
    setFileOk(`Archivo "${file.name}" listo para procesar.`);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await bulkUpdatePartPrices.mutateAsync(selectedFile);
      toast({
        title: 'Éxito',
        description: 'Precios actualizados correctamente.',
      });
      handleClose();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar los precios. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'download' ? (
          <>
            <DialogHeader className="space-y-3">
              <StepIndicator current="download" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gray-300 dark:bg-gray-600">
                  <FileSpreadsheet className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <DialogTitle className="text-base">
                  Actualizar Precios
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Descargue la plantilla con todos los repuestos, complete la
                columna
                <span className="font-medium text-foreground">
                  {' '}
                  nuevo precio
                </span>{' '}
                y súbala en el siguiente paso.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 rounded-lg border bg-muted/30 p-4 flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Plantilla de precios</p>
                <p className="text-xs text-muted-foreground">
                  El archivo incluirá los campos: id, sku, nombre, modelo,
                  precio y nuevo precio.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full"
              >
                <Download className="w-3.5 h-3.5 mr-2" />
                {isDownloading
                  ? 'Preparando descarga...'
                  : `Descargar Precios_${getTodayDateString()}.xlsx`}
              </Button>
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button variant="ghost" size="icon" disabled>
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setStep('upload')}
              >
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="space-y-3">
              <StepIndicator current="upload" />
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-gray-300 dark:bg-gray-600">
                  <Upload className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <DialogTitle className="text-base">
                  Subir archivo de precios
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Seleccione el archivo completado. La fecha del archivo no puede
                tener más de{' '}
                <span className="font-medium text-foreground">4 días</span> de
                antigüedad.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 space-y-3">
              <FileUploadButton
                onFileSelect={handleFileSelect}
                accept=".xlsx,.xls,.csv"
                showIcon={false}
                className="w-full"
              >
                <div className="flex flex-col items-center gap-2 py-2">
                  <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                    <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">Seleccionar archivo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      .xlsx, .xls, .csv
                    </p>
                  </div>
                </div>
              </FileUploadButton>

              {fileError && (
                <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive">{fileError}</p>
                </div>
              )}
              {fileOk && (
                <div className="flex items-start gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-800 dark:bg-green-950/30">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5 dark:text-green-400" />
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {fileOk}
                  </p>
                </div>
              )}

              {selectedFile && (
                <Button
                  className="w-full"
                  onClick={handleUpload}
                  disabled={bulkUpdatePartPrices.isLoading}
                >
                  {bulkUpdatePartPrices.isLoading
                    ? 'Actualizando...'
                    : 'Actualizar Precios'}
                </Button>
              )}
            </div>

            <DialogFooter className="flex-row justify-between sm:justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setStep('download');
                  setFileError(null);
                  setFileOk(null);
                  setSelectedFile(null);
                }}
              >
                <ChevronLeft className="w-5 h-5" strokeWidth={2.5} />
              </Button>
              <Button variant="ghost" size="icon" disabled>
                <ChevronRight className="w-5 h-5" strokeWidth={2.5} />
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
