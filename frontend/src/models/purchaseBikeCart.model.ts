/** Una unidad del carrito de preorden de compra de motos: una moto física */
export interface PurchaseBikeCartLine {
  productId: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  cost: number;
  plate: string;
  color: string;
  chassisSerial: string;
  motorSerial: string;
  year: string;
  invoiceNumber: string;
  inNumber: string;
  notes: string;
  /** Aprobación de Empire a la que cuenta esta moto (normalizada). Obligatoria
   * para guardar; "Subir Factura" la deja vacía y el carrito copia la de arriba. */
  approvalNumber: string;
  /** Solo "Subir Factura": costo según la factura, en USD (Bs ÷ tasa BCV).
   * Informativo; el costo de la línea es el de catálogo si lo hay. */
  invoiceCost?: number | null;
}
