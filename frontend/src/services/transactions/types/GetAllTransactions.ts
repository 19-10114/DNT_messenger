export interface TransactionData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: TransactionDataResult[];
}

export interface TransactionDataResult {
  id: number;
  amount: {
    source: string;
    parsedValue: number;
  };
  tax?: {
    source: string;
    parsedValue: number;
  };
  quantity?: {
    source: string;
    parsedValue: number;
  };
  type: string;
  description?: string;
  createdAt: Date;
  dateDelivered?: Date;
  receptionDate?: Date;
  product: {
    id: number;
    sku: string;
    name: string;
    model: string;
    brand: string;
    category: number;
    createdAt: string;
    cost?: number;
    price?: number;
  };
  originBranch?: {
    id: number;
    name: string;
    type: string;
    /** Empire Keeway: transactions from here are purchases, not transfers. */
    isSupplier?: boolean;
  };
  targetBranch?: {
    id: number;
    name: string;
    type: string;
    /** Accounting destination (e.g. "Ventas", "Dale Play"): a transaction
     * sent here is a sale, not a transfer. */
    isSaleAccount?: boolean;
  };
  user?: {
    id: number;
    username: string;
    branch?: {
      id: number;
      name: string;
      type: string;
    };
  };
  responsible?: {
    id: number;
    username: string;
    branch?: {
      id: number;
      name: string;
      type: string;
    };
  };
  orderId?: string;
  orderNumber?: number | null;
  /** Client of the transaction's order, when it has one and a client is set
   * (transfers and supplier purchases usually don't). */
  client?: {
    id: number;
    firstName: string;
    lastName: string;
    countryId?: string;
    phoneNumber?: string;
  } | null;
  plate?: string;
  color?: string;
  serialNumber?: string;
  motorSerial?: string;
  in_number?: string;
  out_number?: string;
  year?: string;
  invoiceNumber?: string;
  case?: string;
  lease?: number;
  responsable?: number;
  notes?: string;
  inNumber?: string;
  invoiceOrigin?: any;
  mechanic?: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface TransactionDataPayload {
  id?: string;
  order_id: string;
  plate: string;
  color: string;
  serial_number: string;
  motor_serial?: string;
  year: string;
  invoice_number: string;
  invoice_origin?: string;
  reception_date: string;
  amount: string;
  tax: string;
  quantity: string;
  type: Type;
  product: string;
  productName?: string; // Campo opcional para mostrar el nombre del producto en la interfaz
  origin_branch: string;
  target_branch: string;
  user: string;
  responsible: string;
  in_number?: string;
  out_number?: string;
  notes?: string;
}

export interface DebtPayload {
  first_branch: string;
  second_branch: string;
}

export enum Description {
  //EXPERIMENTAL
  VentaEKExpressPaleta = 'Venta EK Express Paleta',
  VentaNewHorse = 'Venta New Horse',
  VentaNewOwen = 'Venta New Owen',
}

export enum Type {
  //EXPERIMENTAL
  Sale = 'sale',
  Income = 'income',
  Payment = 'payment',
  Wholesale = 'wholesale',
  Purchase = 'purchase',
}

export interface GetTransactionsBackendResponseType {
  message: string;
  data: TransactionData;
}

export interface GetAllServiceQueryParametersType {
  page?: string;
  pageSize?: string;
  search?: string;
  category?: 'finance' | 'mfb' | 'bikes' | 'parts' | 'services';
  start?: string; // YYYY-MM-DD format
  finish?: string; // YYYY-MM-DD format
  branch?: string;
  /** Exact origin branch id, independent from `branch` (the page's current
   * branch scope) and combinable with `targetBranch`. */
  originBranch?: string;
  /** Exact target branch id, independent from `originBranch`. */
  targetBranch?: string;
  model?: string;
}

export interface GetTransactionsKpiBackendResponseType {
  message: string;
  data: TransactionsKpi;
}

export interface TransactionsKpi {
  bikeSales: number;
  income: number;
  payment: number;
  Balance: number;
}

export interface GetBalanceResponse {
  message: string;
  data: BalanceData;
}

export interface BalanceData {
  boughtAmount: number;
  soldAmount: number;
  inventoryAmount: number;
  bikeInventoryAmount: number;
  partInventoryAmount: number;
  bikeInventory: BikeInventory;
  partInventory: PartInventory;
  currentPage?: number;
  pageSize?: number;
  totalElements?: number;
  totalPages?: number;
}

export interface BikeInventory {
  received: BranchesResults[];
  sent: any[];
  inventory: BranchesResults[];
}

export interface BranchesResults {
  id: number;
  plate: string;
  color: string;
  serialNumber: string;
  chasisNumber?: string;
  year: string;
  receptionDate: Date;
  amount: number;
  /** La unidad entró como moto usada, no de fábrica */
  used?: boolean;
  /**
   * Registro en `/products/usedbikes` del que salió esta unidad.
   * Puede faltar en motos usadas cargadas antes de que existiera el módulo.
   */
  usedBikeId?: number | null;
  product: BikeProduct;
  activated?: boolean;
  targetBranch?: {
    id: number;
    name: string;
    type: string;
    location: string | null;
    contact: string | null;
    url: string | null;
  };
  prices?: {
    cost?: number;
    price?: number;
  };
}

export interface BikeProduct {
  id: number;
  name: string;
  model: string;
  brand: string;
}

export interface PartInventory {
  received: BranchesResults[];
  sent: any[];
  inventory: PartInventoryData[];
}

export interface PartInventoryData {
  id: number;
  name: string;
  sku: string;
  model: string;
  brand: string;
  category: number;
  isFeatured: boolean;
  price: number;
  cost: number;
  createdAt: string;
  lastUpdated: string;
  ekAvailable: boolean;
  quantity?: string;
  globalQuantity?: string;
}

export interface BranchInventoryValue {
  branchId: number;
  branch: string;
  bikeInventoryValue: number;
  inventoryValue: number;
  totalInventoryValue: number;
}

export interface GetInventoryValueResponse {
  message: string;
  data: BranchInventoryValue[];
}

export interface GetDeliveryNotesQueryParams {
  page?: string;
  pageSize?: string;
  search?: string;
  branch?: string;
  category?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  preorder?: string;
  model?: string;
  seller?: string;
}
