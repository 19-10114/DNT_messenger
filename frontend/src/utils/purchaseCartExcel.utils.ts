import { ProductByIdsItem } from '@/services/products/types/ProductsByIds.type';
import {
  PurchasePartsCartLine,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';
import { PartsTemplateRow } from '@/utils/partsTemplate.utils';

/**
 * Categorías que el buscador del carrito ofrece (`/products/part/all`):
 * repuestos (2), agropecuarios (6) y servicios (5). Un id/sku de otra
 * categoría (una moto, p. ej.) no entra al carrito de repuestos.
 */
const CART_PART_CATEGORIES = [2, 5, 6];

export interface PartsFromExcelResult {
  /** Una línea por producto; las filas repetidas ya vienen sumadas */
  lines: PurchasePartsCartLine[];
  rejected: RejectedCartRow[];
}

/**
 * Convierte las filas de la plantilla de repuestos en líneas para el carrito
 * de preorden de compra. El Excel aporta solo producto + cantidad: el costo
 * es el de catálogo, con la misma regla que al agregar desde el buscador.
 * Las filas con `cantidad` vacía o 0 se ignoran (la plantilla trae todo el
 * catálogo y casi todas van vacías); las demás que no se pueden agregar
 * vuelven en `rejected` con su motivo.
 * @param lookup - Busca productos por ids y skus (`POST /products/byids`)
 */
export async function resolvePartsTemplateRows(
  allRows: PartsTemplateRow[],
  lookup: (ids: number[], skus: string[]) => Promise<ProductByIdsItem[]>
): Promise<PartsFromExcelResult> {
  const rows = allRows.filter(
    (row) => row.quantity !== null && row.quantity !== 0
  );

  const rejected: RejectedCartRow[] = [];
  const reject = (
    row: (typeof rows)[number],
    reason: RejectedCartRow['reason']
  ) =>
    rejected.push({
      rowNumber: row.rowNumber,
      id: row.id,
      sku: row.sku,
      quantity: Number.isFinite(row.quantity) ? row.quantity : null,
      reason,
    });

  const validRows = rows.filter((row) => {
    if (!Number.isFinite(row.quantity) || (row.quantity as number) < 0) {
      reject(row, 'invalid_quantity');
      return false;
    }
    if (row.id === null && row.sku === null) {
      reject(row, 'missing_key');
      return false;
    }
    return true;
  });
  if (validRows.length === 0) return { lines: [], rejected };

  // Se manda el sku de todas las filas, no solo de las que no traen id:
  // si el id ya no existe (producto borrado y vuelto a crear), el sku
  // todavía puede encontrarlo.
  const ids = Array.from(
    new Set(validRows.flatMap((row) => (row.id === null ? [] : [row.id])))
  );
  const skus = Array.from(
    new Set(validRows.flatMap((row) => (row.sku === null ? [] : [row.sku])))
  );
  const products = await lookup(ids, skus);
  const byId = new Map(products.map((p) => [p.id, p]));
  const bySku = new Map(products.map((p) => [p.sku, p]));

  const linesById = new Map<number, PurchasePartsCartLine>();
  validRows.forEach((row) => {
    const product: ProductByIdsItem | undefined =
      (row.id !== null ? byId.get(row.id) : undefined) ??
      (row.sku !== null ? bySku.get(row.sku) : undefined);
    if (!product) {
      reject(row, 'not_found');
      return;
    }
    if (!CART_PART_CATEGORIES.includes(product.category)) {
      reject(row, 'not_a_part');
      return;
    }
    const quantity = row.quantity as number;
    const existing = linesById.get(product.id);
    if (existing) {
      existing.quantity += quantity;
      return;
    }
    linesById.set(product.id, {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      model: product.model,
      brand: product.brand,
      quantity,
      cost: product.cost ?? 0,
      costEditable: !product.cost,
      tax: product.tax,
    });
  });

  rejected.sort((a, b) => a.rowNumber - b.rowNumber);
  return { lines: Array.from(linesById.values()), rejected };
}
