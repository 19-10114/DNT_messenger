import {
  PurchasePartsCartLine,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';
import {
  InvoiceDocumentKind,
  InvoiceLine,
  InvoicePage,
  InvoiceProduct,
} from '@/services/purchases/types/InvoiceReader.type';
import { mergeCartLines } from './purchaseCart.utils';

/**
 * "Subir Factura": de las páginas leídas por el backend a líneas de carrito.
 * Lógica pura (sin React ni red). Lo que el lector dio por bueno entra solo;
 * lo dudoso pasa por la revisión; lo que no existe va al aviso ámbar.
 */

/** Una página del archivo: leída, o con el error que impidió leerla */
export interface InvoicePageResult<Page = InvoicePage> {
  page: number;
  previewUrl: string | null;
  data: Page | null;
  error?: string;
}

/**
 * Por qué una línea necesita que alguien la mire:
 * - `suggested`: el sku leído no existe; se propone uno parecido.
 * - `mismatch`: el sku existe pero el catálogo lo llama distinto.
 * - `line_check`: la cantidad no está confirmada (ni por la cuenta de la línea
 *   ni por la suma de la página).
 */
export type InvoiceReviewKind = 'suggested' | 'mismatch' | 'line_check';

export interface InvoiceReviewItem {
  key: string;
  page: number;
  invoiceNumber: string | null;
  line: InvoiceLine;
  kind: InvoiceReviewKind;
  /** El producto que entra si se incluye la línea */
  product: InvoiceProduct;
  /** Siempre sí: el sku exacto o sugerido y la cantidad leída son la mejor
   * apuesta; la revisión está para que alguien lo vea, no para que lo agregue */
  defaultInclude: boolean;
}

/** Una página que no cuadró sola o no se pudo leer */
export interface InvoicePageIssue {
  page: number;
  previewUrl: string | null;
  invoiceNumber: string | null;
  /** `review`: las sumas no dan; `unreadable` / `error`: no hay líneas */
  kind: 'review' | 'unreadable' | 'error';
  message: string;
}

export interface InvoiceReviewDecision {
  include: boolean;
  quantity: number;
}

export interface InvoiceReview {
  items: InvoiceReviewItem[];
  pageIssues: InvoicePageIssue[];
  /** Líneas que entran sin preguntar */
  autoLineCount: number;
  /** Líneas que no entran (no existen / no son repuesto) */
  rejectedLineCount: number;
}

export const lineKey = (page: number, row: number) => `${page}-${row}`;

export function location(page: number, invoiceNumber: string | null) {
  return invoiceNumber
    ? `Pág. ${page} · Fact. ${invoiceNumber}`
    : `Pág. ${page}`;
}

function formatQuantity(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/**
 * Fila del aviso para una página que no aporta nada a este carrito: una nota de
 * crédito, o una factura del otro tipo. No obliga a pasar por la revisión.
 */
export function skippedPageRow(
  page: number,
  kind: InvoiceDocumentKind,
  invoiceNumber: string | null,
  cart: 'parts' | 'bikes'
): RejectedCartRow {
  const other = cart === 'parts' ? 'Motos' : 'Repuestos';
  return {
    rowNumber: 0,
    id: null,
    sku: null,
    quantity: null,
    reason: kind === 'credit_note' ? 'credit_note' : 'other_kind',
    location: location(page, invoiceNumber),
    description:
      kind === 'credit_note'
        ? 'Nota de crédito'
        : `Factura de ${other.toLowerCase()}: súbela en la pestaña ${other}`,
  };
}

function pageIssue(result: InvoicePageResult): InvoicePageIssue | null {
  if (result.data?.status === 'skipped') return null;
  const invoiceNumber = result.data?.invoice.number ?? null;
  const base = {
    page: result.page,
    previewUrl: result.previewUrl,
    invoiceNumber,
  };
  if (!result.data) {
    return {
      ...base,
      kind: 'error',
      message: result.error ?? 'No se pudo leer la página.',
    };
  }
  if (result.data.status === 'unreadable') {
    return {
      ...base,
      kind: 'unreadable',
      message:
        'No parece una factura de Empire Keeway: no se encontró la tabla.',
    };
  }
  if (result.data.status === 'review') {
    const { check, invoice } = result.data;
    const parts: string[] = [];
    if (!check.itemsOk) {
      parts.push(
        invoice.declaredItems === null
          ? `${formatQuantity(check.itemsSum)} artículos leídos (no se pudo leer el total de la factura)`
          : `${formatQuantity(check.itemsSum)} artículos leídos de ${formatQuantity(invoice.declaredItems)}`
      );
    }
    if (!check.subtotalOk && check.itemsOk) {
      parts.push('el sub-total no coincide con la suma de las líneas');
    }
    const badLines = result.data.lines.filter(
      (line) => !line.quantityOk
    ).length;
    if (badLines > 0) {
      parts.push(
        badLines === 1
          ? '1 cantidad sin confirmar'
          : `${badLines} cantidades sin confirmar`
      );
    }
    return {
      ...base,
      kind: 'review',
      message: `${parts.join(' · ') || 'No cuadra'}. Compará con la imagen: puede faltar una fila.`,
    };
  }
  return null;
}

function reviewKind(line: InvoiceLine): InvoiceReviewKind | null {
  if (line.resolution === 'suggested') return 'suggested';
  if (line.resolution === 'mismatch') return 'mismatch';
  if (line.resolution === 'found' && !line.quantityOk) return 'line_check';
  return null;
}

/** Qué hay que mirar antes de agregar al carrito. Vacío = va directo. */
export function buildInvoiceReview(pages: InvoicePageResult[]): InvoiceReview {
  const items: InvoiceReviewItem[] = [];
  const pageIssues: InvoicePageIssue[] = [];
  let autoLineCount = 0;
  let rejectedLineCount = 0;

  pages.forEach((result) => {
    const issue = pageIssue(result);
    if (issue) pageIssues.push(issue);
    if (!result.data || result.data.status === 'skipped') return;
    const invoiceNumber = result.data.invoice.number;
    result.data.lines.forEach((line) => {
      const kind = reviewKind(line);
      const product =
        line.resolution === 'suggested' ? line.suggestion : line.product;
      if (kind && product) {
        items.push({
          key: lineKey(result.page, line.row),
          page: result.page,
          invoiceNumber,
          line,
          kind,
          product,
          defaultInclude: true,
        });
      } else if (line.resolution === 'found' && line.product) {
        autoLineCount += 1;
      } else {
        rejectedLineCount += 1;
      }
    });
  });

  return { items, pageIssues, autoLineCount, rejectedLineCount };
}

export function needsReview(review: InvoiceReview) {
  return review.items.length > 0 || review.pageIssues.length > 0;
}

export function defaultDecisions(
  review: InvoiceReview
): Record<string, InvoiceReviewDecision> {
  return Object.fromEntries(
    review.items.map((item) => [
      item.key,
      { include: item.defaultInclude, quantity: item.line.quantity ?? 0 },
    ])
  );
}

function toCartLine(
  product: InvoiceProduct,
  line: InvoiceLine,
  quantity: number,
  invoiceNumber: string | null
): PurchasePartsCartLine {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    model: product.model,
    brand: product.brand,
    quantity,
    // Manda el catálogo (misma regla que el buscador). Solo si el catálogo no
    // tiene costo, la línea arranca con el de la factura y queda editable.
    cost: product.cost || line.invoiceCostUsd || 0,
    costEditable: !product.cost,
    tax: product.tax,
    invoiceNumbers: invoiceNumber ? [invoiceNumber] : [],
    invoiceCost: line.invoiceCostUsd,
  };
}

/**
 * Las páginas leídas + lo decidido en la revisión → líneas para el carrito
 * (un producto repetido en varias facturas queda en una sola línea, con las
 * cantidades sumadas) y filas que no entraron.
 */
export function applyInvoiceReview(
  pages: InvoicePageResult[],
  decisions: Record<string, InvoiceReviewDecision>
): { lines: PurchasePartsCartLine[]; rejected: RejectedCartRow[] } {
  let lines: PurchasePartsCartLine[] = [];
  const rejected: RejectedCartRow[] = [];

  pages.forEach((result) => {
    if (result.data?.status === 'skipped') {
      rejected.push(
        skippedPageRow(
          result.page,
          result.data.kind,
          result.data.invoice.number,
          'parts'
        )
      );
      return;
    }
    if (!result.data || result.data.status === 'unreadable') {
      rejected.push({
        rowNumber: 0,
        id: null,
        sku: null,
        quantity: null,
        reason: 'unreadable_page',
        location: location(result.page, result.data?.invoice.number ?? null),
      });
      return;
    }
    const invoiceNumber = result.data.invoice.number;
    result.data.lines.forEach((line) => {
      const reject = (
        reason: RejectedCartRow['reason'],
        quantity = line.quantity
      ) =>
        rejected.push({
          rowNumber: line.row,
          id: null,
          sku: line.sku || null,
          quantity,
          reason,
          location: location(result.page, invoiceNumber),
          description: [line.description, line.model]
            .filter(Boolean)
            .join(' · '),
        });

      const kind = reviewKind(line);
      let product: InvoiceProduct | null = null;
      let quantity = line.quantity;
      if (kind) {
        const decision = decisions[lineKey(result.page, line.row)];
        if (!decision?.include) {
          reject('discarded');
          return;
        }
        product =
          line.resolution === 'suggested' ? line.suggestion : line.product;
        quantity = decision.quantity;
      } else if (line.resolution === 'found') {
        product = line.product;
      } else {
        reject(line.resolution === 'not_a_part' ? 'not_a_part' : 'not_found');
        return;
      }
      if (!product) {
        reject('not_found');
        return;
      }
      if (quantity === null || !(quantity > 0)) {
        reject('invalid_quantity', quantity);
        return;
      }
      lines = mergeCartLines(lines, [
        toCartLine(product, line, quantity, invoiceNumber),
      ]);
    });
  });

  return { lines, rejected };
}
