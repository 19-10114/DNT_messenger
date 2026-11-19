import { normalizeApprovalNumber } from '@/components/approvals/approvals.utils';
import { PurchaseBikeCartLine } from '@/models/purchaseBikeCart.model';
import { ApprovalLookup } from '@/services/approvals/types';
import { RejectedCartRow } from '@/models/purchasePartsCart.model';
import {
  InvoiceBikeLine,
  InvoiceBikePage,
  InvoiceBikeProduct,
} from '@/services/purchases/types/InvoiceReader.type';
import {
  InvoicePageIssue,
  InvoicePageResult,
  lineKey,
  location,
  skippedPageRow,
} from './invoiceCart.utils';

/**
 * "Subir Factura" en el carrito de motos: de las páginas leídas por el backend
 * a unidades del carrito. Lógica pura. Una moto que el lector dio por buena
 * (modelo exacto, VIN válido, placa con forma LLDLDDL, color y año) entra
 * sola; el resto pasa por la revisión con su motivo; un modelo que no está en
 * el catálogo va al aviso. Ver PLAN-factura-motos-preorden.md.
 */

export type BikeIssue =
  | 'chassis'
  | 'motor'
  | 'plate'
  | 'color'
  | 'year'
  | 'model_suggested'
  | 'already_registered'
  | 'duplicate_plate';

export const BIKE_ISSUE_LABELS: Record<BikeIssue, string> = {
  chassis: 'Chasis no válido',
  motor: 'Sin motor',
  plate: 'Placa dudosa',
  color: 'Sin color',
  year: 'Sin año',
  model_suggested: 'Modelo a confirmar',
  already_registered: 'Ya registrada',
  duplicate_plate: 'Placa repetida',
};

/** Una moto de la factura, con lo que el usuario puede corregir */
export interface BikeUnitDraft {
  include: boolean;
  chassis: string;
  motor: string;
  plate: string;
  color: string;
  year: string;
}

export interface BikeReviewItem {
  key: string;
  page: number;
  invoiceNumber: string | null;
  line: InvoiceBikeLine;
  /** El modelo que entra: el exacto o el sugerido */
  product: InvoiceBikeProduct;
  issues: BikeIssue[];
  /** No, solo si la moto ya está en el sistema: la aprobación la rechazaría */
  defaultInclude: boolean;
}

/** Una página con motos y lo que trae su encabezado */
export interface BikeReviewPage {
  page: number;
  invoiceNumber: string | null;
  previewUrl: string | null;
  /** "Nro Aprobación" como lo leyó el lector (normalizado); vacío si no lo encontró */
  approvalNumber: string;
  unitCount: number;
}

/** Lo que se sabe de una aprobación consultada por su número */
export type ApprovalLookupState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'error' }
  | { status: 'ok'; lookup: ApprovalLookup };

export interface BikeInvoiceReview {
  /** Páginas con motos, en orden; cada una con su número de aprobación */
  pages: BikeReviewPage[];
  /** Todas las motos con modelo en el catálogo, en el orden de la factura */
  units: BikeReviewItem[];
  /** Las que hay que mirar (al menos un motivo) */
  items: BikeReviewItem[];
  pageIssues: InvoicePageIssue[];
  /** Motos cuyo modelo no está en el catálogo */
  rejectedCount: number;
}

// ---------------------------------------------------------------- VIN (igual que el backend)

const VIN_VALUES: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, J: 1, K: 2, L: 3, M: 4,
  N: 5, P: 7, R: 9, S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
}; // prettier-ignore
const VIN_WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];
const VIN_YEAR_CODES = 'ABCDEFGHJKLMNPRSTVWXY123456789';

export function cleanVin(text: string) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** El VIN cumple el dígito verificador (posición 9) */
export function vinIsValid(vin: string) {
  if (vin.length !== 17) return false;
  let total = 0;
  for (let i = 0; i < 17; i += 1) {
    const char = vin[i];
    const value = /\d/.test(char) ? Number(char) : VIN_VALUES[char];
    if (value === undefined) return false;
    total += value * VIN_WEIGHTS[i];
  }
  const digit = total % 11 === 10 ? 'X' : String(total % 11);
  return digit === vin[8];
}

/** Año de modelo (posición 10), el más reciente del ciclo que no pase de
 * un año adelante de hoy */
export function vinYear(vin: string, today = new Date()) {
  if (vin.length !== 17) return '';
  const index = VIN_YEAR_CODES.indexOf(vin[9]);
  if (index === -1) return '';
  const limit = today.getFullYear() + 1;
  let year = 1980 + index;
  while (year + 30 <= limit) year += 30;
  return String(year);
}

/** Placa de moto venezolana: LLD?DDL, el cuarto es letra o número ("AG0B22L", "AG0839L"). Igual que el backend. */
export function plateLooksRight(plate: string) {
  return /^[A-Z]{2}\d[A-Z0-9]\d{2}[A-Z]$/.test(plate);
}

// ---------------------------------------------------------------- revisión

function plateKey(plate: string) {
  return plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function issuesOf(line: InvoiceBikeLine): BikeIssue[] {
  const issues: BikeIssue[] = [];
  if (!line.chassisValid) issues.push('chassis');
  // El motor no se valida (no tiene forma fija), pero sin él la moto no se guarda.
  if (!line.motor) issues.push('motor');
  if (!line.plateOk) issues.push('plate');
  if (!line.color) issues.push('color');
  if (!line.year) issues.push('year');
  if (line.resolution === 'suggested') issues.push('model_suggested');
  if (line.alreadyRegistered) issues.push('already_registered');
  return issues;
}

function bikePageIssue(
  result: InvoicePageResult<InvoiceBikePage>
): InvoicePageIssue | null {
  const invoiceNumber = result.data?.invoice.number ?? null;
  const base = {
    page: result.page,
    previewUrl: result.previewUrl,
    invoiceNumber,
  };
  if (!result.data) {
    return {
      ...base,
      kind: 'error',
      message: result.error ?? 'No se pudo leer la página.',
    };
  }
  if (result.data.status === 'skipped') return null;
  if (result.data.status === 'unreadable') {
    return {
      ...base,
      kind: 'unreadable',
      message:
        'No parece una factura de motos de Empire Keeway: no se encontró la tabla.',
    };
  }
  const check = result.data.check;
  if (result.data.status === 'review' && check && !check.bikesOk) {
    return {
      ...base,
      kind: 'review',
      message:
        check.declaredBikes === null
          ? `${check.bikes} motos leídas (no se pudo leer la fila PLACAS). Compará con la imagen.`
          : `${check.bikes} motos leídas de ${check.declaredBikes}. Compará con la imagen: puede faltar una fila.`,
    };
  }
  return null;
}

/**
 * Qué hay que mirar antes de agregar al carrito. Las placas se comparan entre
 * todas las motos de la carga y contra las que ya están en el carrito: las
 * repetidas se marcan todas, para verlas juntas y saber cuál está mal leída.
 */
export function buildBikeInvoiceReview(
  pages: InvoicePageResult<InvoiceBikePage>[],
  cartPlates: string[] = []
): BikeInvoiceReview {
  const units: BikeReviewItem[] = [];
  const reviewPages: BikeReviewPage[] = [];
  const pageIssues: InvoicePageIssue[] = [];
  let rejectedCount = 0;

  pages.forEach((result) => {
    const issue = bikePageIssue(result);
    if (issue) pageIssues.push(issue);
    if (!result.data || result.data.status === 'skipped') return;
    const invoiceNumber = result.data.invoice.number;
    if (result.data.lines.length > 0) {
      reviewPages.push({
        page: result.page,
        invoiceNumber,
        previewUrl: result.previewUrl,
        approvalNumber: normalizeApprovalNumber(
          result.data.invoice.approvalNumber
        ),
        unitCount: result.data.lines.length,
      });
    }
    result.data.lines.forEach((line) => {
      const product = line.product ?? line.suggestion;
      if (!product) {
        rejectedCount += 1;
        return;
      }
      units.push({
        key: lineKey(result.page, line.row),
        page: result.page,
        invoiceNumber,
        line,
        product,
        issues: issuesOf(line),
        defaultInclude: !line.alreadyRegistered,
      });
    });
  });

  const counts = new Map<string, number>();
  [...cartPlates, ...units.map((u) => u.line.plate)].forEach((plate) => {
    const key = plateKey(plate);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  });
  units.forEach((unit) => {
    if ((counts.get(plateKey(unit.line.plate)) ?? 0) > 1) {
      unit.issues.push('duplicate_plate');
    }
  });

  return {
    pages: reviewPages,
    units,
    items: units.filter((unit) => unit.issues.length > 0),
    pageIssues,
    rejectedCount,
  };
}

/** El número de aprobación de cada página al abrir la revisión: lo leído. */
export function defaultPageApprovals(
  review: BikeInvoiceReview
): Record<number, string> {
  return Object.fromEntries(
    review.pages.map((page) => [page.page, page.approvalNumber])
  );
}

/**
 * Por qué una moto no puede contar para la aprobación de su página, o null si
 * puede: número ausente, aprobación inexistente o cerrada, modelo que no
 * incluye o no envía a la sucursal que recibe, o sin cupo contando lo que ya
 * hay en el carrito con ese número y las motos anteriores de esta misma carga.
 * Mientras una consulta no responde, la moto espera ("Consultando...").
 *
 * @param pageApprovals - Número por página, editable en la revisión
 * @param lookups - Resultado de la consulta por número normalizado; ausente = consultando
 * @param cartLines - Lo que ya está en el carrito (cuenta contra el cupo)
 */
export function approvalProblems(
  review: BikeInvoiceReview,
  drafts: Record<string, BikeUnitDraft>,
  pageApprovals: Record<number, string>,
  lookups: Record<string, ApprovalLookupState | undefined>,
  targetBranchId: number | undefined,
  targetBranchName: string,
  cartLines: PurchaseBikeCartLine[]
): Record<string, string | null> {
  const taken = new Map<string, number>();
  const bump = (key: string) => taken.set(key, (taken.get(key) ?? 0) + 1);
  cartLines.forEach((line) => {
    if (line.approvalNumber) bump(`${line.approvalNumber}|${line.productId}`);
  });
  const branch = targetBranchName || 'esta sucursal';
  const problems: Record<string, string | null> = {};

  review.units.forEach((unit) => {
    const number = normalizeApprovalNumber(pageApprovals[unit.page]);
    const name = unit.product.name;
    let problem: string | null = null;
    if (!number) {
      problem =
        'Falta el número de aprobación: no se leyó en la factura. Escríbalo en la página.';
    } else {
      const state = lookups[number];
      if (!state || state.status === 'loading') {
        problem = 'Consultando la aprobación...';
      } else if (state.status === 'not_found') {
        problem = `La aprobación ${number} no existe. Regístrela en Aprobaciones Empire y vuelva a consultar.`;
      } else if (state.status === 'error') {
        problem = 'No se pudo consultar la aprobación. Vuelva a consultar.';
      } else if (!state.lookup.acceptsBikes) {
        problem = `La aprobación ${number} ya no acepta motos (${
          state.lookup.status === 'closed' ? 'cerrada' : 'completa'
        }).`;
      } else if (!targetBranchId) {
        problem = 'Elija la sucursal que recibe para ver el cupo.';
      } else {
        const modelLines = state.lookup.lines.filter(
          (line) => line.product.id === unit.product.id
        );
        const line = modelLines.find(
          (item) => item.branch.id === targetBranchId
        );
        if (modelLines.length === 0) {
          problem = `La aprobación ${number} no incluye ${name}.`;
        } else if (!line) {
          problem = `La aprobación ${number} no envía ${name} a ${branch} (va a: ${modelLines
            .map((item) => item.branch.name)
            .join(', ')}). Un gerente puede moverlas desde la aprobación.`;
        } else {
          const key = `${number}|${unit.product.id}`;
          const claimed = taken.get(key) ?? 0;
          if (line.availableQuantity - claimed <= 0) {
            problem = `La aprobación ${number} no tiene más ${name} para ${branch}: quedan ${line.availableQuantity} y ya hay ${claimed} entre el carrito y esta factura.`;
          } else if (drafts[unit.key]?.include ?? true) {
            bump(key);
          }
        }
      }
    }
    problems[unit.key] = problem;
  });
  return problems;
}

/** Borradores de todas las motos, con la sugerencia de chasis ya aplicada si
 * es la única corrección posible */
export function defaultBikeDrafts(
  review: BikeInvoiceReview
): Record<string, BikeUnitDraft> {
  return Object.fromEntries(
    review.units.map((unit) => {
      const chassis = unit.line.chassisSuggestion ?? unit.line.chassis;
      return [
        unit.key,
        {
          include: unit.defaultInclude,
          chassis,
          motor: unit.line.motor,
          plate: unit.line.plate,
          color: unit.line.color,
          year: unit.line.year ?? (vinIsValid(chassis) ? vinYear(chassis) : ''),
        },
      ];
    })
  );
}

/** Por qué una moto incluida todavía no puede entrar, o null si puede */
export function draftProblem(draft: BikeUnitDraft, duplicated: boolean) {
  if (!draft.include) return null;
  const missing = [
    !draft.chassis && 'chasis',
    !draft.motor.trim() && 'motor',
    !draft.plate && 'placa',
    !draft.color && 'color',
    !/^\d{4}$/.test(draft.year) && 'año',
  ].filter(Boolean);
  if (missing.length > 0) return `Falta ${missing.join(', ')}`;
  if (duplicated) return 'La placa se repite';
  return null;
}

/** Claves de las motos incluidas cuya placa (ya corregida) se repite entre sí
 * o con el carrito */
export function duplicatedDrafts(
  drafts: Record<string, BikeUnitDraft>,
  cartPlates: string[] = []
) {
  const counts = new Map<string, number>();
  const bump = (plate: string) => {
    const key = plateKey(plate);
    if (key) counts.set(key, (counts.get(key) ?? 0) + 1);
  };
  cartPlates.forEach(bump);
  Object.values(drafts)
    .filter((d) => d.include)
    .forEach((d) => bump(d.plate));
  return new Set(
    Object.entries(drafts)
      .filter(([, d]) => d.include && (counts.get(plateKey(d.plate)) ?? 0) > 1)
      .map(([key]) => key)
  );
}

function toCartLine(
  unit: BikeReviewItem,
  draft: BikeUnitDraft,
  approvalNumber: string
): PurchaseBikeCartLine {
  const { product, line } = unit;
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    model: product.model,
    brand: product.brand,
    // Manda el catálogo; sin precio cargado, el de la factura.
    cost: product.cost || line.invoiceCostUsd || 0,
    plate: plateKey(draft.plate),
    color: draft.color,
    chassisSerial: cleanVin(draft.chassis),
    motorSerial: draft.motor.trim(),
    year: draft.year,
    invoiceNumber: (unit.invoiceNumber ?? '').slice(0, 15),
    // El Nº de entrada lo pone el backend al aprobar: el de la preorden.
    inNumber: '',
    notes: '',
    approvalNumber,
    invoiceCost: line.invoiceCostUsd,
  };
}

/**
 * Las páginas leídas + los borradores → unidades para el carrito y lo que no
 * entró. Las motos con problemas sin resolver (`draftProblem`) no se agregan:
 * quien llama deshabilita "Agregar" mientras haya alguna.
 */
export function applyBikeInvoiceReview(
  pages: InvoicePageResult<InvoiceBikePage>[],
  review: BikeInvoiceReview,
  drafts: Record<string, BikeUnitDraft>,
  pageApprovals: Record<number, string>,
  problems: Record<string, string | null>
): { lines: PurchaseBikeCartLine[]; rejected: RejectedCartRow[] } {
  const lines: PurchaseBikeCartLine[] = [];
  const rejected: RejectedCartRow[] = [];

  pages.forEach((result) => {
    if (result.data?.status === 'skipped') {
      rejected.push(
        skippedPageRow(
          result.page,
          result.data.kind,
          result.data.invoice.number,
          'bikes'
        )
      );
      return;
    }
    if (!result.data || result.data.status === 'unreadable') {
      rejected.push({
        rowNumber: 0,
        id: null,
        sku: null,
        quantity: null,
        reason: 'unreadable_page',
        location: location(result.page, result.data?.invoice.number ?? null),
      });
      return;
    }
    const invoiceNumber = result.data.invoice.number;
    result.data.lines.forEach((line) => {
      const unit = review.units.find(
        (u) => u.key === lineKey(result.page, line.row)
      );
      const draft = unit ? drafts[unit.key] : undefined;
      if (!unit || !draft) {
        rejected.push({
          rowNumber: line.row,
          id: null,
          sku: line.plate || null,
          quantity: 1,
          reason: 'not_found',
          location: location(result.page, invoiceNumber),
          description: `${line.description} · chasis ${line.chassis}`,
        });
        return;
      }
      if (!draft.include) {
        rejected.push({
          rowNumber: line.row,
          id: null,
          sku: draft.plate || null,
          quantity: 1,
          reason: unit.line.alreadyRegistered
            ? 'already_registered'
            : 'discarded',
          location: location(result.page, invoiceNumber),
          description: `${line.description} · chasis ${draft.chassis}`,
        });
        return;
      }
      const problem = problems[unit.key];
      if (problem) {
        rejected.push({
          rowNumber: line.row,
          id: null,
          sku: draft.plate || null,
          quantity: 1,
          reason: 'approval',
          location: location(result.page, invoiceNumber),
          description: `${line.description} · chasis ${draft.chassis} · ${problem}`,
        });
        return;
      }
      lines.push(
        toCartLine(
          unit,
          draft,
          normalizeApprovalNumber(pageApprovals[unit.page])
        )
      );
    });
  });

  return { lines, rejected };
}
