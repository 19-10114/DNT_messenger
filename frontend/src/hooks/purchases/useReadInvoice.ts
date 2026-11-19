import { useCallback, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { PurchasesService } from '@/services/purchases/purchases.service';
import { useToken } from '@/stores/auth/auth.store';
import {
  AnyInvoicePage,
  InvoiceBikePage,
  InvoiceCartKind,
  InvoicePage,
} from '@/services/purchases/types/InvoiceReader.type';
import { InvoicePageResult } from '@/utils/invoiceCart.utils';
import { InvoiceFile, openInvoiceFile } from '@/utils/invoicePdf.utils';

const purchasesService = new PurchasesService();

/** Páginas que se leen a la vez: cada una es una llamada a Google Vision */
const CONCURRENCY = 3;

/** Mensaje del error con el que termina una lectura cortada por `closeInvoice` */
export const INVOICE_READ_CANCELLED = 'Lectura cancelada.';

/**
 * Si "Subir Factura" está disponible: el backend la tiene apagada hasta que
 * la API de Google Vision esté habilitada en el proyecto.
 */
export function useInvoiceReaderStatus() {
  const token = useToken();
  const { data, isLoading } = useQuery({
    queryKey: ['invoiceReaderStatus', token],
    queryFn: () => purchasesService.getInvoiceReaderStatus(token),
    enabled: !!token,
    staleTime: 10 * 60 * 1000,
  });
  return {
    isInvoiceReaderEnabled: data?.enabled ?? false,
    isLoadingInvoiceReaderStatus: isLoading,
  };
}

function pageErrorMessage(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  if (status === 503) return 'El lector de facturas no está disponible.';
  if (status === 400) return 'La imagen de la página no es válida.';
  if (status === 403) return 'No tenés permiso para cargar preórdenes.';
  return 'No se pudo leer la página.';
}

function isRetryable(error: unknown) {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === undefined || status >= 500;
}

export interface InvoiceReadProgress {
  done: number;
  total: number;
}

/**
 * Lee una factura escaneada página por página ("Subir Factura"): cada página
 * se renderiza en el navegador y se manda sola al backend, que la pasa por
 * Google Vision y la cruza con el catálogo. Una página que falla no corta el
 * resto: vuelve con `error` y se reintenta una vez si fue un error del
 * servidor o de red. No toca el carrito ni crea nada.
 *
 * Las vistas previas (`previewUrl`) viven hasta `closeInvoice()`.
 */
type PageOf<Kind extends InvoiceCartKind> = Kind extends 'bikes'
  ? InvoiceBikePage
  : InvoicePage;

export function useReadInvoice<Kind extends InvoiceCartKind = 'parts'>(
  /** El carrito que lee: `bikes` lee facturas de motos; `parts`, de repuestos */
  kind: Kind = 'parts' as Kind
) {
  const token = useToken();
  const [progress, setProgress] = useState<InvoiceReadProgress>({
    done: 0,
    total: 0,
  });
  const fileRef = useRef<InvoiceFile | null>(null);
  // Sube en cada lectura nueva o cierre: los resultados de una lectura vieja
  // que todavía estén llegando se descartan.
  const runRef = useRef(0);

  const closeInvoice = useCallback(() => {
    runRef.current += 1;
    fileRef.current?.close();
    fileRef.current = null;
    setProgress({ done: 0, total: 0 });
  }, []);

  const mutation = useMutation({
    mutationFn: async (
      file: File
    ): Promise<InvoicePageResult<PageOf<Kind>>[]> => {
      closeInvoice();
      const run = runRef.current;
      const invoiceFile = await openInvoiceFile(file);
      fileRef.current = invoiceFile;
      const total = invoiceFile.pageCount;
      setProgress({ done: 0, total });

      const results: InvoicePageResult<PageOf<Kind>>[] = new Array(total);
      let next = 1;
      let done = 0;

      const read = (blob: Blob, page: number) =>
        purchasesService.readInvoicePage(token, blob, page, kind) as Promise<
          AnyInvoicePage & PageOf<Kind>
        >;

      const readPage = async (
        page: number
      ): Promise<InvoicePageResult<PageOf<Kind>>> => {
        let previewUrl: string | null = null;
        try {
          const rendered = await invoiceFile.renderPage(page);
          previewUrl = rendered.previewUrl;
          try {
            const data = await read(rendered.blob, page);
            return { page, previewUrl, data };
          } catch (error) {
            if (!isRetryable(error)) throw error;
            const data = await read(rendered.blob, page);
            return { page, previewUrl, data };
          }
        } catch (error) {
          return {
            page,
            previewUrl,
            data: null,
            error:
              error instanceof Error && !isAxiosError(error)
                ? error.message
                : pageErrorMessage(error),
          };
        }
      };

      const worker = async () => {
        while (next <= total && run === runRef.current) {
          const page = next;
          next += 1;
          results[page - 1] = await readPage(page);
          done += 1;
          if (run === runRef.current) setProgress({ done, total });
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, total) }, worker)
      );
      if (run !== runRef.current) throw new Error(INVOICE_READ_CANCELLED);
      return results;
    },
  });

  return {
    readInvoice: mutation.mutateAsync,
    isReadingInvoice: mutation.isLoading,
    readInvoiceError: mutation.error as Error | null,
    invoiceReadProgress: progress,
    resetReadInvoice: mutation.reset,
    closeInvoice,
  };
}
