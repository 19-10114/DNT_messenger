import { Pagination } from '@/models/pagination.model';

/**
 * Tipos del módulo "Solicitudes Arranca" (solicitudes de motos que Arranca le
 * hace a una sucursal de Moto Candela). Contrato completo entre los dos
 * sistemas: `BIKE-REQUESTS-INTEGRATION.md` en el backend.
 */

/**
 * Estado de una solicitud. Todos salen de los contadores menos `cancelled`,
 * que lo pone Arranca y es definitivo.
 */
export const BIKE_REQUEST_STATUSES = [
  'pending',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type BikeRequestStatus = (typeof BIKE_REQUEST_STATUSES)[number];

/**
 * El backend puede serializar los decimales como string (`"1450.00"`) o como
 * número; se tipan las dos formas y se convierten con `Number()` al mostrarlos.
 */
export type BikeRequestMoney = number | string;

/** Sistema en el que actuó una persona. */
export type BikeRequestSystem = 'arranca' | 'moto_candela';

/**
 * Quién creó o tocó por última vez la solicitud. `userId` es el usuario de
 * Moto Candela solo cuando `system` es `moto_candela`; si no, `null`.
 */
export interface BikeRequestActor {
  system: BikeRequestSystem;
  name: string;
  userId: number | null;
}

export interface BikeRequestBranch {
  id: number;
  name: string;
}

export interface BikeRequestProduct {
  id: number;
  name: string;
  model: string;
  brand: string;
}

export interface BikeRequestLine {
  id: number;
  syncId: string;
  product: BikeRequestProduct;
  /** Color pedido; informativo, la moto entregada puede ser de otro. */
  color: string;
  quantity: number;
  /** Precio Arranca (DP) congelado al registrar la solicitud. */
  unitPrice: BikeRequestMoney;
  lineTotal: BikeRequestMoney;
  deliveredQuantity: number;
  /** `0` cuando la solicitud está cancelada. */
  remainingQuantity: number;
}

export interface BikeRequestDelivery {
  id: number;
  syncId: string;
  lineId: number;
  lineSyncId: string;
  plate: string;
  chassis: string;
  /** Color real de la moto entregada. */
  color: string;
  year: string;
  /** Sucursal MC de la que salió: es donde la moto sigue físicamente. */
  mcBranch: BikeRequestBranch;
  unitPrice: BikeRequestMoney;
  deliveredAt: string;
  deliveredBy: string;
  /** Con valor, la entrega se anuló (se revirtió la venta) y no cuenta. */
  undoneAt: string | null;
  transactionId?: number | null;
  bikeUnitId?: number | null;
}

export interface BikeRequest {
  id: number;
  syncId: string;
  /** `SOL-00042`, lo genera Arranca. */
  code: string;
  mcBranch: BikeRequestBranch;
  status: BikeRequestStatus;
  requestedQuantity: number;
  deliveredQuantity: number;
  /** `deliveredQuantity / requestedQuantity`, de 0 a 1. */
  progress: number;
  totalAmount: BikeRequestMoney;
  deliveredAmount: BikeRequestMoney;
  observations: string;
  cancelReason: string;
  cancelledAt: string | null;
  completedAt: string | null;
  createdAt: string;
  lastModified: string;
  createdBy: BikeRequestActor;
  updatedBy: BikeRequestActor;
  lines: BikeRequestLine[];
  /** Solo en el detalle; del más reciente al más antiguo, incluye las anuladas. */
  deliveries?: BikeRequestDelivery[];
}

/** Envoltorio estándar de la API (`{ message, data }`). */
export interface BikeRequestEnvelope<T> {
  message: string;
  data: T;
}

/**
 * Cantidad por estado bajo los demás filtros. Las claves llegan en camelCase
 * (`inProgress`) aunque el valor del estado sea `in_progress`.
 */
export interface BikeRequestStatusCounts {
  all: number;
  pending: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface BikeRequestPage extends Pagination<BikeRequest> {
  staticData?: { statusCounts: BikeRequestStatusCounts };
}

export interface GetBikeRequestsQueryParams {
  page?: number;
  pageSize?: number;
  status?: BikeRequestStatus;
  /** Código, nombre de producto, o placa / chasis entregados. */
  search?: string;
  /** `yyyy-mm-dd`, inclusivo, sobre `createdAt` (día de Caracas). */
  startDate?: string;
  /** `yyyy-mm-dd`, inclusivo, sobre `createdAt` (día de Caracas). */
  endDate?: string;
}

/** Una moto que hoy puede llenar una línea de la solicitud. */
export interface BikeRequestAvailableUnit {
  bikeUnitId: number;
  plate: string;
  chassis: string;
  color: string;
  year: string;
  gpsImei: string;
  /** El color coincide con el pedido (sin distinguir mayúsculas). */
  colorMatches: boolean;
}

export interface BikeRequestAvailableLine {
  lineId: number;
  lineSyncId: string;
  product: BikeRequestProduct;
  requestedColor: string;
  remainingQuantity: number;
  unitPrice: BikeRequestMoney;
  /**
   * En stock en la sucursal de la solicitud, con GPS, mismo producto, no
   * usadas; primero las del color pedido. Una misma moto aparece en todas las
   * líneas de su producto.
   */
  units: BikeRequestAvailableUnit[];
}

export interface BikeRequestAvailableUnits {
  requestId: number;
  mcBranch: BikeRequestBranch;
  /** Solo las líneas a las que les falta algo. */
  lines: BikeRequestAvailableLine[];
}

export interface FulfillBikeRequestPayload {
  units: { lineId: number; bikeUnitId: number }[];
  /** Opcional, hasta 15 caracteres (el `invoice_number` de la transacción). */
  invoiceNumber?: string;
}

/** Una línea pendiente de una solicitud abierta ("Motos por entregar"). */
export interface BikeRequestPendingUnitRow {
  requestId: number;
  requestCode: string;
  requestStatus: BikeRequestStatus;
  requestCreatedAt: string;
  mcBranch: BikeRequestBranch;
  lineId: number;
  product: BikeRequestProduct;
  color: string;
  quantity: number;
  deliveredQuantity: number;
  remainingQuantity: number;
  unitPrice: BikeRequestMoney;
  remainingAmount: BikeRequestMoney;
}

export interface BikeRequestPendingUnitsByProduct {
  product: BikeRequestProduct;
  remainingQuantity: number;
  remainingAmount: BikeRequestMoney;
}

export interface BikeRequestPendingUnits {
  /** De la solicitud más antigua a la más nueva. */
  rows: BikeRequestPendingUnitRow[];
  totals: {
    requests: number;
    remainingQuantity: number;
    remainingAmount: BikeRequestMoney;
    byProduct: BikeRequestPendingUnitsByProduct[];
  };
}
