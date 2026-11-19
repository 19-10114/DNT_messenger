import axios from 'axios';
import { CashWithdrawalDestination } from '@/services/cashWithdrawals/types/CashWithdrawal.type';

export const DESTINATION_LABELS: Record<CashWithdrawalDestination, string> = {
  deposito_banco: 'Depósito a banco',
  entrega_socio: 'Entrega a socio',
  pago_empire: 'Pago a Empire',
  utilidades: 'Utilidades',
  otro: 'Otro',
};

/**
 * Quién saca efectivo de una sucursal: gerente, administrador, finanzas o
 * admin (o superusuario no staff). Misma regla que `can_create_withdrawals`
 * del backend.
 */
export function canCreateCashWithdrawals(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return (
    (isSuperuser === true && isStaff === false) ||
    roles.some((role) =>
      ['manager', 'administrator', 'finance', 'admin'].includes(role)
    )
  );
}

const BACKEND_MESSAGES: Record<string, string> = {
  'You are not allowed to take cash out of a branch':
    'No tienes permiso para sacar efectivo de una sucursal.',
  'You can only take cash out of your own branch':
    'Solo puedes sacar efectivo de tu sucursal.',
  'Say what the cash is for': 'Indica para qué es el efectivo.',
  'Say who received the cash': 'Indica quién recibe el efectivo.',
  'The cash withdrawal is already cancelled': 'La salida ya estaba anulada.',
  'Only an admin, or whoever registered it on the same day, can cancel it':
    'Solo un admin, o quien la registró el mismo día, puede anularla.',
  'A reason is required': 'Indica el motivo.',
};

const AVAILABLE_RE = /^The branch only has (-?[\d.]+) USD in cash$/;

export function getCashWithdrawalErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    const message = data?.message;
    if (message) {
      const available = message.match(AVAILABLE_RE);
      if (available) {
        return `La sucursal solo tiene $${available[1]} en efectivo.`;
      }
      return BACKEND_MESSAGES[message] ?? message;
    }
  }
  return fallback;
}
