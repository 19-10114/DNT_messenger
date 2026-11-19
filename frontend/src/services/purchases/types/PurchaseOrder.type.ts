export type PurchaseOrderCategory = 'bikes' | 'parts';
export type PurchaseOrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'rejected';

export interface PurchaseOrderBranch {
  id: number;
  name: string;
  type: string;
}

export interface PurchaseOrderUser {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface PurchaseOrderLineProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  /** Repuestos only -- misma tasa por producto usada en el carrito, para
   * poder reconstruir el desglose de impuestos en el detalle ya creado. */
  tax: { iva: number; igtf: number } | null;
  /** Costo de catálogo actual del producto -- distinto de `line.cost` (el
   * costo con el que se guardó ESTA línea). Se usa al editar para decidir
   * si el costo de la línea sigue bloqueado (catálogo != 0), igual que al
   * agregarla por primera vez. */
  cost: number | null;
}

export interface PurchaseOrderLine {
  id: number;
  purchaseOrder: number;
  product: PurchaseOrderLineProduct;
  quantity: number;
  cost: number;
  /** Bikes only -- blank for parts lines. */
  plate: string;
  color: string;
  chassisSerial: string;
  motorSerial: string;
  year: string;
  invoiceNumber: string;
  inNumber: string;
  notes: string;
  /** Bikes only -- número de aprobación de Empire, normalizado. */
  approvalNumber: string;
}

export interface PurchaseOrder {
  id: number;
  originBranch: PurchaseOrderBranch;
  targetBranch: PurchaseOrderBranch;
  category: PurchaseOrderCategory;
  status: PurchaseOrderStatus;
  createdBy: PurchaseOrderUser;
  approvedBy: PurchaseOrderUser | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  resultingOrder: number | null;
  createdAt: string;
  lastUpdated: string;
  lines: PurchaseOrderLine[];
  notes: string;
}

/** One line as sent to the API -- product id, not the nested object. */
export interface PurchaseOrderLinePayload {
  product: number;
  quantity: number;
  cost: number;
  plate?: string;
  color?: string;
  chassis_serial?: string;
  motor_serial?: string;
  year?: string;
  invoice_number?: string;
  in_number?: string;
  notes?: string;
  /** Bikes only, obligatorio: la aprobación de Empire a la que cuenta. */
  approval_number?: string;
}

export interface CreatePurchaseOrderPayload {
  target_branch: number;
  category: PurchaseOrderCategory;
  lines: PurchaseOrderLinePayload[];
  /** Defaults to 'pending_approval' on the backend when omitted. */
  status?: 'draft' | 'pending_approval';
  notes?: string;
}

export interface UpdatePurchaseOrderPayload {
  target_branch?: number;
  category?: PurchaseOrderCategory;
  lines?: PurchaseOrderLinePayload[];
  status?: 'draft' | 'pending_approval';
  notes?: string;
}

export interface GetAllPurchaseOrdersQueryParams {
  page?: string;
  pageSize?: string;
  category?: PurchaseOrderCategory;
  status?: PurchaseOrderStatus;
}

/** Dónde más aparece ya la placa o un serial de una moto. */
export interface BikeIdentityConflict {
  field: 'plate' | 'chassis_serial' | 'motor_serial';
  value: string;
  /** `inventory`: una moto del sistema; `preorder`: otra preorden abierta. */
  source: 'inventory' | 'preorder';
  /** Placa de la moto con la que choca. */
  plate: string;
  purchaseOrderId: number | null;
}

export interface BikeIdentityCheckPayload {
  plate: string;
  chassis_serial: string;
  motor_serial: string;
  /** Al editar, la propia preorden no cuenta como choque. */
  purchase_order?: number;
}

export interface PurchaseOrderResponse {
  message: string;
  data: PurchaseOrder;
}
