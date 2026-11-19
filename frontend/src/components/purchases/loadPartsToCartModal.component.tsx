'use client';

import { useState } from 'react';
import { AlertCircle, Download, Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { FileUploadButton } from '@/components/ui/fileUploadButton.component';
import { useToast } from '@/components/ui/use-toast';
import { useAllParts } from '@/hooks/products';
import { useLoadPartsFromExcel } from '@/hooks/purchases/useLoadPartsFromExcel';
import {
  PurchasePartsCartLine,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';
import { downloadPartsTemplate } from '@/utils/partsTemplate.utils';
import { RejectedRowsTable } from './rejectedRowsTable.component';

interface LoadPartsToCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Solo se llama si al menos una fila entró al carrito */
  onConfirm: (
    lines: PurchasePartsCartLine[],
    rejected: RejectedCartRow[]
  ) => void;
}

/**
 * Sube la plantilla de repuestos (la de Inventario → Repuestos, con
 * `cantidad` llenada) y devuelve sus filas como líneas de carrito. No sabe
 * nada de la preorden: el carrito decide qué hacer con las líneas.
 */
export function LoadPartsToCartModal({
  isOpen,
  onClose,
  onConfirm,
}: LoadPartsToCartModalProps) {
  const { toast } = useToast();
  const {
    loadPartsFromExcel,
    isLoadingPartsFromExcel,
    loadPartsFromExcelError,
    resetLoadPartsFromExcel,
  } = useLoadPartsFromExcel();
  // Sin ninguna fila válida el modal no se cierra: muestra por qué
  const [allRejected, setAllRejected] = useState<RejectedCartRow[] | null>(
    null
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // Igual que en el modal de inventario: el catálogo entero solo se pide al
  // tocar "Descargar", no al montar.
  const allParts = useAllParts(
    { pageSize: '100000', page: '1' },
    { enabled: false }
  );

  const handleClose = () => {
    setAllRejected(null);
    resetLoadPartsFromExcel();
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    setAllRejected(null);
    try {
      const { lines, rejected } = await loadPartsFromExcel(file);
      if (lines.length === 0) {
        setAllRejected(rejected);
        return;
      }
      onConfirm(lines, rejected);
      handleClose();
    } catch {
      // El mensaje queda en loadPartsFromExcelError
    }
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cargar productos desde Excel</DialogTitle>
          <DialogDescription>
            Subí la plantilla de repuestos con la columna{' '}
            <span className="font-medium text-foreground">cantidad</span>{' '}
            llenada. Los productos se agregan al carrito con el costo de
            catálogo.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <FileUploadButton
            onFileSelect={handleFileSelect}
            loading={isLoadingPartsFromExcel}
            accept=".xlsx,.xls,.csv"
            showIcon={false}
            className="w-full"
          >
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="p-3 rounded-full bg-gray-200 dark:bg-gray-700">
                <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">
                  {isLoadingPartsFromExcel
                    ? 'Leyendo archivo...'
                    : 'Seleccionar archivo'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  .xlsx, .xls, .csv
                </p>
              </div>
            </div>
          </FileUploadButton>

          {loadPartsFromExcelError && (
            <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                {loadPartsFromExcelError.message ||
                  'No se pudo leer el archivo.'}
              </p>
            </div>
          )}

          {allRejected && (
            <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                {allRejected.length === 0
                  ? 'El archivo no tiene ninguna fila con cantidad.'
                  : 'Ningún producto del archivo se pudo agregar.'}
              </p>
              {allRejected.length > 0 && (
                <RejectedRowsTable rows={allRejected} />
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row items-center justify-between sm:justify-between">
          <Button
            variant="link"
            size="sm"
            className="px-0 text-muted-foreground"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {isDownloading
              ? 'Preparando plantilla...'
              : '¿No tenés la plantilla? Descargar'}
          </Button>
          <Button variant="outline" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
