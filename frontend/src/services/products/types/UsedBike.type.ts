/**
 * Motos usadas (`/api/products/usedbikes`).
 *
 * Ojo con la asimetría lectura/escritura: `product`, `owner`, `reviewer`,
 * `responsible` y `branch` viajan como **id al escribir** y llegan como
 * **objeto anidado al leer**. `surveyResponse` es id en ambos sentidos.
 *
 * `reviewer` y `responsible` son dos personas distintas: el **mecánico** se
 * asigna a la unidad al registrarla (`reviewer`) y el **responsable de la
 * evaluación** es quien la toma desde la ficha (`responsible`).
 */

/** Vocabulario fijo de estados; el backend rechaza cualquier otro valor */
export type UsedBikeStatus =
  | 'pending'
  | 'in_review'
  | 'approved'
  | 'rejected'
  | 'sold'
  | 'cancelled';

export const USED_BIKE_STATUS_LABELS: Record<UsedBikeStatus, string> = {
  pending: 'Pendiente',
  in_review: 'En evaluación',
  approved: 'Aprobada',
  rejected: 'Rechazada',
  sold: 'Vendida',
  cancelled: 'Cancelada',
};

/** Producto de catálogo anidado en la lectura de una moto usada */
export interface UsedBikeProduct {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: number;
  cost: number;
  price: number;
  images?: string[];
}

/** Usuario anidado (dueño, mecánico o responsable); su `branch` llega como id */
export interface UsedBikeUser {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  documentId?: string;
  phoneNumber?: string;
  branch?: number | null;
}

export interface UsedBikeBranch {
  id: number;
  name: string;
  type: string;
  location?: string | null;
}

/**
 * Repuesto valorado contra la unidad.
 * Se guarda como JSON: en cada PATCH se reemplaza el arreglo completo.
 *
 * Estos cuatro campos son todo lo que se persiste: **del producto solo queda el
 * id**. Para mostrar nombre o sku al reabrir la evaluación hay que resolverlos
 * con `getProductsByIds()`.
 */
export interface UsedBikeProductPrice {
  productId: number;
  /** Unidades del repuesto; si falta, se asume 1 */
  quantity?: number;
  /** Precio **unitario**: el total de la línea es `price * quantity` */
  price: number;
  /** Hallazgo (pregunta R/M) al que se asignó: la relación con la encuesta */
  questionId?: number;
}

/** Moto usada tal como la devuelve el backend */
export interface UsedBike {
  id: number;
  product: UsedBikeProduct;
  color: string;
  /** Placa; **no es única**, no la uses como clave */
  plate: string;
  engineSerial: string | null;
  chassisSerial: string | null;
  year: number | null;
  km: number | null;
  /** Lo que pide el dueño */
  askedPrice: number | null;
  /** Lo que paga el negocio */
  cost: number | null;
  /** Precio de reventa */
  price: number | null;
  /**
   * Justiprecios con los que se aprobó la compra, guardados como `min-max`
   */
  offerA: string | null;
  offerB: string | null;
  owner: UsedBikeUser;
  /** Mecánico asignado a la unidad al registrarla */
  reviewer: UsedBikeUser | null;
  /** Quien tomó la evaluación desde la ficha */
  responsible: UsedBikeUser | null;
  /** Id de la respuesta de la encuesta de evaluación; no viene anidada */
  surveyResponse: number | null;
  /** Transacción de compra creada al aprobar; bloquea una segunda aprobación */
  purchaseTransaction: number | null;
  productPrices: UsedBikeProductPrice[];
  branch: UsedBikeBranch;
  status: UsedBikeStatus;
  createdAt: string;
  lastUpdated: string;
  notes: string | null;
}

/** POST /products/usedbikes — los relacionados van como id */
export interface CreateUsedBikePayload {
  product: number;
  color: string;
  plate: string;
  owner: number;
  branch: number;
  engineSerial?: string | null;
  chassisSerial?: string | null;
  year?: number | null;
  km?: number | null;
  askedPrice?: number | null;
  cost?: number | null;
  price?: number | null;
  /** Id del mecánico */
  reviewer?: number | null;
  /** Id del responsable de la evaluación */
  responsible?: number | null;
  surveyResponse?: number | null;
  productPrices?: UsedBikeProductPrice[];
  status?: UsedBikeStatus;
  /** Texto libre. Al aprobar guarda la forma de pago acordada con el dueño */
  notes?: string | null;
}

/**
 * PATCH /products/usedbikes/<id> — parcial, con las mismas reglas.
 *
 * Los justiprecios son la excepción al camelCase del resto del modelo: se
 * escriben en snake_case y solo por esta vía, en cuanto la calculadora
 * devuelve el rango. El endpoint de aprobación no los acepta.
 */
export type UpdateUsedBikePayload = Partial<CreateUsedBikePayload> & {
  /** Rango `min-max` sin moneda, p. ej. `"1468.80-1520.64"` */
  offer_a?: string;
  offer_b?: string;
};

export interface GetUsedBikesTableQueryParams {
  page?: number;
  pageSize?: number;
  /** Uno o varios estados; se envían separados por coma */
  status?: UsedBikeStatus[];
}

export interface UsedBikeResponse {
  message: string;
  data: UsedBike;
}

export interface UsedBikesTableResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: UsedBike[];
  };
}

export interface DeleteUsedBikeResponse {
  message: string;
  data: { success: boolean };
}

/**
 * Cuerpo de la aprobación.
 *
 * El endpoint escribe `cost` y deriva el precio de reventa con
 * `price = cost / (1 - margin/100)`: el margen es una porción del precio de
 * **venta**, así que el costo se incrementa, no se recarga. Va en la dirección
 * opuesta a la calculadora de valuación, que multiplica.
 */
export interface ApproveUsedBikePayload {
  /** Lo acordado con el dueño; si se omite, se usa el `cost` ya guardado */
  cost?: number;
  /**
   * Margen de reventa en porcentaje, con hasta dos decimales (`18.18` = 18,18%).
   * El front lo deriva de la escala de precios; si se omite, el backend aplica
   * el suyo. Debe ser menor a 100.
   */
  margin?: number;
  /**
   * Número de entrada de la transacción de compra.
   * **Ojo con el nombre:** este endpoint lo espera en snake_case, a diferencia
   * del resto de la API (y de `inNumber` al leer la transacción).
   */
  in_number?: string;
}

/**
 * Transacción de compra creada al aprobar la unidad.
 * Ojo: acá las relaciones son **ids planos**, no objetos anidados como en
 * `UsedBike`; no reutilices el mismo renderer para ambas.
 */
export interface UsedBikePurchaseTransaction {
  id: number;
  product: number;
  originBranch: number;
  targetBranch: number;
  type: string;
  used: boolean;
  quantity: number;
  amount: number;
  plate: string;
  color: string;
  serialNumber: string;
  motorSerial: string;
  year: string;
  receptionDate: string;
  notes: string;
  user: number;
  responsible: number;
  inNumber: string;
  outNumber: string;
  invoiceNumber: string;
  orderId: string;
}

export interface UsedBikeApproval {
  usedBike: UsedBike;
  transaction: UsedBikePurchaseTransaction;
}

export interface UsedBikeApprovalResponse {
  message: string;
  data: UsedBikeApproval;
}
