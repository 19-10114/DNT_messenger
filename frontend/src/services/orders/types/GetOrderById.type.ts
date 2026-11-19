export interface AmountValue {
  source: string;
  parsedValue: number;
}

export interface OrderClient {
  id: number;
  firstName: string;
  lastName: string;
  countryId: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  inFavor?: AmountValue;
  createdAt: string;
}

export interface OrderBranch {
  id: number;
  name: string;
  type: string;
  location: string;
  contact: string;
  url: string;
  billingAddress: string;
}

export type PaymentMethodType =
  | 'pago_movil'
  | 'efectivo_usd'
  | 'efectivo_bs'
  | 'zelle'
  | 'binance'
  | 'transferencia'
  | 'abono';

export interface OrderPaymentMethod {
  id: string;
  type: PaymentMethodType;
  amount: number;
  currency: 'USD' | 'BS';
  reference?: string;
  originBank?: string;
  targetBank?: string;
  phoneNumber?: string;
  originAccount?: string;
  targetAccount?: string;
}

export interface OrderSeller {
  id: number;
  firstName: string;
  lastName: string;
}

export interface OrderDetailsResponseData {
  id: number;
  client: OrderClient | number;
  originBranch: OrderBranch | number;
  targetBranch: OrderBranch | number;
  totalBs: AmountValue;
  totalUsd: AmountValue;
  invoiceNumber: string;
  type: 'sale' | 'purchase';
  notes?: string;
  totalInvoiceBs: AmountValue;
  totalInvoiceUsd: AmountValue;
  paymentMethods: OrderPaymentMethod[];
  createdAt: string;
  seller?: OrderSeller | null;
}

export interface GetOrderByIdResponse {
  message: string;
  data: OrderDetailsResponseData;
}
