/**
 * Lectura masiva de productos por id y/o sku (`POST /api/products/byids`).
 *
 * Es un POST porque la lista de ids viaja en el cuerpo (en la URL se pasaría
 * del límite de longitud), pero **no tiene efectos**: trátalo como una lectura.
 */

/** Forma estándar de producto, la misma de `GET /products/<sku>` */
export interface ProductByIdsItem {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  type: string | null;
  /** Id de categoría, no objeto anidado: 1 motos, 2 repuestos, 3 abono, 4/5 otros */
  category: number;
  isFeatured: boolean;
  cost: number;
  /** Tasas en %, aparte del precio (que va sin impuestos) */
  tax: { iva: number; igtf: number } | null;
  price: number;
  packageQuantity: number | null;
  mfb: boolean;
  ekAvailable: boolean;
  createdAt: string;
  lastUpdated: string;
  /** Nunca viene vacío: sin imagen propia llega un placeholder */
  images: string[];
}

/** Cuerpo de la consulta; `ids` y `skus` no pueden ir vacíos los dos (400) */
export interface ProductsByIdsPayload {
  ids?: number[];
  skus?: string[];
}

export interface ProductsByIdsResult {
  /** **En orden de base de datos, no en el que se pidieron**: indexa por `id` */
  products: ProductByIdsItem[];
  /**
   * Ids que no existen. Sin esto un id borrado sería invisible: llegarían
   * menos productos de los pedidos y nada lo delataría.
   */
  missingIds: number[];
  /** Igual que `missingIds`, para los skus pedidos (ya sin espacios) */
  missingSkus: string[];
}

export interface ProductsByIdsResponse {
  message: string;
  data: ProductsByIdsResult;
}
