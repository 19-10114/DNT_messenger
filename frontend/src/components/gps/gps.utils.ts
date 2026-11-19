import { GpsStatus, GpsUnit } from '@/services/gps/types';

/** Etiqueta en español de cada estado del ciclo de vida de una unidad. */
export const GPS_STATUS_LABELS: Record<GpsStatus, string> = {
  available: 'Disponible',
  pending: 'Pendiente',
  on_branch: 'En sucursal',
  on_street: 'En calle',
  installed: 'Instalado',
};

/**
 * Orden en el que se muestran los estados: el mismo en el que una unidad
 * avanza (disponible -> pendiente -> sucursal -> calle -> instalado), para que
 * las pestañas se lean como el recorrido real y no como una lista alfabética.
 */
export const GPS_STATUS_ORDER: GpsStatus[] = [
  'available',
  'pending',
  'on_branch',
  'on_street',
  'installed',
];

/**
 * Colores de estado, reservados: no se reutilizan para nada que no sea el
 * estado de una unidad. Cada uno viaja siempre junto a su etiqueta de texto,
 * así que el color nunca es el único canal que distingue un estado de otro.
 */
export const GPS_STATUS_CLASSES: Record<GpsStatus, string> = {
  available: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  on_branch: 'bg-sky-50 text-sky-700 ring-sky-200',
  on_street: 'bg-violet-50 text-violet-700 ring-violet-200',
  installed: 'bg-slate-100 text-slate-600 ring-slate-200',
};

/** Punto de color del mismo estado, para las pestañas. */
export const GPS_STATUS_DOT_CLASSES: Record<GpsStatus, string> = {
  available: 'bg-emerald-500',
  pending: 'bg-amber-500',
  on_branch: 'bg-sky-500',
  on_street: 'bg-violet-500',
  installed: 'bg-slate-400',
};

/** Una unidad está disponible cuando puede entregarse/instalarse ya. */
export function isGpsUnitAvailable(unit: GpsUnit): boolean {
  return unit.status === 'available';
}

/**
 * Una unidad pendiente es la que espera revisión: aprobarla la deja
 * `available` en MC y `on_branch` en Arranca, y es la **única** transición que
 * el backend replica allá. Por eso aprobar/rechazar solo existe sobre estas.
 */
export function isGpsUnitPending(unit: GpsUnit): boolean {
  return unit.status === 'pending';
}

/**
 * Una unidad ya instalada está montada en una moto: su sucursal deja de ser
 * algo que se edite desde el monitoreo.
 */
export function isGpsUnitInstalled(unit: GpsUnit): boolean {
  return unit.status === 'installed';
}

/**
 * Una unidad en traslado ya apunta a la sucursal que recibe, pero espera que
 * esa sucursal la acepte o la rechace. Mientras tanto no se mueve de nuevo, no
 * se rechaza (borra) y no se instala.
 */
export function isGpsUnitInTransfer(unit: GpsUnit): boolean {
  return !!unit.transferFromBranch;
}

/** Quién pidió el traslado de una unidad, legible. */
export function getGpsTransferRequesterName(unit: GpsUnit): string {
  const requester = unit.transferRequestedBy;
  if (!requester) return '';

  const fullName =
    `${requester.firstName ?? ''} ${requester.lastName ?? ''}`.trim();
  return fullName || requester.username || '';
}

/** Nombre legible del responsable de una unidad. */
export function getGpsResponsibleName(unit: GpsUnit): string {
  const responsible = unit.responsible;
  if (!responsible) return '';

  const fullName =
    `${responsible.firstName ?? ''} ${responsible.lastName ?? ''}`.trim();
  return fullName || responsible.username || '';
}

/** Marca y modelo en una sola celda (`Coban GT06`), sin dejar espacios sueltos. */
export function getGpsHardwareLabel(unit: GpsUnit): string {
  return [unit.brand, unit.model].filter(Boolean).join(' ').trim();
}

/** Cuenta las unidades de cada estado, con todos los estados presentes en cero. */
export function countGpsUnitsByStatus(
  units: GpsUnit[]
): Record<GpsStatus, number> {
  const counts = GPS_STATUS_ORDER.reduce(
    (accumulator, status) => ({ ...accumulator, [status]: 0 }),
    {} as Record<GpsStatus, number>
  );

  units.forEach((unit) => {
    if (counts[unit.status] !== undefined) counts[unit.status] += 1;
  });

  return counts;
}

/**
 * Filtra por texto en cliente sobre los mismos campos que busca el backend
 * (IMEI, número de línea, modelo y marca) más el responsable y la sucursal,
 * que acá ya están a mano y son lo que se busca cuando falta una unidad.
 */
export function filterGpsUnitsByTerm(
  units: GpsUnit[],
  term: string
): GpsUnit[] {
  const normalizedTerm = term.trim().toLowerCase();
  if (!normalizedTerm) return units;

  return units.filter((unit) =>
    [
      unit.imei,
      unit.number,
      unit.model,
      unit.brand,
      unit.originBranch,
      unit.targetBranch?.name ?? '',
      getGpsResponsibleName(unit),
    ]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(normalizedTerm))
  );
}
