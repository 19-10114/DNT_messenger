import { Pagination } from '@/models/pagination.model';

/**
 * Tipos del módulo "Aprobaciones Empire": lo que Empire Keeway aprobó
 * entregar a Moto Candela (por modelo, sin color) y cuánto ya llegó. Cada
 * moto comprada a Empire con ese número cuenta sola al registrarse.
 */

/**
 * Estado de una aprobación. Todos salen de los contadores menos `closed`,
 * que lo pone una persona cuando Empire no enviará el resto.
 */
export const APPROVAL_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'closed',
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export interface ApprovalBranch {
  id: number;
  name: string;
}

export interface ApprovalProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
}

export interface ApprovalUserRef {
  id: number;
  name: string;
}

/** Cuántas motos de un modelo van a una sucursal. */
export interface ApprovalLine {
  id: number;
  /** Sucursal a la que deben llegar estas motos. */
  branch: ApprovalBranch;
  product: ApprovalProduct;
  quantity: number;
  receivedQuantity: number;
  /** `0` cuando la aprobación está cerrada. */
  remainingQuantity: number;
}

/** Una moto registrada como compra con el número de la aprobación. */
export interface ApprovalReceipt {
  id: number;
  lineId: number;
  product: ApprovalProduct;
  transactionId: number;
  bikeUnitId: number | null;
  /** Sucursal que recibió la moto: cualquiera, no solo la de la aprobación. */
  branch: ApprovalBranch;
  plate: string;
  chassisSerial: string;
  motorSerial: string;
  color: string;
  year: string;
  receivedAt: string;
  receivedBy: ApprovalUserRef | null;
  /** Con valor, la compra se anuló y la moto ya no cuenta. */
  undoneAt: string | null;
}

export interface ApprovalReceivedByBranch {
  branch: ApprovalBranch;
  receivedQuantity: number;
}

export interface ApprovalLinkedPurchases {
  linked: number;
  notLinked: {
    transactionId: number;
    plate: string;
    reason: 'not_in_approval_for_branch' | 'line_full';
    model: string;
    branchId: number;
  }[];
}

export interface Approval {
  id: number;
  /** Número de Empire, normalizado (sin espacios, en mayúsculas). */
  number: string;
  /** `yyyy-mm-dd`, la fecha del documento de Empire. */
  approvalDate: string;
  /** Sucursal que cargó la aprobación. A dónde va cada moto está en las líneas. */
  branch: ApprovalBranch;
  status: ApprovalStatus;
  requestedQuantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  /** `receivedQuantity / requestedQuantity`, de 0 a 1. */
  progress: number;
  notes: string;
  completedAt: string | null;
  closedAt: string | null;
  closeReason: string;
  closedBy: ApprovalUserRef | null;
  hasDocument: boolean;
  documentName: string | null;
  documentMime: string | null;
  documentUploadedAt: string | null;
  createdBy: ApprovalUserRef | null;
  updatedBy: ApprovalUserRef | null;
  createdAt: string;
  lastModified: string;
  lines: ApprovalLine[];
  /** Solo en el detalle; de la más reciente a la más antigua, con las anuladas. */
  receipts?: ApprovalReceipt[];
  /** Solo en el detalle. URL firmada que vence en minutos: pedirla al abrir. */
  documentUrl?: string | null;
  /** Solo en el detalle. */
  receivedByBranch?: ApprovalReceivedByBranch[];
  /** Solo en la respuesta de crear. */
  linkedPurchases?: ApprovalLinkedPurchases;
}

export interface ApprovalEnvelope<T> {
  message: string;
  data: T;
}

export interface ApprovalStatusCounts {
  all: number;
  pending: number;
  inProgress: number;
  completed: number;
  closed: number;
}

export interface ApprovalPage extends Pagination<Approval> {
  staticData?: { statusCounts: ApprovalStatusCounts };
}

export interface GetApprovalsQueryParams {
  page?: number;
  pageSize?: number;
  /** `open` = pendientes y en curso. */
  status?: ApprovalStatus | 'open';
  /** Número, modelo, o placa / chasis recibidos. */
  search?: string;
}

/** Una línea por (sucursal, modelo). */
export interface ApprovalLinePayload {
  product: number;
  branch: number;
  quantity: number;
}

export interface MoveApprovalBikesPayload {
  product: number;
  fromBranch: number;
  toBranch: number;
  quantity: number;
}

export interface CreateApprovalPayload {
  number: string;
  approvalDate: string;
  branch: number;
  notes?: string;
  lines: ApprovalLinePayload[];
}

export type UpdateApprovalPayload = Partial<CreateApprovalPayload>;

/** Una línea de una aprobación abierta a la que le faltan motos. */
export interface ApprovalPendingRow {
  approvalId: number;
  approvalNumber: string;
  approvalDate: string;
  approvalStatus: ApprovalStatus;
  daysOpen: number;
  /** Sucursal a la que deben llegar. */
  branch: ApprovalBranch;
  /** Sucursal que cargó la aprobación. */
  requestedBy: ApprovalBranch;
  lineId: number;
  product: ApprovalProduct;
  quantity: number;
  receivedQuantity: number;
  remainingQuantity: number;
  /** Motos ya cargadas en preórdenes de compra abiertas con este número. */
  inPreorders: number;
}

export interface ApprovalPendingByProduct {
  product: ApprovalProduct;
  remainingQuantity: number;
  inPreorders: number;
  approvals: number;
}

/**
 * Sucursales × modelos, solo los que tienen algo por recibir. `cells` va en
 * el orden de `products`.
 */
export interface ApprovalPendingMatrix {
  products: { product: ApprovalProduct; total: number }[];
  branches: { branch: ApprovalBranch; total: number; cells: number[] }[];
  total: number;
}

export interface ApprovalPendingUnits {
  rows: ApprovalPendingRow[];
  byProduct: ApprovalPendingByProduct[];
  matrix: ApprovalPendingMatrix;
  totals: {
    approvals: number;
    bikes: number;
    models: number;
    branches: number;
    oldestDaysOpen: number;
  };
}

/** Lo que falta por recibir de un modelo en una sucursal (vistas de inventario). */
export interface ApprovalPendingByModel {
  productId: number;
  product: ApprovalProduct;
  remainingQuantity: number;
}

/** Un resultado del autocompletado del número de aprobación. */
export interface ApprovalSearchResult {
  id: number;
  number: string;
  approvalDate: string;
  status: ApprovalStatus;
  branch: ApprovalBranch;
  remainingQuantity: number;
  /** Solo si se consultó con sucursal. */
  remainingForBranch: number | null;
}

/** Lo que muestra el carrito de compra mientras se escribe el número. */
export interface ApprovalLookupLine {
  lineId: number;
  /** Sucursal a la que va esta línea: el cupo es por sucursal. */
  branch: ApprovalBranch;
  product: ApprovalProduct;
  quantity: number;
  receivedQuantity: number;
  inPreorders: number;
  /** Lo que aún se puede cargar: aprobadas − recibidas − en otras preórdenes. */
  availableQuantity: number;
}

export interface ApprovalLookup {
  id: number;
  number: string;
  approvalDate: string;
  branch: ApprovalBranch;
  status: ApprovalStatus;
  acceptsBikes: boolean;
  lines: ApprovalLookupLine[];
}
