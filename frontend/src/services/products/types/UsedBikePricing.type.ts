/**
 * Calculadora de precio de compra de motos usadas
 * (`POST /api/products/usedbikes/pricing/<case>`).
 *
 * No persiste nada: es cálculo puro. Devuelve un **rango de compra** — lo que
 * le pagamos al dueño, que alimenta `cost`, no el precio de reventa.
 */

/** 1 = por condición, 2 = por reparaciones, 3 = ambos lado a lado */
export type UsedBikePricingCase = 1 | 2 | 3;

/** `price` es **unitario**: el total de la línea es `quantity * price` */
export interface UsedBikePricingProduct {
  productId: number;
  quantity?: number;
  price: number;
}

export interface UsedBikePricingProductResult extends UsedBikePricingProduct {
  total: number;
}

/**
 * Todos los porcentajes van como enteros: `20` es 20%, no `0.20`.
 * Los campos que el caso elegido no usa se ignoran.
 */
export interface UsedBikePricingPayload {
  marketValue: number;
  punishment: number;
  /**
   * Margen de reventa. **No se manda desde el front**: el backend aplica el
   * suyo. Queda declarado por si alguna vez hace falta forzarlo.
   */
  margin?: number;
  /** Casos 1 y 3: el `totalScore` de la encuesta de evaluación */
  percentageScore?: number;
  /** Casos 2 y 3 */
  products?: UsedBikePricingProduct[];
}

/** Campos comunes a ambos casos */
interface UsedBikePricingCommon {
  marketValue: number;
  punishmentPct: number;
  punishmentAmount: number;
  base: number;
  netBase: number;
  /** Techo: lo máximo que se justifica pagar (usa el margen reducido) */
  maxPrice: number;
  maxMarginPct: number;
  maxMarginAmount: number;
  /** Piso: oferta inicial ideal (usa el margen objetivo completo) */
  minPrice: number;
  minMarginPct: number;
  minMarginAmount: number;
  adminExpense: number;
}

/** Caso 1: la condición de la unidad escala el valor de mercado */
export interface UsedBikePricingByCondition extends UsedBikePricingCommon {
  scorePct: number;
  scoredValue: number;
  scoreDeduction: number;
}

/** Caso 2: al valor de mercado se le resta el costo de las reparaciones */
export interface UsedBikePricingByRepairs extends UsedBikePricingCommon {
  partsSum: number;
  /** `base - partsSum`. Si es ≤ 0, las reparaciones superan el valor */
  netBase: number;
  products: UsedBikePricingProductResult[];
}

export interface UsedBikePricingResult {
  case1?: UsedBikePricingByCondition;
  case2?: UsedBikePricingByRepairs;
}

export interface UsedBikePricingResponse {
  message: string;
  data: UsedBikePricingResult;
}
