import { Pagination } from '@/models/pagination.model';

export type OrderPaymentType =
  | 'pago_movil'
  | 'punto_de_venta'
  | 'efectivo_usd'
  | 'efectivo_bs'
  | 'zelle'
  | 'binance'
  | 'transferencia'
  | 'abono';

export interface OrderPaymentMethodDetail {
  id: string;
  type: OrderPaymentType;
  // Campos opcionales según el método de pago
  originBank?: string; // Banco origen (pago móvil / transferencia)
  targetBank?: string; // Banco destino (pago móvil / transferencia)
  phoneNumber?: string; // Pago móvil
  originAccount?: string; // Transferencia
  targetAccount?: string; // Transferencia
  confirmationId?: string; // Zelle/Binance
  beneficiary?: string; // Zelle/Binance
  amountBs?: number; // Monto en Bolívares
  amountUsd?: number; // Monto en USD
  amount?: number; // Monto genérico
  currency?: 'USD' | 'Bs' | string; // Moneda para 'amount'
  reference?: string; // Referencia genérica
  /** Notas asociadas a la orden. Puede venir como texto plano o lista de notas. */
  notes?: string | string[];
}

export interface OrderClientData {
  id: number;
  firstName: string;
  lastName: string;
  countryId?: string;
  phoneNumber?: string;
  email?: string;
  address?: string;
  city?: string;
  createdAt?: string;
  inFavor?: number | { source: string; parsedValue: number };
  residenceType?: string;
  street?: string;
  residence?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  localPhoneNumber?: string;
}

export interface SellerData {
  id: number;
  firstName: string;
  lastName: string;
}

export interface OrderData {
  id: number;
  client: OrderClientData | null;
  totalBs?: number | { source: string; parsedValue: number };
  totalUsd?: number | { source: string; parsedValue: number };
  invoiceNumber?: string;
  type?: 'sale' | 'purchase';
  /** `canceled` = la orden fue revertida; sus líneas ya no existen. */
  status?: 'completed' | 'canceled' | 'incomplete';
  notes?: string;
  totalInvoiceBs: number | { source: string; parsedValue: number };
  totalInvoiceUsd?: number | { source: string; parsedValue: number };
  taxableAmount?: number | { source: string; parsedValue: number };
  rate?: number | { source: string; parsedValue: number };
  domReserve?: string;
  domNumber?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  insuranceExpiration?: string;
  observations?: string;
  residenceType?: string;
  street?: string;
  residence?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  localPhoneNumber?: string;
  paymentMethods: OrderPaymentMethodDetail[];
  billed?: boolean;
  deliveryNoteNumber?: string;
  /** Nombres de los productos de la orden (lista de pre órdenes). */
  lineSummary?: string;
  createdAt: string;
  originBranch?:
    | number
    | {
        id: number;
        name: string;
        type?: string;
        location?: string | null;
        contact?: string | null;
        url?: string | null;
        billingAddress?: string | null;
      };
  targetBranch?:
    | number
    | {
        id: number;
        name: string;
        type?: string;
        location?: string | null;
        contact?: string | null;
        url?: string | null;
        billingAddress?: string | null;
      };
  seller?: SellerData;
}

export interface GetOrdersBackendResponse {
  message: string;
  data: Pagination<OrderData>;
}

export interface Transaction {
  id: number;
  product: {
    id: number;
    sku: string;
    name: string;
    model: string;
    brand: string;
    category: number;
    isFeatured: boolean;
    cost: number | null;
    createdAt: string;
    lastUpdated: string;
    ekAvailable: boolean;
    packageQuantity: number | null;
  };
  originBranch: {
    id: number;
    name: string;
    type: string;
    location: any;
    contact: any;
    url: any;
  };
  targetBranch: {
    id: number;
    name: string;
    type: string;
    location: any;
    contact: any;
    url: any;
  };
  user: {
    id: number;
    email: string;
    documentId: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  responsible: {
    id: number;
    email: string;
    documentId: string;
    username: string;
    firstName: string;
    lastName: string;
  };
  orderNumber: number;
  orderId: string;
  plate: string;
  color: string;
  serialNumber: string;
  motorSerial?: string;
  inNumber: string;
  outNumber: string;
  year: string;
  invoiceNumber: string;
  receptionDate: string;
  createdAt: string;
  amount: { source: string; parsedValue: number };
  tax: { source: string; parsedValue: number };
  quantity: { source: string; parsedValue: number };
  type: string;
  notes: string;
  reserved: boolean;
  mfb: boolean;
  invoiceOrigin: any;
  deposit: any;
}

export interface GetTransactionsByOrderResponse {
  message: string;
  data: Pagination<Transaction>;
}

export interface InventoryColor {
  color: string;
  quantity: number;
}

export interface InventoryItem {
  productId: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  totalQuantity: number;
  colors?: InventoryColor[];
}

export interface InventoryDeliveryNotesData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: InventoryItem[];
}

export interface InventoryDeliveryNotesResponse {
  message: string;
  data: InventoryDeliveryNotesData;
}
