export const normalizeTypeLabel = (type: string) => {
  const t = (type || '').toLowerCase();
  if (t === 'transaction' || t === 'transferencia') return 'Transferencia';
  if (t === 'order' || t === 'orden') return 'Orden';
  if (t === 'expense') return 'Gasto';
  if (t === 'withdrawal') return 'Salida de efectivo';
  if (t === 'cash_close') return 'Cierre de caja Arranca';
  return type;
};

/**
 * Fila de la lista de caja que viene del Módulo de Gastos (`type: 'expense'`,
 * `id` = id del gasto). Aparte de `canViewTransactionDetails` a propósito:
 * esa también decide qué se abre en Deudas, donde un gasto nunca aparece.
 */
export const isExpenseObject = (type: string) =>
  (type || '').toLowerCase() === 'expense';

/**
 * Fila de la lista de caja que es una salida de efectivo (`type:
 * 'withdrawal'`, `id` = id de la salida). No es un gasto: abre su propia ficha.
 */
export const isCashWithdrawalObject = (type: string) =>
  (type || '').toLowerCase() === 'withdrawal';

export const canViewTransactionDetails = (type: string) => {
  const t = (type || '').toLowerCase();
  return (
    t === 'transaction' ||
    t === 'transferencia' ||
    t === 'transaccion' ||
    t === 'order' ||
    t === 'orden'
  );
};

export const parsePriceNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = (value as any)?.parsedValue;
  return typeof parsed === 'number' ? parsed : 0;
};
