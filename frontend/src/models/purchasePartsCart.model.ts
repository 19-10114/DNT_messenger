/** Una línea del carrito de preorden de compra de repuestos */
export interface PurchasePartsCartLine {
  productId: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  quantity: number;
  cost: number;
  /** Costo de catálogo != 0/null: el costo de la línea queda fijo en ese
   * valor y no se puede editar -- solo se habilita cuando el catálogo no
   * lo tiene cargado. */
  costEditable: boolean;
  tax: { iva: number; igtf: number } | null;
  /** Facturas de las que salió la línea ("Subir Factura"). Una sola viaja
   * como `invoice_number` de la línea; varias, en sus `notes`. */
  invoiceNumbers?: string[];
  /** Notas de la línea ya guardada (al editar una preorden) */
  notes?: string;
  /** Costo unitario según la factura, en USD (Bs ÷ tasa BCV de esa factura).
   * Solo informativo: el costo de la línea sigue siendo el de catálogo. */
  invoiceCost?: number | null;
}

export type CartRowRejectionReason =
  | 'not_found'
  | 'invalid_quantity'
  | 'missing_key'
  | 'not_a_part'
  | 'discarded'
  | 'unreadable_page'
  | 'credit_note'
  | 'other_kind'
  | 'already_registered'
  | 'duplicate_plate'
  | 'approval';

/** Una fila del Excel o de la factura subida al carrito que no se pudo agregar
 * (en el carrito de motos, una unidad de la factura) */
export interface RejectedCartRow {
  /** Fila del Excel (la 1 es el encabezado) o de la tabla de la factura */
  rowNumber: number;
  id: number | null;
  sku: string | null;
  quantity: number | null;
  reason: CartRowRejectionReason;
  /** Solo facturas: dónde está la fila ("Pág. 3 · Fact. 256246") */
  location?: string;
  /** Solo facturas: descripción leída, para reconocer la fila sin el sku */
  description?: string;
}

export const CART_ROW_REJECTION_LABELS: Record<CartRowRejectionReason, string> =
  {
    not_found: 'No existe en el catálogo',
    invalid_quantity: 'Cantidad inválida',
    missing_key: 'Sin id ni sku',
    not_a_part: 'No es un repuesto',
    discarded: 'Descartada en la revisión',
    unreadable_page: 'No se pudo leer la página',
    credit_note: 'No agrega productos',
    other_kind: 'Es de la otra pestaña',
    already_registered: 'Ya está registrada en el sistema',
    duplicate_plate: 'Placa repetida',
    approval: 'Aprobación de Empire',
  };
