/**
 * "Subir Factura": lectura de una página escaneada de factura de Empire Keeway
 * (`POST /api/purchases/invoice/read-page`). Ver PLAN-factura-pdf-preorden.md y
 * el backend ARCHITECTURE.md §4.11. No crea nada: devuelve las líneas para el
 * carrito.
 */

/** Producto del catálogo tal como lo devuelve el lector */
export interface InvoiceProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  cost: number | null;
  tax: { iva: number; igtf: number } | null;
}

/**
 * - `found`: sku exacto (ignorando guiones, puntos y espacios, o impreso cortado
 *   como los de la Matrix) y el nombre encaja con la descripción.
 * - `mismatch`: sku exacto pero el nombre del catálogo es otro. En la factura de
 *   muestra casi siempre era el mismo producto con otro nombre ("STICKER" /
 *   "ETIQUETA"); raramente, el OCR cayó en otro producto real. Va a revisión.
 * - `suggested`: el sku no existe; `suggestion` es uno parecido cuyo nombre sí
 *   encaja.
 * - `not_found` / `not_a_part`: no entra al carrito.
 */
export type InvoiceLineResolution =
  | 'found'
  | 'mismatch'
  | 'suggested'
  | 'not_found'
  | 'not_a_part';

export interface InvoiceLine {
  /** Fila dentro de la tabla de la factura (1 = primera línea) */
  row: number;
  sku: string;
  description: string;
  model: string;
  quantity: number | null;
  unitPriceBs: number | null;
  totalBs: number | null;
  /** cantidad × precio unitario = total de la línea */
  lineOk: boolean;
  /**
   * La cantidad es confiable: cuadra con precio y total aunque un dígito de
   * alguno esté mal leído, o la suma de cantidades de la página da su "Total de
   * Artículos". Es lo único que el carrito necesita de la línea.
   */
  quantityOk: boolean;
  /** precio unitario en Bs ÷ tasa BCV de la factura */
  invoiceCostUsd: number | null;
  resolution: InvoiceLineResolution;
  product: InvoiceProduct | null;
  suggestion: InvoiceProduct | null;
  /** 0..1: cuánto de la descripción aparece en el nombre + modelo */
  nameFit: number | null;
}

/**
 * - `ok`: las cantidades suman el "Total de Artículos" de la factura (un precio
 *   o el Sub-Total mal leído no la manda a revisión).
 * - `review`: no suman, o falta confirmar alguna cantidad (una fila salteada o
 *   mal leída).
 * - `unreadable`: no se encontró la tabla de la factura.
 */
export type InvoicePageStatus = 'ok' | 'review' | 'unreadable' | 'skipped';

/**
 * Qué es la página según el lector. Una nota de crédito, o una factura del otro
 * tipo (motos subida desde Repuestos o al revés), vuelve `status: 'skipped'`.
 */
export type InvoiceDocumentKind = 'parts' | 'bikes' | 'credit_note' | null;

/** El carrito que lee la factura */
export type InvoiceCartKind = 'parts' | 'bikes';

export interface InvoicePage {
  page: number | null;
  kind: InvoiceDocumentKind;
  status: InvoicePageStatus;
  invoice: {
    number: string | null;
    control: string | null;
    /** aaaa-mm-dd */
    date: string | null;
    bcvRate: number | null;
    declaredItems: number | null;
    declaredSubtotal: number | null;
    /** "Nro Aprobación" de Empire, tal como está impreso (con guion) */
    approvalNumber: string | null;
    /** "N/Entrega": el Nº de entrada del carrito */
    deliveryNumber: string | null;
  };
  check: {
    itemsSum: number;
    subtotalSum: number;
    itemsOk: boolean;
    subtotalOk: boolean;
  };
  lines: InvoiceLine[];
}

export interface InvoicePageResponse {
  message: string;
  data: InvoicePage;
}

export interface InvoiceReaderStatusResponse {
  message: string;
  data: { enabled: boolean };
}

// --------------------------------------------------------------------------
// Facturas de motos (`kind: 'bikes'`): una fila por unidad.

/** Moto del catálogo (un producto por modelo; el color va en la línea) */
export interface InvoiceBikeProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  /** `Price.cost` del modelo; null si no tiene precio cargado */
  cost: number | null;
}

export interface InvoiceBikeLine {
  row: number;
  /** Tal como viene: "RK200 AZUL" */
  description: string;
  /** La descripción sin el color: "RK200" */
  modelText: string;
  /** Uno de BIKES_COLORS, o '' si no se reconoció */
  color: string;
  /** VIN de 17 caracteres, con I/O/Q ya corregidos a 1/0/0 */
  chassis: string;
  /** El VIN cumple el dígito verificador (posición 9) */
  chassisValid: boolean;
  /** Única corrección de un carácter parecido que lo hace válido, si existe */
  chassisSuggestion: string | null;
  /** Como viene impreso: "KW163FML*26558987*" */
  motor: string;
  plate: string;
  /** La placa tiene la forma LLDLDDL ("AG0B22L") */
  plateOk: boolean;
  /** Año de modelo, de la posición 10 del VIN; null si el VIN no es válido */
  year: string | null;
  quantity: number | null;
  unitPriceBs: number | null;
  totalBs: number | null;
  lineOk: boolean;
  invoiceCostUsd: number | null;
  /** `found`: modelo exacto (sin espacios); `suggested`: un modelo es el
   * comienzo de lo leído ("OWEN 200S" → "OWEN 200"); `not_found`. */
  resolution: 'found' | 'suggested' | 'not_found';
  product: InvoiceBikeProduct | null;
  suggestion: InvoiceBikeProduct | null;
  /** La placa o el chasis ya tienen una moto en el sistema: la aprobación la
   * rechazaría */
  alreadyRegistered: boolean;
}

export interface InvoiceBikePage {
  page: number | null;
  kind: InvoiceDocumentKind;
  status: InvoicePageStatus;
  invoice: {
    number: string | null;
    control: string | null;
    date: string | null;
    bcvRate: number | null;
    declaredSubtotal: number | null;
    approvalNumber: string | null;
    deliveryNumber: string | null;
  };
  /** Ausente si la página se saltó */
  check?: {
    bikes: number;
    /** Cantidad de la fila "PLACAS (E)": las motos que trae la factura */
    declaredBikes: number | null;
    bikesOk: boolean;
    subtotalSum: number;
    subtotalOk: boolean;
  };
  plateFeeBs?: number | null;
  lines: InvoiceBikeLine[];
}

export type AnyInvoicePage = InvoicePage | InvoiceBikePage;

export interface AnyInvoicePageResponse {
  message: string;
  data: AnyInvoicePage;
}
