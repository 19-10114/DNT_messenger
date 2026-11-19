'use client';

import { useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
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
  getApprovalErrorStatus,
  normalizeApprovalNumber,
} from '@/components/approvals/approvals.utils';
import { APPROVAL_LOOKUP_QUERY_KEY } from '@/hooks/approvals/approvalsQueryKeys';
import {
  INVOICE_READ_CANCELLED,
  useReadInvoice,
} from '@/hooks/purchases/useReadInvoice';
import { PurchaseBikeCartLine } from '@/models/purchaseBikeCart.model';
import { RejectedCartRow } from '@/models/purchasePartsCart.model';
import { ApprovalsService } from '@/services/approvals/approvals.service';
import { InvoiceBikePage } from '@/services/purchases/types/InvoiceReader.type';
import { useToken } from '@/stores/auth/auth.store';
import {
  applyBikeInvoiceReview,
  ApprovalLookupState,
  approvalProblems,
  BikeInvoiceReview,
  BikeUnitDraft,
  buildBikeInvoiceReview,
  defaultBikeDrafts,
  defaultPageApprovals,
  draftProblem,
  duplicatedDrafts,
} from '@/utils/invoiceBikeCart.utils';
import { InvoicePageResult } from '@/utils/invoiceCart.utils';
import { INVOICE_FILE_ACCEPT } from '@/utils/invoicePdf.utils';
import { BikeInvoiceReviewStep } from './bikeInvoiceReviewStep.component';
import { RejectedRowsTable } from './rejectedRowsTable.component';

const approvalsService = new ApprovalsService();

interface UploadBikeInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Lo que ya está en el carrito: placas repetidas y cupo ya tomado. */
  cartLines: PurchaseBikeCartLine[];
  /** Sucursal que recibe: el cupo de cada aprobación es por sucursal. */
  targetBranchId?: number;
  targetBranchName: string;
  /** Al editar una preorden, para no contar su propio cupo dos veces. */
  purchaseOrderId?: number;
  /** Solo se llama si al menos una moto entra al carrito */
  onConfirm: (
    lines: PurchaseBikeCartLine[],
    rejected: RejectedCartRow[]
  ) => void;
}

type Step = 'select' | 'reading' | 'review';

interface ReadState {
  pages: InvoicePageResult<InvoiceBikePage>[];
  review: BikeInvoiceReview;
}

/**
 * "Subir Factura" en el carrito de motos: la factura escaneada de Empire
 * Keeway se lee página por página y cada moto vuelve como una unidad lista para
 * el carrito (modelo, color, chasis, motor, placa, año y número de factura).
 *
 * La factura trae el número de aprobación de Empire ("Nro Aprobación"): se
 * consulta cada uno y cada moto entra con el de su página, si la aprobación
 * existe, está abierta y tiene cupo para ese modelo en la sucursal que recibe.
 * La revisión se muestra siempre, para ver cómo quedó cada aprobación.
 */
export function UploadBikeInvoiceModal({
  isOpen,
  onClose,
  cartLines,
  targetBranchId,
  targetBranchName,
  purchaseOrderId,
  onConfirm,
}: UploadBikeInvoiceModalProps) {
  const token = useToken();
  const {
    readInvoice,
    readInvoiceError,
    invoiceReadProgress,
    resetReadInvoice,
    closeInvoice,
  } = useReadInvoice('bikes');
  const [step, setStep] = useState<Step>('select');
  const [read, setRead] = useState<ReadState | null>(null);
  const [drafts, setDrafts] = useState<Record<string, BikeUnitDraft>>({});
  // Número de aprobación por página: el leído, corregible a mano.
  const [pageApprovals, setPageApprovals] = useState<Record<number, string>>(
    {}
  );
  const [failure, setFailure] = useState<string | null>(null);

  const cartPlates = useMemo(
    () => cartLines.map((line) => line.plate),
    [cartLines]
  );

  // Una consulta por número distinto, cuando se deja de escribir.
  const numbers = useMemo(
    () =>
      Array.from(
        new Set(
          Object.values(pageApprovals)
            .map(normalizeApprovalNumber)
            .filter(Boolean)
        )
      ),
    [pageApprovals]
  );
  const [debouncedNumbers] = useDebounce(numbers, 400);
  const lookupQueries = useQueries({
    queries: debouncedNumbers.map((number) => ({
      queryKey: [APPROVAL_LOOKUP_QUERY_KEY, token, number, purchaseOrderId],
      queryFn: () =>
        approvalsService.lookup(token as string, number, purchaseOrderId),
      enabled: isOpen && !!token,
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 15 * 1000,
    })),
  });
  const lookups: Record<string, ApprovalLookupState> = {};
  debouncedNumbers.forEach((number, index) => {
    const query = lookupQueries[index];
    if (!query || (query.isLoading && !query.isError)) {
      lookups[number] = { status: 'loading' };
    } else if (query.isError) {
      lookups[number] = {
        status:
          getApprovalErrorStatus(query.error) === 404 ? 'not_found' : 'error',
      };
    } else if (query.data) {
      lookups[number] = { status: 'ok', lookup: query.data };
    } else {
      lookups[number] = { status: 'loading' };
    }
  });
  const isLookupStale =
    numbers.length !== debouncedNumbers.length ||
    numbers.some((number) => !debouncedNumbers.includes(number));
  const isAnyLookupPending =
    isLookupStale ||
    Object.values(lookups).some((state) => state.status === 'loading');
  const isRefetching = lookupQueries.some((query) => query.isFetching);
  const refetchLookups = () =>
    lookupQueries.forEach((query) => query.refetch());

  const duplicated = useMemo(
    () => duplicatedDrafts(drafts, cartPlates),
    [drafts, cartPlates]
  );
  const problems = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(drafts).map(([key, draft]) => [
          key,
          draftProblem(draft, duplicated.has(key)),
        ])
      ),
    [drafts, duplicated]
  );
  const blocking = Object.values(problems).filter(Boolean).length;
  const approvalIssues = read
    ? approvalProblems(
        read.review,
        drafts,
        pageApprovals,
        lookups,
        targetBranchId,
        targetBranchName,
        cartLines
      )
    : {};
  const result = useMemo(
    () =>
      read
        ? applyBikeInvoiceReview(
            read.pages,
            read.review,
            drafts,
            pageApprovals,
            approvalIssues
          )
        : null,
    // approvalIssues se rearma en cada render; lo que lo cambia está acá.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [read, drafts, pageApprovals, lookupQueries, targetBranchId, cartLines]
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
    setDrafts({});
    setPageApprovals({});
    setFailure(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finish = (
    lines: PurchaseBikeCartLine[],
    rejected: RejectedCartRow[]
  ) => {
    onConfirm(lines, rejected);
    handleClose();
  };

  // Otra factura para la misma preorden: lo leído pasa al carrito y el modal
  // queda esperando el siguiente archivo.
  const finishAndContinue = (
    lines: PurchaseBikeCartLine[],
    rejected: RejectedCartRow[]
  ) => {
    onConfirm(lines, rejected);
    reset();
  };

  const handleFileSelect = async (file: File) => {
    setFailure(null);
    setStep('reading');
    let pages: InvoicePageResult<InvoiceBikePage>[];
    try {
      pages = await readInvoice(file);
    } catch (error) {
      if (error instanceof Error && error.message === INVOICE_READ_CANCELLED) {
        resetReadInvoice();
      }
      setStep('select');
      return;
    }

    if (pages.every((page) => !page.data)) {
      setFailure(pages[0]?.error ?? 'No se pudo leer ninguna página.');
      setStep('select');
      return;
    }

    const review = buildBikeInvoiceReview(pages, cartPlates);
    setRead({ pages, review });
    setDrafts(defaultBikeDrafts(review));
    setPageApprovals(defaultPageApprovals(review));
    setStep('review');
  };

  // Captura o foto en el portapapeles: Ctrl+V con el modal esperando archivo.
  usePasteImage(isOpen && step === 'select', handleFileSelect);

  const lineCount = result?.lines.length ?? 0;
  const pageCount = read?.pages.length ?? 0;
  const unitCount = read?.review.units.length ?? 0;
  const withoutApproval = read
    ? read.review.units.filter(
        (unit) =>
          (drafts[unit.key]?.include ?? true) && !!approvalIssues[unit.key]
      ).length
    : 0;
  const errorMessage =
    failure ?? (readInvoiceError ? readInvoiceError.message : null);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        width={step === 'review' ? '960px' : '480px'}
        maxHeight="90vh"
        className="max-w-[95vw] overflow-y-auto"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Subir factura de motos
          </DialogTitle>
          <DialogDescription>
            {step === 'review'
              ? `Se leyeron ${pageCount} página${pageCount === 1 ? '' : 's'} con ${unitCount} moto${unitCount === 1 ? '' : 's'}. ` +
                'Revisá las aprobaciones y lo marcado antes de agregarlas.'
              : 'Subí el PDF escaneado de las facturas de motos de Empire Keeway (o una foto de una página). ' +
                'Cada moto entra con su chasis, motor, placa, color, año y el número de aprobación de la factura.'}
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
            <BikeInvoiceReviewStep
              review={read.review}
              drafts={drafts}
              onChange={(key, draft) =>
                setDrafts((prev) => ({ ...prev, [key]: draft }))
              }
              duplicated={duplicated}
              problems={problems}
              previews={previews}
              pageApprovals={pageApprovals}
              onChangeApproval={(page, value) =>
                setPageApprovals((prev) => ({ ...prev, [page]: value }))
              }
              lookups={lookups}
              approvalIssues={approvalIssues}
              targetBranchId={targetBranchId}
              targetBranchName={targetBranchName}
              onRefetchApprovals={refetchLookups}
              isRefetchingApprovals={isRefetching}
            />
            {lineCount === 0 && result && result.rejected.length > 0 && (
              <div className="space-y-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 dark:border-amber-800 dark:bg-amber-950/30">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  Ninguna moto de la factura se puede agregar.
                </p>
                <RejectedRowsTable rows={result.rejected} />
              </div>
            )}
            {lineCount > 0 && read.review.rejectedCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {read.review.rejectedCount === 1
                  ? '1 moto es de un modelo que no está en el catálogo: '
                  : `${read.review.rejectedCount} motos son de modelos que no están en el catálogo: `}
                aparecen en el aviso del carrito, con botón para copiarlas.
              </p>
            )}
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between gap-2 sm:justify-between">
          {step === 'review' ? (
            <>
              <Button variant="ghost" onClick={reset}>
                Cambiar archivo
              </Button>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {blocking > 0 && (
                  <span className="text-xs text-red-700 dark:text-red-400">
                    {blocking === 1
                      ? '1 moto marcada tiene datos por completar'
                      : `${blocking} motos marcadas tienen datos por completar`}
                  </span>
                )}
                {blocking === 0 &&
                  withoutApproval > 0 &&
                  !isAnyLookupPending && (
                    <span className="text-xs text-amber-700 dark:text-amber-400">
                      {withoutApproval === 1
                        ? '1 moto no entra por su aprobación'
                        : `${withoutApproval} motos no entran por su aprobación`}
                    </span>
                  )}
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    lineCount === 0 || blocking > 0 || isAnyLookupPending
                  }
                  onClick={() =>
                    result && finishAndContinue(result.lines, result.rejected)
                  }
                >
                  Agregar y subir otra factura
                </Button>
                <Button
                  disabled={
                    lineCount === 0 || blocking > 0 || isAnyLookupPending
                  }
                  onClick={() =>
                    result && finish(result.lines, result.rejected)
                  }
                >
                  {isAnyLookupPending
                    ? 'Consultando aprobaciones...'
                    : `Agregar ${lineCount} moto${lineCount === 1 ? '' : 's'} al carrito`}
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
