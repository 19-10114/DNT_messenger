import {
  Archive,
  ArrowRightLeft,
  Ban,
  Bike,
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  DollarSign,
  FileSpreadsheet,
  FileText,
  FolderCog,
  FolderPlus,
  Image,
  ImagePlus,
  KeyRound,
  LifeBuoy,
  Layers,
  LogIn,
  LogOut,
  LucideIcon,
  MapPin,
  Package,
  Pencil,
  Plus,
  Receipt,
  Scale,
  Send,
  ShoppingCart,
  Tag,
  Trash2,
  Undo2,
  UserCheck,
  UserCog,
  UserMinus,
  UserPlus,
  Wallet,
  Wrench,
  XCircle,
} from 'lucide-react';

import {
  ActivityEvent,
  ActivitySection,
  ActivityVerb,
} from '@/services/activity/types';
import {
  USED_BIKE_STATUS_LABELS,
  UsedBikeStatus,
} from '@/services/products/types/UsedBike.type';
import {
  ExpensePaymentMethod,
  ExpenseStatus,
} from '@/services/expenses/types/Expense.type';
import {
  PAYMENT_METHOD_LABELS as EXPENSE_PAYMENT_METHOD_LABELS,
  STATUS_LABELS as EXPENSE_STATUS_LABELS,
} from '@/components/expenses/expense.utils';

/**
 * Por ahora el registro de actividad es solo para Super Admin: superusuario
 * que no es staff, o rol `admin`. Es el mismo `isAdmin` del sidebar y el
 * `is_super_admin` que aplica el backend.
 */
export function canViewActivity(
  roles: string[],
  isSuperuser: boolean | undefined,
  isStaff: boolean | undefined
): boolean {
  return (isSuperuser === true && isStaff === false) || roles.includes('admin');
}

/** En el orden en que aparecen en el filtro de sección */
export const ACTIVITY_SECTION_LABELS: Record<ActivitySection, string> = {
  order: 'Órdenes y preórdenes',
  transaction: 'Movimientos',
  inventory: 'Inventario (cargas y conciliación)',
  purchase_order: 'Órdenes de compra',
  expense: 'Gastos y pre-gastos',
  cash_withdrawal: 'Salidas de efectivo',
  supplier: 'Proveedores',
  used_bike: 'Motos usadas',
  product: 'Productos',
  price: 'Precios',
  rate: 'Tasa de cambio',
  gps: 'GPS',
  service: 'Taller',
  arranca_balance: 'Balance Arranca',
  client: 'Clientes',
  user: 'Usuarios',
  auth: 'Sesiones',
  branch: 'Sucursales',
  survey: 'Encuestas',
  media: 'Carrusel e imágenes',
  support: 'Soporte',
};

/** Qué conviene escribir en el buscador según la sección elegida */
export const ACTIVITY_SEARCH_PLACEHOLDERS: Partial<
  Record<ActivitySection, string>
> = {
  order: 'N° de orden, nota o factura',
  transaction: 'Placa, SKU o N° de movimiento',
  inventory: 'Sucursal',
  purchase_order: 'N° de orden de compra',
  expense: 'Código del gasto (GRN-123) o categoría',
  cash_withdrawal: 'Código de la salida (GRN-S12)',
  supplier: 'Nombre del proveedor',
  used_bike: 'Placa',
  product: 'SKU o N° de producto',
  price: 'SKU',
  gps: 'IMEI',
  service: 'Placa',
  arranca_balance: 'Referencia o concepto',
  client: 'Nombre o cédula',
  user: 'Nombre o usuario',
  auth: 'Nombre o usuario',
  branch: 'Nombre de la sucursal',
  survey: 'Nombre de la encuesta',
  support: 'N° o título del reporte',
};

export const ACTIVITY_SEARCH_DEFAULT_PLACEHOLDER =
  'Placa, SKU, N° de orden, cliente…';

interface VerbConfig {
  /** Frase en pasado que sigue al nombre del actor */
  phrase: string;
  icon: LucideIcon;
  /** Clases del círculo del ícono */
  tone: string;
  /**
   * `false` cuando el objetivo no aporta nada tras la frase ("inició sesión",
   * "recalculó los saldos de clientes").
   */
  showTarget?: boolean;
}

const NEUTRAL = 'bg-gray-100 text-gray-600';
const POSITIVE = 'bg-emerald-100 text-emerald-700';
const NEGATIVE = 'bg-red-100 text-red-700';
const PROGRESS = 'bg-blue-100 text-blue-700';
const MONEY = 'bg-amber-100 text-amber-700';

/**
 * Catálogo verbo → frase, ícono y color. El backend solo manda el verbo: el
 * copy vive acá, así que un verbo nuevo solo necesita una entrada.
 */
export const ACTIVITY_VERBS: Record<ActivityVerb, VerbConfig> = {
  'used_bike.registered': {
    phrase: 'registró la moto usada',
    icon: Bike,
    tone: NEUTRAL,
  },
  'used_bike.taken': {
    phrase: 'tomó la evaluación de la moto usada',
    icon: UserCheck,
    tone: PROGRESS,
  },
  'used_bike.evaluated': {
    phrase: 'verificó la moto usada',
    icon: ClipboardCheck,
    tone: PROGRESS,
  },
  'used_bike.approved': {
    phrase: 'aprobó y registró la compra de la moto usada',
    icon: CheckCircle2,
    tone: POSITIVE,
  },
  'used_bike.rejected': {
    phrase: 'rechazó la moto usada',
    icon: XCircle,
    tone: NEGATIVE,
  },
  'used_bike.cancelled': {
    phrase: 'canceló la moto usada',
    icon: Ban,
    tone: NEGATIVE,
  },
  'used_bike.status_changed': {
    phrase: 'cambió el estado de la moto usada',
    icon: ArrowRightLeft,
    tone: NEUTRAL,
  },
  'used_bike.deleted': {
    phrase: 'eliminó el registro de la moto usada',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'order.preorder_created': {
    phrase: 'creó la preorden',
    icon: FileText,
    tone: PROGRESS,
  },
  'order.created': {
    phrase: 'registró la orden',
    icon: ShoppingCart,
    tone: MONEY,
  },
  'order.preorder_billed': {
    phrase: 'facturó la preorden',
    icon: Receipt,
    tone: POSITIVE,
  },
  'order.cancelled': {
    phrase: 'canceló la orden',
    icon: Ban,
    tone: NEGATIVE,
  },
  'order.reverted': {
    phrase: 'revirtió la orden',
    icon: Undo2,
    tone: NEGATIVE,
  },
  'transaction.created': {
    phrase: 'registró el movimiento',
    icon: ArrowRightLeft,
    tone: MONEY,
  },
  'transaction.updated': {
    phrase: 'editó el movimiento',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'transaction.deleted': {
    phrase: 'eliminó el movimiento',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'transaction.reverted': {
    phrase: 'revirtió el movimiento',
    icon: Undo2,
    tone: NEGATIVE,
  },
  'inventory.purchase_loaded': {
    phrase: 'cargó un archivo de compras en',
    icon: FileSpreadsheet,
    tone: MONEY,
  },
  'inventory.reconciled': {
    phrase: 'concilió el inventario de',
    icon: Scale,
    tone: PROGRESS,
  },
  'arranca_balance.created': {
    phrase: 'creó el movimiento con Arranca',
    icon: DollarSign,
    tone: MONEY,
  },
  'arranca_balance.updated': {
    phrase: 'editó el movimiento con Arranca',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'arranca_balance.approved': {
    phrase: 'aprobó el movimiento con Arranca',
    icon: CheckCircle2,
    tone: POSITIVE,
  },
  'arranca_balance.declined': {
    phrase: 'rechazó el movimiento con Arranca',
    icon: XCircle,
    tone: NEGATIVE,
  },
  'purchase_order.created': {
    phrase: 'creó la orden de compra',
    icon: ClipboardList,
    tone: PROGRESS,
  },
  'purchase_order.updated': {
    phrase: 'editó la orden de compra',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'purchase_order.approved': {
    phrase: 'aprobó la orden de compra',
    icon: CheckCircle2,
    tone: POSITIVE,
  },
  'purchase_order.rejected': {
    phrase: 'rechazó la orden de compra',
    icon: XCircle,
    tone: NEGATIVE,
  },
  'expense.requested': {
    phrase: 'solicitó el pre-gasto',
    icon: Wallet,
    tone: PROGRESS,
  },
  'expense.registered': {
    phrase: 'registró el gasto',
    icon: Wallet,
    tone: MONEY,
  },
  'expense.updated': {
    phrase: 'editó el gasto',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'expense.approved': {
    phrase: 'aprobó el pre-gasto',
    icon: CheckCircle2,
    tone: POSITIVE,
  },
  'expense.rejected': {
    phrase: 'rechazó el pre-gasto',
    icon: XCircle,
    tone: NEGATIVE,
  },
  'expense.withdrawn': {
    phrase: 'retiró el pre-gasto',
    icon: Undo2,
    tone: NEUTRAL,
  },
  'expense.cancelled': {
    phrase: 'anuló el gasto',
    icon: Ban,
    tone: NEGATIVE,
  },
  'expense.category_created': {
    phrase: 'creó la categoría de gasto',
    icon: FolderPlus,
    tone: NEUTRAL,
  },
  'expense.category_updated': {
    phrase: 'editó la categoría de gasto',
    icon: FolderCog,
    tone: NEUTRAL,
  },
  'cash_withdrawal.registered': {
    phrase: 'registró la salida de efectivo',
    icon: Wallet,
    tone: MONEY,
  },
  'cash_withdrawal.cancelled': {
    phrase: 'anuló la salida de efectivo',
    icon: Ban,
    tone: NEGATIVE,
  },
  'supplier.created': {
    phrase: 'creó el proveedor',
    icon: Building2,
    tone: NEUTRAL,
  },
  'supplier.updated': {
    phrase: 'editó el proveedor',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'supplier.deactivated': {
    phrase: 'desactivó el proveedor',
    icon: Ban,
    tone: NEGATIVE,
  },
  'supplier.activated': {
    phrase: 'reactivó el proveedor',
    icon: CheckCircle2,
    tone: NEUTRAL,
  },
  'product.created': {
    phrase: 'creó el producto',
    icon: Package,
    tone: NEUTRAL,
  },
  'product.updated': {
    phrase: 'editó el producto',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'product.deleted': {
    phrase: 'eliminó el producto',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'product.bulk_updated': {
    phrase: 'actualizó productos en lote',
    icon: Layers,
    tone: PROGRESS,
    showTarget: false,
  },
  'price.created': {
    phrase: 'creó el precio de',
    icon: Tag,
    tone: MONEY,
  },
  'price.updated': {
    phrase: 'cambió el precio de',
    icon: Tag,
    tone: MONEY,
  },
  'price.bulk_updated': {
    phrase: 'actualizó precios en lote',
    icon: Layers,
    tone: MONEY,
    showTarget: false,
  },
  'rate.updated': {
    phrase: 'actualizó la tasa de cambio',
    icon: Calculator,
    tone: MONEY,
    showTarget: false,
  },
  'gps.created': {
    phrase: 'registró el GPS',
    icon: MapPin,
    tone: NEUTRAL,
  },
  'gps.updated': {
    phrase: 'actualizó el GPS',
    icon: MapPin,
    tone: PROGRESS,
  },
  'gps.deleted': {
    phrase: 'eliminó el GPS',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'service.registered': {
    phrase: 'registró un servicio de taller para',
    icon: Wrench,
    tone: PROGRESS,
  },
  'branch.created': {
    phrase: 'creó la sucursal',
    icon: Building2,
    tone: NEUTRAL,
  },
  'branch.updated': {
    phrase: 'editó la sucursal',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'branch.deleted': {
    phrase: 'eliminó la sucursal',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'survey.created': {
    phrase: 'creó la encuesta',
    icon: ClipboardList,
    tone: NEUTRAL,
  },
  'survey.updated': {
    phrase: 'editó la encuesta',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'survey.archived': {
    phrase: 'archivó la encuesta',
    icon: Archive,
    tone: NEGATIVE,
  },
  'survey.published': {
    phrase: 'publicó una versión de la encuesta',
    icon: Send,
    tone: POSITIVE,
  },
  'survey.response_submitted': {
    phrase: 'respondió la encuesta',
    icon: ClipboardCheck,
    tone: PROGRESS,
  },
  'survey.response_updated': {
    phrase: 'revisó una respuesta de la encuesta',
    icon: ClipboardCheck,
    tone: NEUTRAL,
  },
  'media.carousel_created': {
    phrase: 'agregó una imagen al carrusel',
    icon: ImagePlus,
    tone: NEUTRAL,
    showTarget: false,
  },
  'media.carousel_updated': {
    phrase: 'editó una imagen del carrusel',
    icon: Image,
    tone: NEUTRAL,
    showTarget: false,
  },
  'media.carousel_deleted': {
    phrase: 'eliminó una imagen del carrusel',
    icon: Trash2,
    tone: NEGATIVE,
    showTarget: false,
  },
  'media.product_image_created': {
    phrase: 'agregó una imagen al producto',
    icon: ImagePlus,
    tone: NEUTRAL,
  },
  'media.product_image_updated': {
    phrase: 'editó una imagen del producto',
    icon: Image,
    tone: NEUTRAL,
  },
  'user.created': {
    phrase: 'creó el usuario',
    icon: UserPlus,
    tone: NEUTRAL,
  },
  'user.updated': {
    phrase: 'editó el usuario',
    icon: UserCog,
    tone: NEUTRAL,
  },
  'user.role_changed': {
    phrase: 'cambió los roles de',
    icon: UserCog,
    tone: PROGRESS,
  },
  'user.deleted': {
    phrase: 'eliminó el usuario',
    icon: UserMinus,
    tone: NEGATIVE,
  },
  'client.created': {
    phrase: 'registró al cliente',
    icon: Plus,
    tone: NEUTRAL,
  },
  'client.updated': {
    phrase: 'editó al cliente',
    icon: Pencil,
    tone: NEUTRAL,
  },
  'client.deleted': {
    phrase: 'eliminó al cliente',
    icon: Trash2,
    tone: NEGATIVE,
  },
  'client.balances_recomputed': {
    phrase: 'recalculó los saldos a favor de los clientes',
    icon: Calculator,
    tone: MONEY,
    showTarget: false,
  },
  'auth.login': {
    phrase: 'inició sesión',
    icon: LogIn,
    tone: NEUTRAL,
    showTarget: false,
  },
  'auth.logout': {
    phrase: 'cerró sesión',
    icon: LogOut,
    tone: NEUTRAL,
    showTarget: false,
  },
  'auth.password_reset_requested': {
    phrase: 'pidió restablecer la contraseña de',
    icon: KeyRound,
    tone: PROGRESS,
  },
  'auth.password_reset': {
    phrase: 'restableció la contraseña de',
    icon: KeyRound,
    tone: PROGRESS,
  },
  'support.ticket_created': {
    phrase: 'envió a soporte el reporte',
    icon: LifeBuoy,
    tone: NEUTRAL,
  },
  'support.ticket_status_changed': {
    phrase: 'cambió el estado del reporte',
    icon: LifeBuoy,
    tone: PROGRESS,
  },
  'support.ticket_closed': {
    phrase: 'cerró el reporte',
    icon: CheckCircle2,
    tone: POSITIVE,
  },
};

/** Verbos que el front todavía no conoce se muestran igual, sin romper */
export function verbConfig(verb: string): VerbConfig {
  return (
    ACTIVITY_VERBS[verb as ActivityVerb] ?? {
      phrase: verb,
      icon: ArrowRightLeft,
      tone: NEUTRAL,
    }
  );
}

/** Si mostrar el objetivo tras la frase */
export function showsTarget(event: ActivityEvent): boolean {
  if (verbConfig(event.verb).showTarget === false) return false;
  // Cargas masivas sin sucursal única: no hay nada que nombrar
  return !(event.targetId === 0 && !event.targetLabel);
}

const ORDER_TYPE_LABELS: Record<string, string> = {
  sale: 'Venta',
  wholesale: 'Venta al mayor',
  purchase: 'Compra',
  payment: 'Pago',
  service: 'Servicio',
};

/** Origen de las operaciones masivas (`payload.source`) */
const BULK_SOURCE_LABELS: Record<string, string> = {
  batch_parts: 'Excel de repuestos',
  part_purchase_file: 'Archivo de compra de repuestos',
  branch_purchase_file: 'Archivo de compra de la sucursal',
  ek_file: 'Archivo EK',
  inventory_file: 'Archivo de inventario',
  sku_file: 'Archivo por SKU',
  batch_edit: 'Edición en lote',
  ek_parts_upload: 'Alta de repuestos EK',
  ek_parts_update: 'Actualización de repuestos EK',
  sku_mismatch_fix: 'Corrección de SKU',
  product_sync: 'Sincronización de productos',
  bike_prices: 'Precios de motos',
  part_prices_file: 'Archivo de precios de repuestos',
  price_excel: 'Excel de precios',
  public_signup: 'Registro público',
  client_account: 'Cuenta creada con el cliente',
};

/** Contadores de las operaciones masivas, en camelCase como llega el payload */
const COUNT_LABELS: Record<string, string> = {
  created: 'creados',
  createdTotal: 'creados',
  updated: 'actualizados',
  updatedTotal: 'actualizados',
  updatedCount: 'actualizados',
  failed: 'con error',
  failedTotal: 'con error',
  fixed: 'corregidos',
  clients: 'clientes',
  lines: 'líneas',
  mergedTotal: 'fusionados',
  costUpdatedTotal: 'costos actualizados',
  transactionsModifiedTotal: 'movimientos ajustados',
  transactionsCreatedTotal: 'movimientos creados',
  adjustedUpTotal: 'ajustes al alza',
  adjustedDownTotal: 'ajustes a la baja',
};

/** Nombres legibles de los campos que aparecen en `payload.changes` */
const FIELD_LABELS: Record<string, string> = {
  amount: 'monto',
  quantity: 'cantidad',
  productId: 'producto',
  originBranchId: 'origen',
  targetBranchId: 'destino',
  type: 'tipo',
  plate: 'placa',
  receptionDate: 'fecha de recepción',
  sku: 'SKU',
  name: 'nombre',
  model: 'modelo',
  brand: 'marca',
  categoryId: 'categoría',
  cost: 'costo',
  price: 'precio',
  epPrice: 'precio EP',
  dpPrice: 'precio DP',
  bulkPrice: 'precio al mayor',
  isFeatured: 'destacado',
  ekAvailable: 'disponible en EK',
  packageQuantity: 'unidades por paquete',
  firstName: 'nombre',
  lastName: 'apellido',
  email: 'correo',
  username: 'usuario',
  documentId: 'documento',
  phoneNumber: 'teléfono',
  branchId: 'sucursal',
  isActive: 'activo',
  password: 'contraseña',
  countryId: 'cédula',
  created: 'nuevo',
  // Gastos (`expense.updated`, `expense.category_updated`)
  amountUsd: 'monto USD',
  currency: 'moneda',
  rate: 'tasa',
  rateType: 'tipo de tasa',
  paymentMethod: 'tipo de pago',
  category: 'categoría',
  expenseDate: 'fecha',
  concept: 'concepto',
  reference: 'referencia',
  originBank: 'banco origen',
  targetBank: 'banco destino',
  originAccount: 'cuenta origen',
  targetAccount: 'cuenta destino',
  beneficiary: 'beneficiario',
  excludedFromCash: 'fuera de caja',
  status: 'estado',
  lines: 'detalle',
  accountCode: 'código de cuenta',
  accountName: 'nombre de cuenta',
  groupCode: 'grupo',
  groupName: 'nombre del grupo',
  kind: 'tipo',
  sortOrder: 'orden',
};

function expenseStatus(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  return EXPENSE_STATUS_LABELS[text as ExpenseStatus] ?? text;
}

/** "$12.00" o "Bs 1.500,00" según la moneda del gasto */
function expenseAmount(amount: unknown, currency: unknown): string | null {
  const value = asNumber(amount);
  if (value === null) return null;
  if (currency === 'BS') {
    return `Bs ${value.toLocaleString('es-VE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return money(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  // Los Decimal del backend llegan como texto ("950.00")
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value : null;
}

function money(value: unknown): string | null {
  const amount = asNumber(value);
  if (amount === null) return null;
  return `$${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function usedBikeStatus(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  return USED_BIKE_STATUS_LABELS[text as UsedBikeStatus] ?? text;
}

/** Categorías de producto: enteros fijos del backend */
const CATEGORY_NAMES: Record<string, string> = {
  '1': 'Motos',
  '2': 'Repuestos',
  '3': 'Financiero',
};

function categoryName(value: unknown): string {
  return CATEGORY_NAMES[String(value)] ?? shortValue(value);
}

function shortValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'sí' : 'no';
  return String(value);
}

/** "monto: 10 → 99, costo: 1 → 7.5" (tope 3 campos; la contraseña sin valores) */
function describeChanges(changes: unknown, maxFields = 3): string | null {
  if (!changes || typeof changes !== 'object' || Array.isArray(changes)) {
    // arranca_balance manda solo la lista de campos
    if (Array.isArray(changes) && changes.length > 0) {
      return `Cambió: ${changes
        .map((field) => FIELD_LABELS[String(field)] ?? String(field))
        .join(', ')}`;
    }
    return null;
  }
  const entries = Object.entries(changes as Record<string, unknown>);
  if (entries.length === 0) return null;
  const parts = entries.slice(0, maxFields).map(([field, diff]) => {
    const label = FIELD_LABELS[field] ?? field;
    if (field === 'created') return 'nuevo';
    if (Array.isArray(diff) && diff.length === 2) {
      // Las líneas de un gasto llegan como dos listas ("Oficina: 10.00")
      if (Array.isArray(diff[0]) || Array.isArray(diff[1])) {
        const list = (value: unknown) =>
          Array.isArray(value) && value.length > 0
            ? value.map(shortValue).join(' + ')
            : '—';
        return `${label}: ${list(diff[0])} → ${list(diff[1])}`;
      }
      const format = field === 'categoryId' ? categoryName : shortValue;
      return `${label}: ${format(diff[0])} → ${format(diff[1])}`;
    }
    return label;
  });
  const rest =
    entries.length > maxFields ? ` y ${entries.length - maxFields} más` : '';
  return `${parts.join(', ')}${rest}`;
}

export interface ActivityBulkItem {
  sku: string;
  name: string | null;
  /** "costo: 1 → 1.5, nombre: Filtro → Filtro de aire" */
  description: string;
}

/**
 * Detalle producto por producto de una operación masiva (`payload.items`).
 * El backend guarda hasta 1.000; `total` es el número real.
 */
export function activityBulkItems(event: ActivityEvent): {
  items: ActivityBulkItem[];
  total: number;
} {
  const raw = event.payload.items;
  if (!Array.isArray(raw)) return { items: [], total: 0 };
  const items = raw.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    return [
      {
        sku: shortValue(item.sku),
        name: asText(item.name),
        description: describeChanges(item.changes, 10) ?? '',
      },
    ];
  });
  const total = asNumber(event.payload.itemsTotal) ?? items.length;
  return { items, total };
}

/** "12 creados · 1 con error" */
function describeCounts(payload: Record<string, unknown>): string[] {
  return Object.entries(COUNT_LABELS).flatMap(([key, label]) => {
    const value = asNumber(payload[key]);
    return value === null ? [] : [`${value.toLocaleString()} ${label}`];
  });
}

/**
 * Detalle secundario de un evento, armado desde su `payload` (que llega en
 * camelCase, como todo el API). Devuelve las piezas; la vista las une.
 */
export function activityDetails(event: ActivityEvent): string[] {
  const { payload } = event;
  const details: string[] = [];
  const section = event.verb.split('.')[0];

  const source = asText(payload.source);
  if (source) details.push(BULK_SOURCE_LABELS[source] ?? source);

  if (section === 'used_bike') {
    const product = asText(payload.product);
    if (product) details.push(product);

    if (event.verb === 'used_bike.approved') {
      const cost = money(payload.cost);
      const price = money(payload.price);
      if (cost) details.push(`Compra ${cost}`);
      if (price) details.push(`Venta ${price}`);
    }

    const from = usedBikeStatus(payload.from);
    const to = usedBikeStatus(payload.to);
    if (from && to) details.push(`${from} → ${to}`);
    else if (from) details.push(`Antes: ${from}`);
  }

  if (section === 'order') {
    const type = asText(payload.type);
    if (type) details.push(ORDER_TYPE_LABELS[type] ?? type);
    const total = money(payload.totalInvoiceUsd);
    if (total) details.push(total);
  }

  if (section === 'transaction' || section === 'service') {
    const type = asText(payload.type);
    if (type) details.push(ORDER_TYPE_LABELS[type] ?? type);
    const product = asText(payload.product);
    if (product) details.push(product);
    const quantity = asNumber(payload.quantity);
    const amount = money(payload.amount);
    if (quantity !== null && amount) details.push(`${quantity} × ${amount}`);
    const mechanic = asText(payload.mechanic);
    if (mechanic) details.push(`Mecánico: ${mechanic}`);
    const imei = asText(payload.gpsImei);
    if (imei) details.push(`GPS ${imei}`);
  }

  if (section === 'arranca_balance') {
    const amount = money(payload.amount);
    if (amount) details.push(amount);
    const concept = asText(payload.concept);
    if (concept && concept !== event.targetLabel) details.push(concept);
    if (payload.origin === 'arranca') details.push('Desde Arranca');
  }

  if (section === 'purchase_order') {
    const lines = asNumber(payload.lines);
    if (lines !== null) details.push(`${lines} líneas`);
  }

  if (section === 'expense' && event.targetModel === 'expense') {
    const amount = expenseAmount(payload.amount, payload.currency);
    if (amount) details.push(amount);
    if (payload.currency === 'BS') {
      const usd = money(payload.amountUsd);
      if (usd) details.push(`= ${usd}`);
    }
    const method = asText(payload.paymentMethod);
    if (method) {
      details.push(
        EXPENSE_PAYMENT_METHOD_LABELS[method as ExpensePaymentMethod] ?? method
      );
    }
    const category = asText(payload.category);
    if (category) details.push(category);
    const concept = asText(payload.concept);
    if (concept) details.push(concept);
    const beneficiary = asText(payload.beneficiary);
    if (beneficiary) details.push(`Beneficiario: ${beneficiary}`);
    const invoice = asText(payload.invoiceNumber);
    if (invoice) details.push(`Factura ${invoice}`);
    const retained = expenseAmount(payload.retained, payload.currency);
    if (retained && asNumber(payload.retained)) {
      details.push(`Retenido ${retained}`);
    }
    const from = expenseStatus(payload.from);
    const to = expenseStatus(payload.to);
    if (from && to) details.push(`${from} → ${to}`);
    if (payload.excludedFromCash === true) details.push('Fuera de caja');
    const note = asText(payload.note);
    if (note) details.push(note);
  }

  if (section === 'supplier') {
    const rif = asText(payload.rif);
    if (rif) details.push(`RIF ${rif}`);
  }

  if (section === 'cash_withdrawal') {
    const amount = money(payload.amountUsd);
    if (amount) details.push(amount);
    const destination = asText(payload.destination);
    if (destination) details.push(destination);
    const concept = asText(payload.concept);
    if (concept) details.push(concept);
    const deliveredTo = asText(payload.deliveredTo);
    if (deliveredTo) details.push(`Entregado a: ${deliveredTo}`);
  }

  if (section === 'product' || section === 'price') {
    const name = asText(payload.name) ?? asText(payload.product);
    if (name) details.push(name);
    if (event.verb === 'price.created') {
      const price = money(payload.price);
      if (price) details.push(price);
    }
  }

  if (section === 'rate') {
    const rate = asNumber(payload.rate);
    const usdt = asNumber(payload.usdtRate);
    if (rate !== null) details.push(`BCV ${rate}`);
    if (usdt !== null) details.push(`USDT ${usdt}`);
  }

  if (section === 'user' && event.verb === 'user.role_changed') {
    details.push(`${shortValue(payload.from)} → ${shortValue(payload.to)}`);
  }

  if (section === 'survey') {
    const version = asNumber(payload.version ?? payload.newDraftVersion);
    if (version !== null) details.push(`Versión ${version}`);
    const score = asNumber(payload.totalScore);
    if (score !== null) details.push(`Puntaje ${score.toFixed(0)}%`);
  }

  if (section !== 'used_bike' && section !== 'expense') {
    const from = asText(payload.from);
    const to = asText(payload.to);
    if (section !== 'user' && from && to) details.push(`${from} → ${to}`);
  }

  const reason = asText(payload.reason);
  if (reason) details.push(`Motivo: ${reason}`);

  const changes = describeChanges(payload.changes);
  if (changes) details.push(changes);

  details.push(...describeCounts(payload));

  if (event.clientName && event.targetModel !== 'client') {
    details.push(`Cliente: ${event.clientName}`);
  }
  return details;
}

export function formatActivityTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('es-VE', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatActivityDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('es-VE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Clave local (YYYY-MM-DD) del día del evento, para agrupar el feed */
export function activityDayKey(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatActivityDay(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Hoy';
  if (date.toDateString() === yesterday.toDateString()) return 'Ayer';
  return date.toLocaleDateString('es-VE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
