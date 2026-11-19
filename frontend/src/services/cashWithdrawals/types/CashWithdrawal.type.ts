import { ExpenseUser } from '@/services/expenses/types/Expense.type';

/** A dónde fue el efectivo. Mismo vocabulario que el backend. */
export type CashWithdrawalDestination =
  | 'deposito_banco'
  | 'entrega_socio'
  | 'pago_empire'
  | 'utilidades'
  | 'otro';

export type CashWithdrawalStatus = 'registered' | 'cancelled';

/**
 * Salida de efectivo: USD que un gerente saca de la caja de la sucursal. No es
 * un gasto: solo baja el efectivo de la sede (`/api/cash-withdrawals/`).
 */
export interface CashWithdrawal {
  id: number;
  /** "GRN-S12": código de la sucursal, S de salida, id. */
  displayCode: string;
  branch: { id: number; name: string; code: string | null };
  createdBy: ExpenseUser;
  destination: CashWithdrawalDestination;
  destinationLabel: string;
  concept: string;
  deliveredTo: string;
  reference: string;
  amountUsd: number;
  notes: string;
  receiptUrl: string | null;
  receiptMime: string;
  status: CashWithdrawalStatus;
  cancelledBy: ExpenseUser | null;
  cancelledAt: string | null;
  cancelReason: string;
  createdAt: string;
  /** Lo decide el backend: admin siempre; quien la registró, el mismo día. */
  canCancel: boolean;
}

export interface CreateCashWithdrawalPayload {
  branch: number;
  destination: CashWithdrawalDestination;
  concept?: string;
  deliveredTo: string;
  reference?: string;
  /** Número en texto plano ("1234.56"). */
  amountUsd: string;
  notes?: string;
  receipt?: File;
}
