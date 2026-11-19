import { BranchItem } from '@/services/branches/types/Branch.type';

/**
 * Ciclo de vida de una unidad GPS, en el orden en el que normalmente avanza
 * (espejo de `STATUS_CHOICES` en `gps/models.py` del backend):
 *   available  -> en mano, sin asignar, lista para entregar
 *   pending    -> asignada/solicitada pero todavía sin mover físicamente
 *   on_branch  -> en una sucursal (`targetBranch`)
 *   on_street  -> vendida, ya con su cliente final, fuera de sucursal
 *   installed  -> instalada en una moto; terminal en la práctica
 */
export const GPS_STATUSES = [
  'available',
  'pending',
  'on_branch',
  'on_street',
  'installed',
] as const;

export type GpsStatus = (typeof GPS_STATUSES)[number];

/**
 * `responsible` viene recortado por el backend (RESPONSIBLE_FIELDS): un GPS
 * necesita decir quién responde por él, no cargar su lista de permisos.
 */
export interface GpsResponsible {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  documentId?: string | null;
  phoneNumber?: string | null;
  branch?: BranchItem | null;
}

export interface GpsUnit {
  id: number;
  imei: string;
  number: string;
  status: GpsStatus;
  model: string;
  brand: string;
  createdAt: string;
  lastUpdated: string;
  responsible: GpsResponsible | null;
  /** Texto libre: el proveedor/importador de origen, fuera de Moto Candela. */
  originBranch: string;
  /** Sucursal de Moto Candela donde está la unidad, cuando está en una. */
  targetBranch: BranchItem | null;
  /**
   * Traslado entre sucursales esperando a la sucursal que recibe. Mientras
   * existe, `targetBranch` ya es la que recibe (el cambio ya está en Arranca)
   * y esta es la que lo envió: si se rechaza, la unidad vuelve allí.
   * `null` cuando no hay nada pendiente.
   */
  transferFromBranch: GpsTransferBranch | null;
  transferRequestedBy: GpsTransferRequester | null;
  transferRequestedAt: string | null;
}

/** Sucursal de un traslado: solo lo que la pantalla muestra. */
export interface GpsTransferBranch {
  id: number;
  name: string;
}

export interface GpsTransferRequester {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
}

/** Fila de "Por recibir": dice si quien mira puede decidir sobre ella. */
export interface GpsIncomingTransfer extends GpsUnit {
  canDecide: boolean;
}

/**
 * Traslados pendientes de una sucursal (`/gps/transfers/<id>`). Con la
 * sucursal `0` todo lo pendiente viene en `incoming` y `outgoing` va vacío.
 */
export interface GpsTransfers {
  incoming: GpsIncomingTransfer[];
  outgoing: GpsUnit[];
}

export type GpsTransferDecision = 'accept' | 'decline';

/** Envoltorio estándar de la API (`{ message, data }`). */
export interface GpsEnvelope<T> {
  message: string;
  data: T;
}

export interface GetGpsUnitsQueryParams {
  page?: number;
  pageSize?: number;
  status?: GpsStatus;
  responsible?: number;
  search?: string;
}

/**
 * Escrituras: `targetBranch` es un id plano (las lecturas lo devuelven
 * expandido). El parser camelCase del backend traduce las claves.
 *
 * **`responsible` no está acá a propósito.** El backend lo asigna solo, con el
 * usuario que hace el request (es `read_only` en `GpsUnitSerializer`), así que
 * no hay nada que elegir: mandarlo no da error, simplemente se ignora. Tocar
 * una unidad te deja como responsable de ella.
 */
export interface UpdateGpsUnitPayload {
  imei?: string;
  number?: string;
  status?: GpsStatus;
  model?: string;
  brand?: string;
  originBranch?: string;
  targetBranch?: number | null;
}

/** Resultado de traer el inventario completo de unidades (todas las páginas). */
export interface GpsUnitsSnapshot {
  units: GpsUnit[];
  totalElements: number;
  /**
   * `true` cuando el inventario superó el techo de páginas que el snapshot
   * trae: la vista lo avisa en lugar de mostrar KPIs incompletos en silencio.
   */
  isTruncated: boolean;
}
