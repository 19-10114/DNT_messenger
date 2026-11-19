/**
 * "Subir Factura": convierte el archivo subido (PDF escaneado, o una foto
 * suelta) en una imagen JPEG por página, lista para el lector del backend.
 *
 * El PDF entero nunca viaja: Cloud Run corta los requests en 32MB y un
 * escaneo de 28 páginas ya pesa 33MB. Cada página se manda aparte (~300KB).
 * pdf.js se carga recién al elegir un archivo, para no sumarle ~1MB al
 * carrito.
 */

/** Ancho de la imagen que se manda al OCR. Las letras de la tabla quedan de
 * ~20px de alto, de sobra para Vision, y la página pesa ~300KB. */
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 0.82;

export const INVOICE_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png';

export interface RenderedInvoicePage {
  page: number;
  blob: Blob;
  /** `blob:` URL para la vista previa; la libera `closeInvoiceFile` */
  previewUrl: string;
}

export interface InvoiceFile {
  pageCount: number;
  /** Renderiza una página (1 = primera) */
  renderPage: (page: number) => Promise<RenderedInvoicePage>;
  /** Libera el documento y las URLs de vista previa ya creadas */
  close: () => void;
}

type PdfjsModule = typeof import('pdfjs-dist');
type PdfDocument = Awaited<ReturnType<PdfjsModule['getDocument']>['promise']>;

let pdfjsPromise: Promise<PdfjsModule> | null = null;

function loadPdfjs(): Promise<PdfjsModule> {
  if (!pdfjsPromise) {
    pdfjsPromise = (async () => {
      // El build "legacy" trae los polyfills para navegadores viejos.
      const pdfjs: PdfjsModule = await import(
        'pdfjs-dist/legacy/build/pdf.mjs'
      );
      // `new Worker(new URL(...))` es el patrón que webpack reconoce y empaqueta
      // como módulo. Pasarle la URL a pdf.js (`workerSrc`) lo emite como un
      // archivo suelto que el minificador de Next lee como script común y
      // rompe el build ("'import' cannot be used outside of module code").
      // Un solo worker para toda la sesión: pdf.js no cierra un workerPort ajeno.
      if (!pdfjs.GlobalWorkerOptions.workerPort) {
        pdfjs.GlobalWorkerOptions.workerPort = new Worker(
          new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url
          ),
          { type: 'module' }
        );
      }
      return pdfjs;
    })();
  }
  return pdfjsPromise;
}

function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('No se pudo generar la imagen.')),
      'image/jpeg',
      JPEG_QUALITY
    )
  );
}

function newCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('El navegador no permite dibujar la página.');
  // Fondo blanco: un PNG con transparencia saldría negro en JPEG.
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function isPdf(file: File) {
  return (
    file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
  );
}

/**
 * Abre la factura subida.
 * @throws Error con un mensaje para mostrar si el archivo no se puede abrir
 */
export async function openInvoiceFile(file: File): Promise<InvoiceFile> {
  const previewUrls: string[] = [];
  const track = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    previewUrls.push(url);
    return url;
  };
  const revokeAll = () =>
    previewUrls.forEach((url) => URL.revokeObjectURL(url));

  if (!isPdf(file)) {
    // Una foto suelta = una página. Se re-encoda al mismo tamaño que un PDF.
    if (!file.type.startsWith('image/')) {
      throw new Error('El archivo tiene que ser un PDF o una imagen.');
    }
    return {
      pageCount: 1,
      renderPage: async (page) => {
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, MAX_WIDTH / bitmap.width);
        const { canvas, context } = newCanvas(
          bitmap.width * scale,
          bitmap.height * scale
        );
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const blob = await canvasToJpeg(canvas);
        return { page, blob, previewUrl: track(blob) };
      },
      close: revokeAll,
    };
  }

  const pdfjs = await loadPdfjs();
  let document: PdfDocument;
  try {
    document = await pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      // Un PDF no tiene por qué ejecutar nada para dibujarse.
      isEvalSupported: false,
    }).promise;
  } catch {
    throw new Error('No se pudo abrir el PDF. ¿Está dañado o tiene clave?');
  }

  return {
    pageCount: document.numPages,
    renderPage: async (page) => {
      const pdfPage = await document.getPage(page);
      const base = pdfPage.getViewport({ scale: 1 });
      const viewport = pdfPage.getViewport({ scale: MAX_WIDTH / base.width });
      const { canvas, context } = newCanvas(viewport.width, viewport.height);
      await pdfPage.render({ canvasContext: context, viewport }).promise;
      pdfPage.cleanup();
      const blob = await canvasToJpeg(canvas);
      return { page, blob, previewUrl: track(blob) };
    },
    close: () => {
      revokeAll();
      void document.destroy();
    },
  };
}
