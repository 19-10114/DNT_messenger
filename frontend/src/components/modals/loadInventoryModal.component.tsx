'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Download,
  Upload,
  PackageSearch,
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
import { useAllParts } from '@/hooks/products';
import { useToast } from '@/components/ui/use-toast';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { TransactionService } from '@/services/transactions/transactions.service';
import {
  downloadPartsTemplate,
  getTodayDateString,
  validateFileDate,
} from '@/utils/partsTemplate.utils';

const transactionService = new TransactionService();

interface LoadInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'download' | 'upload';

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

export function LoadInventoryModal({
  isOpen,
  onClose,
}: LoadInventoryModalProps) {
  const [step, setStep] = useState<Step>('download');
  const [fileError, setFileError] = useState<string | null>(null);
  const [fileOk, setFileOk] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  /**
   * El catálogo completo solo se pide al tocar "Descargar". Este modal está
   * siempre montado en la página de repuestos (abierto o no), así que una
   * consulta automática se traía los 100.000 repuestos en cada visita a la
   * vista, para algo que la mayoría de las veces nadie usa.
   */
  const allParts = useAllParts(
    { pageSize: '100000', page: '1' },
    { enabled: false }
  );
  const { toast } = useToast();
  const token = useToken();
  const currentBranchId = useCurrentBranchId();

  const uploadInventoryPurchase = useMutation({
    mutationFn: (file: File) =>
      transactionService.uploadInventoryPurchase(
        token as string,
        file,
        currentBranchId as number
      ),
  });

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

      downloadPartsTemplate(result.data?.data?.results ?? []);
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
      await uploadInventoryPurchase.mutateAsync(selectedFile);
      toast({
        title: 'Éxito',
        description: 'Compra de inventario cargada correctamente.',
      });
      handleClose();
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo cargar la compra. Intente nuevamente.',
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
                  <PackageSearch className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </div>
                <DialogTitle className="text-base">
                  Cargar Productos
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm">
                Descargue la plantilla con todos los repuestos, complete la
                columna
                <span className="font-medium text-foreground"> cantidad</span> y
                súbala en el siguiente paso.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 rounded-lg border bg-muted/30 p-4 flex flex-col items-center gap-3">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <Download className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium">Plantilla de inventario</p>
                <p className="text-xs text-muted-foreground">
                  El archivo incluirá los campos: id, nombre, sku, modelo y
                  cantidad.
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
                  : `Descargar Inventario_${getTodayDateString()}.xlsx`}
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
                  Subir archivo de inventario
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
                  disabled={uploadInventoryPurchase.isLoading}
                >
                  {uploadInventoryPurchase.isLoading
                    ? 'Cargando...'
                    : 'Cargar Compra'}
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
