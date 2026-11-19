import { BranchesResults } from '@/services/transactions/types/GetAllTransactions';

/**
 * Traspaso entre el inventario de motos y la ficha de una moto usada.
 *
 * Al abrir la ficha se guarda desde dónde se salió y la fila completa; al
 * volver, la tabla la consume para reabrir su modal tal como estaba. Viaja la
 * fila entera y no su id porque la paginación de la tabla es estado local: si
 * el usuario estaba en la página 4, al regresar esa fila no está cargada y no
 * habría forma de encontrarla.
 *
 * Se usa `sessionStorage` (no un store) para que sobreviva a la navegación
 * entre rutas y muera con la pestaña.
 */

const STORAGE_KEY = 'usedBikeReturn';

/**
 * Pasado este tiempo la entrada se descarta. Sin esto, un usuario que abre la
 * ficha y se va por otro lado se encontraría el modal abierto solo al volver a
 * la pantalla de inventario, mucho después y sin pedirlo.
 */
const MAX_AGE_MS = 30 * 60 * 1000;

export interface UsedBikeReturn {
  /** Ruta desde la que se abrió la ficha */
  returnPath: string;
  /** Fila del inventario que tenía el modal abierto */
  bike: BranchesResults;
  savedAt: number;
}

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function clearUsedBikeReturn(): void {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(STORAGE_KEY);
}

/** Deja anotado a dónde volver antes de navegar a la ficha */
export function saveUsedBikeReturn(
  entry: Omit<UsedBikeReturn, 'savedAt'>
): void {
  if (!isBrowser()) return;

  window.sessionStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ ...entry, savedAt: Date.now() })
  );
}

/** Lee la entrada pendiente sin consumirla; descarta la que ya venció */
export function readUsedBikeReturn(): UsedBikeReturn | null {
  if (!isBrowser()) return null;

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as UsedBikeReturn;

    // Basura de una versión anterior o escrita a mano: se ignora
    if (!parsed?.returnPath || !parsed?.bike) {
      clearUsedBikeReturn();
      return null;
    }

    if (Date.now() - (parsed.savedAt ?? 0) > MAX_AGE_MS) {
      clearUsedBikeReturn();
      return null;
    }

    return parsed;
  } catch {
    clearUsedBikeReturn();
    return null;
  }
}

/**
 * Entrega la fila pendiente si corresponde a esta ruta y la borra: el modal se
 * reabre una sola vez.
 * @param path - Ruta actual, para no reabrirlo en una pantalla distinta
 */
export function consumeUsedBikeReturn(path: string): BranchesResults | null {
  const pending = readUsedBikeReturn();
  if (!pending || pending.returnPath !== path) return null;

  clearUsedBikeReturn();
  return pending.bike;
}
