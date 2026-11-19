'use client';

import { useMemo, useState } from 'react';
import { AlertCircle, FileText, Upload } from 'lucide-react';
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
import { usePasteImage } from '@/hooks/purchases/usePasteImage';
import { Progress } from '@/components/ui/progress.component';
import {
  INVOICE_READ_CANCELLED,
  useReadInvoice,
} from '@/hooks/purchases/useReadInvoice';
import {
  PurchasePartsCartLine,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';
import {
  applyInvoiceReview,
  buildInvoiceReview,
  defaultDecisions,
  InvoicePageResult,
  InvoiceReview,
  InvoiceReviewDecision,
  needsReview,
} from '@/utils/invoiceCart.utils';
import { INVOICE_FILE_ACCEPT } from '@/utils/invoicePdf.utils';
import { InvoiceReviewStep } from './invoiceReviewStep.component';
import { RejectedRowsTable } from './rejectedRowsTable.component';

interface UploadInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Solo se llama si al menos una línea entra al carrito */
  onConfirm: (
    lines: PurchasePartsCartLine[],
    rejected: RejectedCartRow[]
  ) => void;
}

type Step = 'select' | 'reading' | 'review';

interface ReadState {
  pages: InvoicePageResult[];
  review: InvoiceReview;
}

/**
 * "Subir Factura": la factura escaneada de Empire Keeway (PDF, o una foto de
 * una página) se lee página por página y sus líneas se devuelven listas para
 * el carrito. Si todo cuadró, no pregunta nada; si no, muestra solo lo dudoso.
 * No sabe nada de la preorden: el carrito decide qué hacer con las líneas.
 */
export function UploadInvoiceModal({
  isOpen,
  onClose,
  onConfirm,
}: UploadInvoiceModalProps) {
  const {
    readInvoice,
    readInvoiceError,
    invoiceReadProgress,
    resetReadInvoice,
    closeInvoice,
  } = useReadInvoice();
  const [step, setStep] = useState<Step>('select');
  const [read, setRead] = useState<ReadState | null>(null);
  const [decisions, setDecisions] = useState<
    Record<string, InvoiceReviewDecision>
  >({});
  const [failure, setFailure] = useState<string | null>(null);

  const result = useMemo(
    () => (read ? applyInvoiceReview(read.pages, decisions) : null),
    [read, decisions]
  );
  const previews = useMemo(
    () =>
      Object.fromEntries(
        (read?.pages ?? []).map((page) => [page.page, page.previewUrl])
      ),
    [read]
  );

  const reset = () => {
    closeInvoice();
    resetReadInvoice();
    setStep('select');
    setRead(null);
    setDecisions({});
    setFailure(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = (
    lines: PurchasePartsCartLine[],
    rejected: RejectedCartRow[]
  ) => {
    onConfirm(lines, rejected);
    handleClose();
  };

  // Otra factura para la misma preorden: lo leído pasa al carrito y el modal
  // queda esperando el siguiente archivo.
  const finishAndContinue = (
    lines: PurchasePartsCartLine[],
    rejected: RejectedCartRow[]
  ) => {
    onConfirm(lines, rejected);
    reset();
  };

  const handleFileSelect = async (file: File) => {
    setFailure(null);
    setStep('reading');
    let pages: InvoicePageResult[];
    try {
      pages = await readInvoice(file);
    } catch (error) {
      // Cerrado a mitad de lectura: no dejar el aviso para la próxima vez.
      if (error instanceof Error && error.message === INVOICE_READ_CANCELLED) {
        resetReadInvoice();
      }
      setStep('select');
      return; // si no, el mensaje queda en readInvoiceError
    }

    const readPages = pages.filter((page) => page.data);
    if (readPages.length === 0) {
      // Ninguna página llegó: casi siempre es el lector caído, no la factura.
      setFailure(pages[0]?.error ?? 'No se pudo leer ninguna página.');
      setStep('select');
      return;
    }

    const review = buildInvoiceReview(pages);
    const initial = defaultDecisions(review);
    if (!needsReview(review)) {
      const { lines, rejected } = applyInvoiceReview(pages, initial);
      if (lines.length > 0) {
        finish(lines, rejected);
        return;
      }
    }
    setRead({ pages, review });
    setDecisions(initial);
    setStep('review');
  };

  // Captura o foto en el portapapeles: Ctrl+V con el modal esperando archivo.
  usePasteImage(isOpen && step === 'select', handleFileSelect);

  const lineCount = result?.lines.length ?? 0;
  const pageCount = read?.pages.length ?? 0;
  const errorMessage =
    failure ?? (readInvoiceError ? readInvoiceError.message : null);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        width={step === 'review' ? '880px' : '480px'}
        maxHeight="90vh"
        className="max-w-[95vw] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Subir factura
          </DialogTitle>
          <DialogDescription>
            {step === 'review'
              ? `Se leyeron ${pageCount} página${pageCount === 1 ? '' : 's'}. ` +
                `${read?.review.autoLineCount ?? 0} líneas entran directo; ` +
                'revisá lo de abajo antes de agregarlas.'
              : 'Subí el PDF escaneado de las facturas de Empire Keeway (o una foto de una página). ' +
                'Los repuestos se agregan al carrito con el costo de catálogo.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'select' && (
          <div className="space-y-3">
            <FileUploadButton
              onFileSelect={handleFileSelect}
              accept={INVOICE_FILE_ACCEPT}
              showIcon={false}
              showButton={false}
              className="w-full"
            >
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="rounded-full bg-gray-200 p-3 dark:bg-gray-700">
                  <Upload className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">Seleccionar factura</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    .pdf, .jpg, .png · o pegá una imagen con Ctrl+V
                  </p>
                </div>
              </div>
            </FileUploadButton>
            {errorMessage && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{errorMessage}</p>
              </div>
            )}
          </div>
        )}

        {step === 'reading' && (
          <div className="space-y-3 py-6">
            <p className="text-center text-sm font-medium">
              {invoiceReadProgress.total === 0
                ? 'Abriendo archivo...'
                : `Leyendo página ${Math.min(
                    invoiceReadProgress.done + 1,
                    invoiceReadProgress.total
                  )} de ${invoiceReadProgress.total}...`}
            </p>
            <Progress
              value={invoiceReadProgress.done}
              max={invoiceReadProgress.total || 1}
              aria-label="Progreso de lectura de la factura"
            />
            <p className="text-center text-xs text-muted-foreground">
              Puede tardar unos segundos por página.
            </p>
          </div>
        )}

        {step === 'review' && read && (
          <div className="space-y-4">
            <InvoiceReviewStep
              review={read.review}
              decisions={decisions}
              onChange={(key, decision) =>
                setDecisions((prev) => ({ ...prev, [key]: decision }))
              }
              previews={previews}
            />
            {lineCount === 0 && result && result.rejected.length > 0 ? (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Ningún repuesto de la factura se puede agregar.
                </p>
                <RejectedRowsTable rows={result.rejected} />
              </div>
            ) : (
              read.review.rejectedLineCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {read.review.rejectedLineCount === 1
                    ? '1 línea no está en el catálogo o no es un repuesto: '
                    : `${read.review.rejectedLineCount} líneas no están en el catálogo o no son repuestos: `}
                  aparecen en el aviso del carrito, con botón para copiarlas.
                </p>
              )
            )}
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {step === 'review' ? (
            <>
              <Button variant="ghost" onClick={reset}>
                Cambiar archivo
              </Button>
              <div className="flex flex-wrap justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  disabled={lineCount === 0}
                  onClick={() =>
                    result && finishAndContinue(result.lines, result.rejected)
                  }
                >
                  Agregar y subir otra factura
                </Button>
                <Button
                  disabled={lineCount === 0}
                  onClick={() =>
                    result && finish(result.lines, result.rejected)
                  }
                >
                  Agregar {lineCount} producto{lineCount === 1 ? '' : 's'} al
                  carrito
                </Button>
              </div>
            </>
          ) : (
            <Button variant="outline" className="ml-auto" onClick={handleClose}>
              {step === 'reading' ? 'Cancelar' : 'Cerrar'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
