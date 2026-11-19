import axios from 'axios';
import {
  Supplier,
  SupplierIvaRetentionRate,
  SupplierPersonType,
} from '@/services/suppliers/types/Supplier.type';

export const PERSON_TYPE_LABELS: Record<SupplierPersonType, string> = {
  juridica: 'Persona jurídica',
  natural: 'Persona natural',
};

export const IVA_RETENTION_LABELS: Record<SupplierIvaRetentionRate, string> = {
  0: 'No se le retiene',
  75: '75 % (regla general)',
  100: '100 % (sin RIF válido o factura sin IVA)',
};

/**
 * Conceptos habituales de retención de ISLR (Decreto 1.808) con el % de
 * referencia para persona jurídica y natural residente. Solo proponen el
 * porcentaje: el contador confirma el de cada proveedor.
 */
export const ISLR_CONCEPTS: {
  concept: string;
  juridica: number;
  natural: number;
}[] = [
  { concept: 'Servicios', juridica: 2, natural: 1 },
  { concept: 'Honorarios profesionales', juridica: 5, natural: 3 },
  { concept: 'Alquiler de inmuebles', juridica: 5, natural: 3 },
  { concept: 'Alquiler de bienes muebles', juridica: 5, natural: 3 },
  { concept: 'Fletes y transporte', juridica: 3, natural: 1 },
  { concept: 'Publicidad y propaganda', juridica: 5, natural: 3 },
  { concept: 'Comisiones', juridica: 5, natural: 3 },
];

/** Misma regla que `normalize_rif` del backend: "j301234567" → "J-30123456-7". */
export function normalizeRif(value: string): string | null {
  const compact = value.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  const match = /^([VEJGPC])(\d{6,9})(\d)$/.exec(compact);
  return match ? `${match[1]}-${match[2]}-${match[3]}` : null;
}

/** "IVA 75 % · ISLR 2 % Servicios", o "Sin retenciones". */
export function describeRetentionProfile(
  supplier: Pick<
    Supplier,
    'ivaRetentionRate' | 'islrRetentionRate' | 'islrConcept'
  >
): string {
  const parts: string[] = [];
  if (supplier.ivaRetentionRate)
    parts.push(`IVA ${supplier.ivaRetentionRate} %`);
  if (supplier.islrRetentionRate) {
    parts.push(
      `ISLR ${supplier.islrRetentionRate} %${supplier.islrConcept ? ` ${supplier.islrConcept}` : ''}`
    );
  }
  return parts.length ? parts.join(' · ') : 'Sin retenciones';
}

/** Quién crea y edita proveedores: admin, administrador, finanzas o superusuario (D3). */
export function canManageSuppliers(
  roles: string[],
  isSuperuser?: boolean,
  isStaff?: boolean
): boolean {
  return (
    (isSuperuser === true && isStaff === false) ||
    roles.includes('admin') ||
    roles.includes('administrator') ||
    roles.includes('finance')
  );
}

const BACKEND_MESSAGES: Record<string, string> = {
  'You are not allowed to manage suppliers':
    'No tienes permiso para gestionar proveedores.',
  'Supplier not found': 'Proveedor no encontrado.',
  'A supplier with that RIF already exists.':
    'Ya existe un proveedor con ese RIF.',
  'Invalid RIF. Expected something like J-30123456-7.':
    'RIF inválido. Ejemplo: J-30123456-7.',
};

export function getSupplierErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: Record<string, unknown> }
      | undefined;
    if (data?.errors && typeof data.errors === 'object') {
      const details = Object.values(data.errors)
        .flatMap((messages) =>
          Array.isArray(messages) ? messages.map(String) : [String(messages)]
        )
        .map((message) => BACKEND_MESSAGES[message] ?? message)
        .join(' ');
      if (details) return details;
    }
    if (data?.message) return BACKEND_MESSAGES[data.message] ?? data.message;
  }
  return fallback;
}
