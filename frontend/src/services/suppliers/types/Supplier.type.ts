import { Pagination } from '@/models/pagination.model';

/**
 * Proveedores (`/api/suppliers/`): a quién se le paga una factura con IVA y
 * retenciones. Ver ARCHITECTURE.md del backend, app `suppliers`.
 */

export type SupplierPersonType = 'natural' | 'juridica';

/** Retención de IVA: ninguna, 75 % (regla general) o 100 %. */
export type SupplierIvaRetentionRate = 0 | 75 | 100;

export interface Supplier {
  id: number;
  name: string;
  /** Normalizado por el backend: "J-30123456-7". */
  rif: string;
  personType: SupplierPersonType;
  ivaRetentionRate: SupplierIvaRetentionRate;
  /** % sobre la base imponible; `null` = no se le retiene ISLR. */
  islrRetentionRate: number | null;
  /** "Servicios", "Honorarios profesionales"… */
  islrConcept: string;
  phone: string;
  email: string;
  notes: string;
  isActive: boolean;
  /** Gastos registrados a este proveedor (en el listado). */
  expensesCount: number;
  createdAt: string;
  lastUpdated: string;
}

export interface SupplierPayload {
  name?: string;
  /** Se acepta como se escriba ("j301234567"); el backend lo normaliza. */
  rif?: string;
  personType?: SupplierPersonType;
  ivaRetentionRate?: SupplierIvaRetentionRate;
  /** `null` (o 0) = no retiene ISLR. */
  islrRetentionRate?: number | null;
  islrConcept?: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface GetSuppliersQueryParams {
  page?: string;
  pageSize?: string;
  /** Nombre o RIF. */
  search?: string;
  /** Por defecto solo activos. */
  active?: 'true' | 'false' | 'all';
}

export type SuppliersPage = Pagination<Supplier>;
