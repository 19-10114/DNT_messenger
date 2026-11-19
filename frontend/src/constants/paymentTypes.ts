import { PaymentType } from '@/models/lease.model';

export const PAYMENT_TYPES: PaymentType[] = [
  { name: 'monthly', id: 1 },
  { name: 'weekly', id: 2 },
  { name: 'biweekly', id: 3 },
  { name: '15last', id: 4 },
  { name: 'bimonthly', id: 5 },
];

export const USA_PAYMENT_METHODS = ['USD Cash', 'Zelle', 'Binance'];

export const VENEZUELA_PAYMENT_METHODS = [
  'Pago Movil',
  'Binance',
  'Bolivares Cash',
];
