import { PurchasePartsCartLine } from '@/models/purchasePartsCart.model';
import {
  PurchaseOrderLine,
  PurchaseOrderLinePayload,
} from '@/services/purchases/types/PurchaseOrder.type';

/**
 * Reglas del carrito de preorden de compra de repuestos que comparten el
 * buscador, el Excel ("Cargar Productos") y la factura ("Subir Factura").
 */

// `PurchaseOrderLine.invoice_number` es un CharField(15); `notes`, (300).
const INVOICE_NUMBER_MAX = 15;
const NOTES_MAX = 300;
const INVOICES_NOTE = /^Facturas (.+)$/;

/** Promedio de costos de factura ponderado por cantidad; null si ninguno */
function mergedInvoiceCost(
  a: PurchasePartsCartLine,
  b: PurchasePartsCartLine
): number | null | undefined {
  const parts = [a, b].filter(
    (line) => line.invoiceCost !== null && line.invoiceCost !== undefined
  );
  if (parts.length === 0) return a.invoiceCost ?? b.invoiceCost;
  const units = parts.reduce((sum, line) => sum + line.quantity, 0);
  const total = parts.reduce(
    (sum, line) => sum + line.quantity * (line.invoiceCost as number),
    0
  );
  return units > 0 ? Math.round((total / units) * 100) / 100 : null;
}

/**
 * Suma `incoming` al carrito: una línea que ya está suma su cantidad (y junta
 * sus facturas), una nueva se agrega al final.
 */
export function mergeCartLines(
  prev: PurchasePartsCartLine[],
  incoming: PurchasePartsCartLine[]
): PurchasePartsCartLine[] {
  const next = [...prev];
  incoming.forEach((line) => {
    const index = next.findIndex((l) => l.productId === line.productId);
    if (index === -1) {
      next.push(line);
      return;
    }
    const current = next[index];
    const invoiceNumbers = Array.from(
      new Set([
        ...(current.invoiceNumbers ?? []),
        ...(line.invoiceNumbers ?? []),
      ])
    );
    next[index] = {
      ...current,
      quantity: current.quantity + line.quantity,
      ...(invoiceNumbers.length > 0 && { invoiceNumbers }),
      invoiceCost: mergedInvoiceCost(current, line),
    };
  });
  return next;
}

/**
 * La línea tal como la manda el carrito a `POST/PATCH /purchases`. Una sola
 * factura va en `invoice_number`; varias (el mismo repuesto en varias facturas
 * de un mismo envío), en `notes` como "Facturas 256237, 256246".
 */
export function cartLineToPayload(
  line: PurchasePartsCartLine
): PurchaseOrderLinePayload {
  const invoices = line.invoiceNumbers ?? [];
  return {
    product: line.productId,
    quantity: line.quantity,
    cost: line.cost,
    invoice_number:
      invoices.length === 1 ? invoices[0].slice(0, INVOICE_NUMBER_MAX) : '',
    notes: (invoices.length > 1
      ? `Facturas ${invoices.join(', ')}`
      : (line.notes ?? '')
    ).slice(0, NOTES_MAX),
  };
}

/**
 * Las facturas de una línea ya guardada, para precargar el carrito al editar
 * (lo inverso de `cartLineToPayload`). Sin esto, guardar la edición borraría
 * el número de factura: el backend reemplaza todas las líneas.
 */
export function invoiceFieldsFromSavedLine(
  line: Pick<PurchaseOrderLine, 'invoiceNumber' | 'notes'>
): Pick<PurchasePartsCartLine, 'invoiceNumbers' | 'notes'> {
  const fromNotes = (line.notes ?? '').match(INVOICES_NOTE);
  if (fromNotes) {
    return {
      invoiceNumbers: fromNotes[1].split(',').map((n) => n.trim()),
      notes: '',
    };
  }
  return {
    invoiceNumbers: line.invoiceNumber ? [line.invoiceNumber] : [],
    notes: line.notes ?? '',
  };
}
