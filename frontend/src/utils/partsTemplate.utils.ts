import * as XLSX from 'xlsx';

/**
 * Plantilla de repuestos en Excel: la que se descarga en Inventario →
 * Repuestos ("Cargar Productos") y, ya con la columna `cantidad` llenada, se
 * sube ahí (compra directa a inventario) o en el carrito de preorden de
 * compra (solo agrega líneas al carrito).
 */

export const PARTS_TEMPLATE_HEADERS = [
  'id',
  'nombre',
  'sku',
  'modelo',
  'cantidad',
  'costo',
] as const;

/** Lo mínimo de un repuesto para escribir su fila en la plantilla */
export interface PartsTemplateProduct {
  id: number;
  name: string;
  sku: string;
  model: string;
}

/** Una fila de la plantilla subida, ya normalizada */
export interface PartsTemplateRow {
  /** Número de fila en Excel (la 1 es el encabezado) */
  rowNumber: number;
  id: number | null;
  sku: string | null;
  /** `null` = celda vacía; `NaN` = había algo que no es un número */
  quantity: number | null;
}

export function getTodayDateString(): string {
  const today = new Date();
  const yyyy = today.getFullYear().toString();
  const mm = (today.getMonth() + 1).toString().padStart(2, '0');
  const dd = today.getDate().toString().padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * El nombre del archivo debe traer una fecha aaaa-mm-dd de hace 4 días o
 * menos. Solo la usa la carga a inventario, que escribe stock directo.
 */
export function validateFileDate(filename: string): {
  valid: boolean;
  error?: string;
} {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (!match) {
    return {
      valid: false,
      error:
        'El nombre del archivo no contiene una fecha en formato aaaa-mm-dd.',
    };
  }

  const [yyyy, mm, dd] = match[1].split('-').map(Number);
  const fileDate = new Date(yyyy, mm - 1, dd);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  fileDate.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - fileDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { valid: false, error: 'La fecha del archivo es futura.' };
  }
  if (diffDays > 4) {
    return {
      valid: false,
      error: `La fecha del archivo (${match[1]}) tiene más de 4 días de antigüedad. Por favor descargue una plantilla nueva.`,
    };
  }

  return { valid: true };
}

/** Descarga `Inventario_aaaa-mm-dd.xlsx` con una fila por repuesto */
export function downloadPartsTemplate(parts: PartsTemplateProduct[]) {
  const rows = parts.map((p) => [p.id, p.name, p.sku, p.model, '', '']);
  const ws = XLSX.utils.aoa_to_sheet([[...PARTS_TEMPLATE_HEADERS], ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventario');
  XLSX.writeFile(wb, `Inventario_${getTodayDateString()}.xlsx`);
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || String(value).trim() === '';
}

/**
 * Lee la primera hoja de una plantilla subida. Los encabezados se comparan
 * sin mayúsculas ni espacios; hace falta `cantidad` y al menos `id` o `sku`.
 * Devuelve todas las filas con datos: filtrar por cantidad es cosa de quien
 * la usa.
 * @throws Error con un mensaje para mostrar si el archivo no sirve
 */
export async function parsePartsTemplate(
  file: File
): Promise<PartsTemplateRow[]> {
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error('El archivo no tiene hojas.');

  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });
  const rows = raw.map((row) => {
    const normalized: Record<string, unknown> = {};
    Object.entries(row).forEach(([key, value]) => {
      normalized[key.trim().toLowerCase()] = value;
    });
    // SheetJS salta las filas en blanco: el índice en `raw` no es la fila de
    // Excel. `__rowNum__` (no enumerable, base 0) sí lo es.
    const rowNum = (row as { __rowNum__?: number }).__rowNum__;
    return { normalized, rowNumber: rowNum === undefined ? null : rowNum + 1 };
  });

  const headers = new Set(rows.flatMap((row) => Object.keys(row.normalized)));
  if (!headers.has('cantidad') || !(headers.has('id') || headers.has('sku'))) {
    throw new Error(
      'El archivo no tiene el formato de la plantilla: faltan las columnas "cantidad" y "id" o "sku".'
    );
  }

  return rows.map(({ normalized: row, rowNumber }, index) => {
    const rawId = row['id'];
    const id = isBlank(rawId) ? NaN : Number(rawId);
    const rawQuantity = row['cantidad'];
    return {
      rowNumber: rowNumber ?? index + 2,
      id: Number.isInteger(id) && id > 0 ? id : null,
      sku: isBlank(row['sku']) ? null : String(row['sku']).trim(),
      quantity: isBlank(rawQuantity) ? null : Number(rawQuantity),
    };
  });
}
