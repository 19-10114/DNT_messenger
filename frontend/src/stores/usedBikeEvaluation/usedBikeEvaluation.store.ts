import { create } from 'zustand';
import { UsedBikeProductPrice } from '@/services/products/types/UsedBike.type';

/** Producto o servicio asignado a un hallazgo de la evaluación */
export interface AssignedProduct {
  /** Clave local (`part-12`, `other-3`): evita choques entre ambos listados */
  id: string;
  /** Id del producto en el catálogo, el que viaja en `productPrices` */
  productId: number;
  sku: string;
  name: string;
  /** Precio **unitario** aplicado: editable, y a la mitad cuando el hallazgo es R */
  price: number;
  /** Unidades asignadas; arranca en 1 */
  quantity: number;
  /** Precio de lista del producto, como referencia */
  listPrice: number;
  /** De qué listado se tomó: repuestos u "otros" (servicios) */
  source: 'part' | 'other';
}

/**
 * Datos de catálogo para reponer un repuesto guardado: de `productPrices` solo
 * vuelve el id, así que nombre, sku y precio de lista se resuelven aparte
 * (`useProductsByIds`).
 */
export interface AssignedProductCatalogEntry {
  name: string;
  sku: string;
  price: number;
  /** Id de categoría: `2` son repuestos, el resto se trata como servicio */
  category: number;
}

/** Categoría de repuestos en el catálogo */
const PART_CATEGORY_ID = 2;

/** Pregunta marcada como R o M en la etapa 1 */
export interface EvaluationIssue {
  questionId: number;
  section: string;
  questionText: string;
  optionId: string;
  /** Etiqueta de la opción elegida: R o M */
  optionLabel: string;
  /** Puntos que otorgó la opción elegida */
  score: number;
  /** Puntos máximos de la pregunta */
  maxScore: number;
  products: AssignedProduct[];
}

/** Puntaje del cuestionario completo, con la misma fórmula del backend */
export interface EvaluationScore {
  rawScore: number;
  maxScore: number;
}

interface State {
  /** Moto usada que se está evaluando */
  usedBikeId: number | undefined;
  /** Respuestas de la etapa 1: questionId -> optionId */
  answers: Record<number, string>;
  /** Hallazgos (R y M) que requieren repuestos */
  issues: EvaluationIssue[];
  score: EvaluationScore;
}

interface Actions {
  actions: {
    startEvaluation: (usedBikeId: number) => void;
    /**
     * Cierra la etapa 1: guarda las respuestas y deja solo los hallazgos R/M.
     * Las respuestas ya vienen completas (las no marcadas se resuelven como B).
     */
    completeStageOne: (
      answers: Record<number, string>,
      issues: Omit<EvaluationIssue, 'products'>[],
      score: EvaluationScore
    ) => void;
    /**
     * Repone lo ya guardado en el backend sobre los hallazgos que estén vacíos,
     * sin pisar lo que el evaluador acabe de asignar. Cada entrada se enlaza a
     * su hallazgo por `questionId`.
     * @param saved - `productPrices` de la moto usada
     * @param catalog - Productos resueltos por id; sin ellos solo hay ids
     */
    restoreAssignedProducts: (
      saved: UsedBikeProductPrice[],
      catalog?: ReadonlyMap<number, AssignedProductCatalogEntry>
    ) => void;
    assignProduct: (questionId: number, product: AssignedProduct) => void;
    removeProduct: (questionId: number, productId: string) => void;
    updateProductPrice: (
      questionId: number,
      productId: string,
      price: number
    ) => void;
    /** Unidades del repuesto; nunca baja de 1 */
    updateProductQuantity: (
      questionId: number,
      productId: string,
      quantity: number
    ) => void;
    reset: () => void;
  };
}

/**
 * Repuestos guardados que le tocan a un hallazgo, ya listos para el store.
 *
 * Vive fuera de las acciones porque las vistas de solo lectura (la ficha de la
 * unidad) arman los hallazgos sin pasar por el store y necesitan el mismo
 * mapeo.
 * @param saved - `productPrices` de la moto usada
 * @param questionId - Pregunta a la que se enlazan
 * @param catalog - Productos resueltos por id; sin ellos solo queda el id
 */
export function buildAssignedProducts(
  saved: UsedBikeProductPrice[],
  questionId: number,
  catalog?: ReadonlyMap<number, AssignedProductCatalogEntry>
): AssignedProduct[] {
  return saved
    .filter((entry) => entry.questionId === questionId)
    .map<AssignedProduct>((entry) => {
      const product = catalog?.get(entry.productId);
      // La clave local se arma igual que en el panel de asignación, así el
      // mismo producto no se puede agregar dos veces
      const source =
        product && product.category !== PART_CATEGORY_ID ? 'other' : 'part';

      return {
        id: `${source}-${entry.productId}`,
        productId: entry.productId,
        sku: product?.sku ?? '',
        name: product?.name ?? `Producto #${entry.productId}`,
        price: entry.price,
        quantity: entry.quantity ?? 1,
        listPrice: product?.price ?? entry.price,
        source,
      };
    });
}

const initialState: State = {
  usedBikeId: undefined,
  answers: {},
  issues: [],
  score: { rawScore: 0, maxScore: 0 },
};

/**
 * Estado de la evaluación de una moto usada mientras dura el flujo de dos
 * etapas. Todavía no se persiste ni se envía: al conectar el backend, este
 * store es el que aporta el payload.
 */
export const useUsedBikeEvaluationStore = create<State & Actions>()((set) => ({
  ...initialState,

  actions: {
    startEvaluation: (usedBikeId) =>
      set(() => ({ ...initialState, usedBikeId })),

    completeStageOne: (answers, issues, score) =>
      set((state) => ({
        answers,
        score,
        // Se conservan los productos ya asignados si se vuelve a la etapa 1
        issues: issues.map((issue) => ({
          ...issue,
          products:
            state.issues.find(
              (previous) => previous.questionId === issue.questionId
            )?.products ?? [],
        })),
      })),

    restoreAssignedProducts: (saved, catalog) =>
      set((state) => ({
        issues: state.issues.map((issue) => {
          if (issue.products.length) return issue;

          const products = buildAssignedProducts(
            saved,
            issue.questionId,
            catalog
          );

          return products.length ? { ...issue, products } : issue;
        }),
      })),

    assignProduct: (questionId, product) =>
      set((state) => ({
        issues: state.issues.map((issue) => {
          if (issue.questionId !== questionId) return issue;
          // Evita duplicar el mismo producto en un hallazgo
          if (issue.products.some((item) => item.id === product.id)) {
            return issue;
          }
          return { ...issue, products: [...issue.products, product] };
        }),
      })),

    removeProduct: (questionId, productId) =>
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.questionId === questionId
            ? {
                ...issue,
                products: issue.products.filter(
                  (item) => item.id !== productId
                ),
              }
            : issue
        ),
      })),

    updateProductPrice: (questionId, productId, price) =>
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.questionId === questionId
            ? {
                ...issue,
                products: issue.products.map((item) =>
                  item.id === productId ? { ...item, price } : item
                ),
              }
            : issue
        ),
      })),

    updateProductQuantity: (questionId, productId, quantity) =>
      set((state) => ({
        issues: state.issues.map((issue) =>
          issue.questionId === questionId
            ? {
                ...issue,
                products: issue.products.map((item) =>
                  item.id === productId
                    ? { ...item, quantity: Math.max(1, Math.trunc(quantity)) }
                    : item
                ),
              }
            : issue
        ),
      })),

    reset: () => set(() => ({ ...initialState })),
  },
}));

export const useEvaluationAnswers = () =>
  useUsedBikeEvaluationStore((state) => state.answers);

export const useEvaluationIssues = () =>
  useUsedBikeEvaluationStore((state) => state.issues);

export const useEvaluationScore = () =>
  useUsedBikeEvaluationStore((state) => state.score);

export const useEvaluationActions = () =>
  useUsedBikeEvaluationStore((state) => state.actions);
