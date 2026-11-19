'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { ProductsService } from '@/services/products/products.service';
import { PurchasesService } from '@/services/purchases/purchases.service';
import { useRoles, useSuperuser, useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useAllBranches } from '@/hooks/useAllBranches';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/hooks/purchases/usePurchaseOrders';
import { useApprovalLookup, useMoveApprovalBikes } from '@/hooks/approvals';
import { ApprovalNumberInput } from '@/components/approvals/approvalNumberInput.component';
import {
  BikeIdentityConflict,
  PurchaseOrder,
} from '@/services/purchases/types/PurchaseOrder.type';
import { ApprovalLookup } from '@/services/approvals/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Badge } from '@/components/ui/badge.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import {
  AlertTriangle,
  Bike,
  FileText,
  CheckCircle2,
  ShoppingCart,
  Trash2,
  Pencil,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { BIKES_COLORS } from '@/constants/products';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { useInvoiceReaderStatus } from '@/hooks/purchases/useReadInvoice';
import { PurchaseBikeCartLine } from '@/models/purchaseBikeCart.model';
import { RejectedCartRow } from '@/models/purchasePartsCart.model';
import { RejectedRowsTable } from './rejectedRowsTable.component';
import { UploadBikeInvoiceModal } from './uploadBikeInvoiceModal.component';
import { APPROVALS_NEW } from '@/constants/routes';
import {
  APPROVALS_ALLOWED_ROLES,
  getApprovalErrorMessage,
  normalizeApprovalNumber,
} from '@/components/approvals/approvals.utils';
import {
  BikeIdentityFields,
  normalizeSerial,
  validateBikeIdentity,
} from './bikeIdentity.utils';
import { PurchaseBikeReviewDialog } from './purchaseBikeReviewDialog.component';

const productsService = new ProductsService();
const purchasesService = new PurchasesService();

// Mismo criterio que el carrito de Repuestos: solo Super Admin o "El Panita"
// eligen sucursal receptora; el resto recibe siempre en su propia sucursal.
const EL_PANITA_BRANCH_ID = 32;

const NO_SPINNER_CLASSES =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

const CONFLICT_FIELD_LABELS: Record<BikeIdentityConflict['field'], string> = {
  plate: 'La placa',
  chassis_serial: 'El chasis',
  motor_serial: 'El motor',
};

interface CatalogBike {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  /** A diferencia de Repuestos, el costo real de una moto NO vive en
   * `product.cost` (queda null) -- lo agrega la vista aparte desde el
   * modelo `Price`, anidado acá. Misma fuente que usa "Actualización de
   * Precios" (columna "Costo"). */
  prices: { cost: number } | null;
}

/** Una moto del carrito: el mismo modelo que arma "Subir Factura", con su
 * número de aprobación de Empire. */
type BikeLine = PurchaseBikeCartLine;

// Igual que en Repuestos: el costo de factura se muestra solo si difiere del
// de catálogo más que esto (informativo; el costo de la línea no cambia).
const INVOICE_COST_HINT_RATIO = 0.05;

function showInvoiceCost(line: BikeLine) {
  if (line.invoiceCost === null || line.invoiceCost === undefined) return false;
  if (!line.cost) return true;
  return (
    Math.abs(line.invoiceCost - line.cost) / line.cost > INVOICE_COST_HINT_RATIO
  );
}

interface IdentityForm extends BikeIdentityFields {
  cost: string;
  invoiceNumber: string;
  inNumber: string;
  notes: string;
  approvalNumber: string;
}

const EMPTY_FORM: IdentityForm = {
  plate: '',
  color: '',
  chassisSerial: '',
  motorSerial: '',
  year: '',
  cost: '',
  invoiceNumber: '',
  inNumber: '',
  notes: '',
  approvalNumber: '',
};

interface PurchaseBikeCartProps {
  /** Presente = editando una preorden existente en vez de creando una nueva
   * (PATCH en vez de POST, precargada con sus unidades actuales). */
  editOrder?: PurchaseOrder;
}

/** Errores por moto que devuelve el backend al guardar (`errors.approvals` / `errors.identity`). */
interface SaveErrorBody {
  message?: string;
  errors?: {
    approvals?: { index: number; message: string }[];
    identity?: { index: number; conflicts: BikeIdentityConflict[] }[];
  };
}

function describeConflict(conflict: BikeIdentityConflict): string {
  const what = CONFLICT_FIELD_LABELS[conflict.field];
  return conflict.source === 'inventory'
    ? `${what} ya pertenece a la moto ${conflict.plate} del inventario.`
    : `${what} ya está en la preorden #${conflict.purchaseOrderId} (moto ${conflict.plate}).`;
}

/**
 * Cuánto cupo le queda a ``productId`` para la sucursal que recibe en la
 * aprobación consultada, descontando las motos del carrito con ese número
 * (salvo la que se edita). `undefined` si la aprobación no envía ese modelo a
 * esa sucursal.
 */
function roomFor(
  lookup: ApprovalLookup | undefined,
  productId: number | undefined,
  branchId: number | undefined,
  lines: BikeLine[],
  skipIndex: number | null
): number | undefined {
  if (!lookup || productId === undefined || !branchId) return undefined;
  const line = lookup.lines.find(
    (item) => item.product.id === productId && item.branch.id === branchId
  );
  if (!line) return undefined;
  const inCart = lines.filter(
    (item, index) =>
      index !== skipIndex &&
      item.productId === productId &&
      item.approvalNumber === lookup.number
  ).length;
  return line.availableQuantity - inCart;
}

/**
 * Carrito de preorden de compra de motos: multi-línea, como Repuestos --
 * cada línea es una unidad física distinta (nunca se "suma cantidad" a una
 * existente, a diferencia de Repuestos). Elegir un modelo abre un modal
 * pidiendo la identidad de esa unidad puntual (placa, color, seriales,
 * año) y su número de aprobación de Empire.
 *
 * El número de aprobación se escribe una vez arriba y se copia a cada moto
 * (se puede cambiar por moto). La aprobación tiene que existir y tener cupo
 * para el modelo; al aprobarse la preorden, cada moto cuenta sola para su
 * aprobación. Antes de enviar, una revisión moto por moto.
 */
export function PurchaseBikeCart({ editOrder }: PurchaseBikeCartProps) {
  const token = useToken();
  const router = useRouter();
  const currentBranchId = useCurrentBranchId();
  const { data: branches } = useAllBranches();
  const isEditing = !!editOrder;

  const canPickAnyBranch =
    currentBranchId === undefined ||
    currentBranchId === 0 ||
    currentBranchId === EL_PANITA_BRANCH_ID;
  const [targetBranch, setTargetBranch] = useState<string>(
    editOrder
      ? String(editOrder.targetBranch.id)
      : canPickAnyBranch
        ? ''
        : String(currentBranchId)
  );
  useEffect(() => {
    if (!canPickAnyBranch && currentBranchId !== undefined) {
      setTargetBranch(String(currentBranchId));
    }
  }, [canPickAnyBranch, currentBranchId]);
  const lockedBranchName = (branches || []).find(
    (branch) => branch.id === currentBranchId
  )?.name;
  const targetBranchName =
    (branches || []).find((branch) => String(branch.id) === targetBranch)
      ?.name ?? '';
  const targetBranchId = targetBranch ? Number(targetBranch) : undefined;
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const canMoveApprovalBikes =
    isSuperuser === true ||
    APPROVALS_ALLOWED_ROLES.some((role) => roles.includes(role));
  const { moveApprovalBikes, isMovingApprovalBikes } = useMoveApprovalBikes();
  const [moveError, setMoveError] = useState('');

  const moveOneHere = async (fromBranchId: number) => {
    const lookup = modalLookup.approvalLookup;
    if (!lookup || !targetBranchId || modalProductId === undefined) return;
    setMoveError('');
    try {
      await moveApprovalBikes({
        id: lookup.id,
        payload: {
          product: modalProductId,
          fromBranch: fromBranchId,
          toBranch: targetBranchId,
          quantity: 1,
        },
      });
    } catch (error) {
      setMoveError(getApprovalErrorMessage(error, 'No se pudo mover la moto.'));
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);

  const [pendingBike, setPendingBike] = useState<CatalogBike | null>(null);
  const [editingLineIndex, setEditingLineIndex] = useState<number | null>(null);
  const [form, setForm] = useState<IdentityForm>(EMPTY_FORM);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [touched, setTouched] = useState(false);
  const [identityConflicts, setIdentityConflicts] = useState<
    BikeIdentityConflict[]
  >([]);
  const [isCheckingIdentity, setIsCheckingIdentity] = useState(false);
  const [bikeLines, setBikeLines] = useState<BikeLine[]>(() =>
    editOrder
      ? editOrder.lines.map((line) => ({
          productId: line.product.id,
          sku: line.product.sku,
          name: line.product.name,
          model: line.product.model,
          brand: line.product.brand,
          cost: line.cost,
          plate: line.plate,
          color: line.color,
          chassisSerial: line.chassisSerial,
          motorSerial: line.motorSerial,
          year: line.year,
          invoiceNumber: line.invoiceNumber,
          inNumber: line.inNumber,
          notes: line.notes,
          approvalNumber: line.approvalNumber ?? '',
        }))
      : []
  );
  const [defaultApprovalNumber, setDefaultApprovalNumber] = useState(
    editOrder?.lines.find((line) => line.approvalNumber)?.approvalNumber ?? ''
  );
  const [orderNotes, setOrderNotes] = useState(editOrder?.notes ?? '');
  const [successId, setSuccessId] = useState<number | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const { isInvoiceReaderEnabled } = useInvoiceReaderStatus();
  // Unidades de la última factura que no entraron; se limpia al guardar o al
  // cerrar el aviso
  const [rejectedRows, setRejectedRows] = useState<RejectedCartRow[]>([]);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  // Fijado al abrir la confirmación: si se leyera `bikeLines`, el diálogo
  // diría "0 motos" mientras se desvanece.
  const [linesToClear, setLinesToClear] = useState(0);
  const { toast } = useToast();
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [saveErrors, setSaveErrors] = useState<{
    message: string;
    byLine: Record<number, string[]>;
  } | null>(null);

  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder(editOrder?.id ?? 0);
  const saveMutation = isEditing ? updatePurchaseOrder : createPurchaseOrder;

  // La aprobación por defecto (arriba del carrito) y la de la moto del modal.
  const defaultLookup = useApprovalLookup(defaultApprovalNumber, editOrder?.id);
  const isIdentityModalOpen = !!pendingBike || editingLineIndex !== null;
  const modalLookup = useApprovalLookup(
    isIdentityModalOpen ? form.approvalNumber : '',
    editOrder?.id
  );

  const catalogQuery = useQuery({
    queryKey: ['purchaseBikeCatalog', token, page, debouncedSearch],
    queryFn: () =>
      productsService.getAllBikes(token as string, {
        page: page.toString(),
        pageSize: '10',
        search: debouncedSearch,
      }),
    enabled: !!token,
  });

  const catalogData = catalogQuery.data?.data;
  // BikeProduct's type is missing `prices` even though ProductAllBikeView
  // always adds it per row (batched from the Price model -- see the
  // comment on CatalogBike.prices above).
  const bikes: CatalogBike[] =
    (catalogData?.results as unknown as CatalogBike[]) || [];
  const totalPages = catalogData?.totalPages || 1;

  const clearSaveErrors = () => setSaveErrors(null);

  const openIdentityModal = (bike: CatalogBike) => {
    setPendingBike(bike);
    setEditingLineIndex(null);
    setTouched(false);
    setIdentityConflicts([]);
    setForm({
      ...EMPTY_FORM,
      cost: bike.prices?.cost ? String(bike.prices.cost) : '',
      approvalNumber: normalizeApprovalNumber(defaultApprovalNumber),
    });
  };

  // Reabre el modal con los datos ya cargados de una unidad que ya está en
  // el carrito -- por índice, no por placa, justamente porque la placa es
  // uno de los campos que se puede terminar editando acá.
  const openEditModal = (index: number) => {
    const line = bikeLines[index];
    setEditingLineIndex(index);
    setPendingBike(null);
    setTouched(false);
    setIdentityConflicts([]);
    setForm({
      plate: line.plate,
      color: line.color,
      chassisSerial: line.chassisSerial,
      motorSerial: line.motorSerial,
      year: line.year,
      cost: String(line.cost),
      invoiceNumber: line.invoiceNumber,
      inNumber: line.inNumber,
      notes: line.notes,
      approvalNumber: line.approvalNumber,
    });
    setShowOptionalFields(!!(line.invoiceNumber || line.notes));
  };

  const closeModal = () => {
    setPendingBike(null);
    setEditingLineIndex(null);
    setForm(EMPTY_FORM);
    setShowOptionalFields(false);
    setIdentityConflicts([]);
  };

  const isEditingLine = editingLineIndex !== null;
  const modalProductId = isEditingLine
    ? bikeLines[editingLineIndex]?.productId
    : pendingBike?.id;
  const modalProductName = isEditingLine
    ? bikeLines[editingLineIndex]?.name
    : pendingBike?.name;

  // Dos unidades físicas nunca pueden compartir placa ni seriales, ni
  // siquiera dentro de la misma preorden. La línea que se edita queda afuera.
  const otherLines = bikeLines.filter((_, index) => index !== editingLineIndex);
  const isDuplicatePlate = otherLines.some(
    (line) =>
      line.plate.trim().toUpperCase() === form.plate.trim().toUpperCase()
  );
  const isDuplicateChassis = otherLines.some(
    (line) =>
      normalizeSerial(line.chassisSerial) ===
      normalizeSerial(form.chassisSerial)
  );
  const isDuplicateMotor = otherLines.some(
    (line) =>
      normalizeSerial(line.motorSerial) === normalizeSerial(form.motorSerial)
  );
  const fieldErrors = validateBikeIdentity(form);

  // El número de aprobación de la moto del modal: existe, acepta motos,
  // incluye el modelo y tiene cupo (contando el carrito).
  const modalNumber = normalizeApprovalNumber(form.approvalNumber);
  const modalRoom = roomFor(
    modalLookup.approvalLookup,
    modalProductId,
    targetBranchId,
    bikeLines,
    editingLineIndex
  );
  // Otras sucursales con cupo para este modelo en la aprobación: un gerente
  // puede pasar una a la sucursal que recibe sin salir del carrito.
  const movableFrom =
    modalLookup.approvalLookup?.lines.filter(
      (line) =>
        line.product.id === modalProductId &&
        line.branch.id !== targetBranchId &&
        line.availableQuantity > 0
    ) ?? [];
  let approvalProblem = '';
  if (!modalNumber)
    approvalProblem = 'Falta el número de aprobación de Empire.';
  else if (modalLookup.isLookupStale || modalLookup.isLoadingLookup)
    approvalProblem = 'pending';
  else if (modalLookup.isLookupNotFound)
    approvalProblem = `La aprobación ${modalNumber} no existe. Regístrela primero en Aprobaciones Empire.`;
  else if (modalLookup.isLookupError)
    approvalProblem = 'No se pudo consultar la aprobación. Intente de nuevo.';
  else if (
    modalLookup.approvalLookup &&
    !modalLookup.approvalLookup.acceptsBikes
  )
    approvalProblem = `La aprobación ${modalNumber} ya no acepta motos (${
      modalLookup.approvalLookup.status === 'closed' ? 'cerrada' : 'completa'
    }).`;
  else if (!targetBranchId)
    approvalProblem = 'Elija primero la sucursal que recibe.';
  else if (
    modalLookup.approvalLookup &&
    !modalLookup.approvalLookup.lines.some(
      (line) => line.product.id === modalProductId
    )
  )
    approvalProblem = `La aprobación ${modalNumber} no incluye ${modalProductName ?? 'este modelo'}.`;
  else if (modalLookup.approvalLookup && modalRoom === undefined)
    approvalProblem = `La aprobación ${modalNumber} no envía ${modalProductName ?? 'este modelo'} a ${targetBranchName || 'esta sucursal'}.`;
  else if (modalRoom !== undefined && modalRoom <= 0)
    approvalProblem = `La aprobación ${modalNumber} no tiene más ${modalProductName ?? 'motos de este modelo'} para ${targetBranchName || 'esta sucursal'}.`;

  const canSaveIdentity =
    isIdentityModalOpen &&
    Object.keys(fieldErrors).length === 0 &&
    Number(form.cost) > 0 &&
    !isDuplicatePlate &&
    !isDuplicateChassis &&
    !isDuplicateMotor &&
    !approvalProblem &&
    !isCheckingIdentity;

  const handleSaveIdentity = async () => {
    setTouched(true);
    if (!canSaveIdentity) return;

    // Placa y seriales contra el inventario y las otras preórdenes, mientras
    // la persona todavía tiene la moto adelante.
    setIsCheckingIdentity(true);
    try {
      const conflicts = await purchasesService.checkBikeIdentity(token, {
        plate: form.plate,
        chassis_serial: form.chassisSerial,
        motor_serial: form.motorSerial,
        purchase_order: editOrder?.id,
      });
      setIdentityConflicts(conflicts);
      if (conflicts.length) return;
    } catch {
      // Si la verificación no responde, el backend la repite al guardar.
    } finally {
      setIsCheckingIdentity(false);
    }

    const identity = {
      cost: Number(form.cost),
      plate: form.plate.trim().toUpperCase(),
      color: form.color,
      chassisSerial: normalizeSerial(form.chassisSerial),
      motorSerial: normalizeSerial(form.motorSerial),
      year: form.year,
      invoiceNumber: form.invoiceNumber,
      inNumber: form.inNumber,
      notes: form.notes,
      approvalNumber: modalNumber,
    };
    if (isEditingLine) {
      setBikeLines((prev) =>
        prev.map((line, index) =>
          index === editingLineIndex ? { ...line, ...identity } : line
        )
      );
    } else if (pendingBike) {
      setBikeLines((prev) => [
        ...prev,
        {
          productId: pendingBike.id,
          sku: pendingBike.sku,
          name: pendingBike.name,
          model: pendingBike.model,
          brand: pendingBike.brand,
          ...identity,
        },
      ]);
    }
    clearSaveErrors();
    closeModal();
  };

  const removeLine = (index: number) => {
    setBikeLines((prev) => prev.filter((_, i) => i !== index));
    clearSaveErrors();
  };

  const clearCart = () => {
    setBikeLines([]);
    setRejectedRows([]);
    setIsClearConfirmOpen(false);
    toast({ description: 'Carrito vaciado.' });
  };

  // "Subir Factura": cada moto ya viene con su identidad; se agregan al final,
  // y desde el carrito se pueden editar con el mismo modal de siempre.
  const handleLoadFromInvoice = (
    lines: BikeLine[],
    rejected: RejectedCartRow[]
  ) => {
    // Cada moto trae el número de aprobación de su factura, ya consultado en
    // el modal; sigue editable por moto desde el carrito.
    setBikeLines((prev) => [...prev, ...lines]);
    // Varias facturas seguidas: el aviso junta lo que no entró de todas.
    setRejectedRows((prev) => [...prev, ...rejected]);
    clearSaveErrors();
    toast({
      title: 'Motos cargadas',
      description:
        `Se agregaron ${lines.length} moto${lines.length === 1 ? '' : 's'} al carrito con su aprobación; ` +
        'el año sale del chasis (VIN).' +
        (rejected.length > 0
          ? ` ${rejected.length} no entr${rejected.length === 1 ? 'ó' : 'aron'}.`
          : ''),
    });
  };

  const total = bikeLines.reduce((sum, line) => sum + line.cost, 0);

  const canConfirm =
    !!targetBranch &&
    bikeLines.length > 0 &&
    bikeLines.every((line) => !!line.approvalNumber);

  const handleSave = () => {
    if (!canConfirm) return;
    const payload = {
      target_branch: Number(targetBranch),
      category: 'bikes' as const,
      notes: orderNotes,
      lines: bikeLines.map((line) => ({
        product: line.productId,
        quantity: 1,
        cost: line.cost,
        plate: line.plate,
        color: line.color,
        chassis_serial: line.chassisSerial,
        motor_serial: line.motorSerial,
        year: line.year,
        invoice_number: line.invoiceNumber,
        in_number: line.inNumber,
        notes: line.notes,
        approval_number: line.approvalNumber,
      })),
    };
    const onSuccess = (order: { id: number }) => {
      setIsReviewOpen(false);
      setSuccessId(order.id);
      setRejectedRows([]);
      if (!isEditing) setBikeLines([]);
    };
    const onError = (error: unknown) => {
      setIsReviewOpen(false);
      const body = (error as { response?: { data?: SaveErrorBody } })?.response
        ?.data;
      const byLine: Record<number, string[]> = {};
      body?.errors?.approvals?.forEach((entry) => {
        (byLine[entry.index] ??= []).push(entry.message);
      });
      body?.errors?.identity?.forEach((entry) => {
        (byLine[entry.index] ??= []).push(
          ...entry.conflicts.map(describeConflict)
        );
      });
      setSaveErrors({
        message:
          body?.message ||
          (isEditing
            ? 'No se pudo actualizar la preorden.'
            : 'No se pudo crear la preorden.'),
        byLine,
      });
    };
    if (isEditing) {
      updatePurchaseOrder.mutate(payload, { onSuccess, onError });
    } else {
      createPurchaseOrder.mutate(payload, { onSuccess, onError });
    }
  };

  // Modelos que la aprobación por defecto envía a la sucursal que recibe,
  // con su cupo descontando el carrito.
  const defaultApprovalModels = useMemo(() => {
    const lookup = defaultLookup.approvalLookup;
    if (!lookup || !targetBranchId) return new Map<number, number>();
    return new Map(
      lookup.lines
        .filter((line) => line.branch.id === targetBranchId)
        .map((line) => [
          line.product.id,
          roomFor(lookup, line.product.id, targetBranchId, bikeLines, null) ??
            0,
        ])
    );
  }, [defaultLookup.approvalLookup, bikeLines, targetBranchId]);

  if (successId) {
    return (
      <Card className="p-6 max-w-md mx-auto text-center space-y-4">
        <h2 className="text-lg font-semibold">
          {isEditing
            ? `Preorden #${successId} actualizada`
            : `Preorden #${successId} creada y enviada a aprobación`}
        </h2>
        <div className="flex justify-center gap-2">
          {!isEditing && (
            <Button variant="outline" onClick={() => setSuccessId(null)}>
              Crear otra
            </Button>
          )}
          <Button onClick={() => router.push('/dashboard/purchases')}>
            Ver preórdenes
          </Button>
        </div>
      </Card>
    );
  }

  const defaultNumber = normalizeApprovalNumber(defaultApprovalNumber);

  // "Subir Factura" necesita la sucursal que recibe: el cupo de cada
  // aprobación es por sucursal. El número de aprobación lo trae la factura.
  let invoiceUploadBlocker: string | null = null;
  if (!isInvoiceReaderEnabled)
    invoiceUploadBlocker = 'Lectura de facturas no configurada todavía';
  else if (!targetBranchId)
    invoiceUploadBlocker = 'Elija primero la sucursal que recibe.';

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {rejectedRows.length > 0 && (
        <div className="lg:col-span-3 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {rejectedRows.length === 1
                  ? '1 fila de la factura no entró al carrito'
                  : `${rejectedRows.length} filas de la factura no entraron al carrito`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setRejectedRows([])}
              className="rounded p-1 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-900/40"
              aria-label="Cerrar aviso"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <RejectedRowsTable rows={rejectedRows} />
        </div>
      )}

      <UploadBikeInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        cartLines={bikeLines}
        targetBranchId={targetBranchId}
        targetBranchName={
          canPickAnyBranch ? targetBranchName : (lockedBranchName ?? '')
        }
        purchaseOrderId={editOrder?.id}
        onConfirm={handleLoadFromInvoice}
      />
      <ConfirmDialog
        open={isClearConfirmOpen}
        onOpenChange={setIsClearConfirmOpen}
        title="¿Vaciar el carrito?"
        description={
          linesToClear === 1
            ? 'Se quita la moto del carrito.'
            : `Se quitan las ${linesToClear} motos del carrito.`
        }
        confirmLabel="Vaciar carrito"
        destructive
        onConfirm={clearCart}
      />

      {/* Catálogo */}
      <div className="lg:col-span-2 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          {canPickAnyBranch ? (
            <Select value={targetBranch} onValueChange={setTargetBranch}>
              <SelectTrigger className="sm:w-[220px]">
                <SelectValue placeholder="Sucursal receptora" />
              </SelectTrigger>
              <SelectContent>
                {(branches || []).map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="sm:w-[220px] flex items-center px-3 rounded-md border bg-gray-50 text-sm text-gray-700">
              Recibe:{' '}
              <span className="font-medium ml-1">{lockedBranchName}</span>
            </div>
          )}
          <Input
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar por SKU, nombre o modelo..."
          />
          {/* Un span alrededor: un botón deshabilitado no dispara el title */}
          <span className="shrink-0" title={invoiceUploadBlocker ?? undefined}>
            <Button
              variant="outline"
              className="w-full"
              disabled={!!invoiceUploadBlocker}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Subir Factura
            </Button>
          </span>
        </div>
        {/* El motivo a la vista: el title nativo tarda en salir y se pasa por alto. */}
        {invoiceUploadBlocker && isInvoiceReaderEnabled && (
          <p className="flex items-center gap-1 text-xs text-gray-500">
            <FileText className="h-3.5 w-3.5 shrink-0" />
            Subir Factura: {invoiceUploadBlocker}
          </p>
        )}

        {/* Número de aprobación de Empire: se copia a cada moto agregada. */}
        <Card className="p-4 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="space-y-1 sm:w-[260px]">
              <Label htmlFor="defaultApprovalNumber">
                Número de aprobación Empire
              </Label>
              <ApprovalNumberInput
                id="defaultApprovalNumber"
                value={defaultApprovalNumber}
                onChange={setDefaultApprovalNumber}
                branchId={targetBranchId}
              />
            </div>
            <p className="text-xs text-gray-500 sm:pb-2">
              Se copia a cada moto que agregue (puede cambiarlo por moto). Cada
              moto cuenta para su aprobación cuando se aprueba la preorden.
            </p>
          </div>
          {defaultNumber &&
            (defaultLookup.isLookupStale || defaultLookup.isLoadingLookup ? (
              <p className="text-sm text-gray-500">Consultando aprobación...</p>
            ) : defaultLookup.isLookupNotFound ? (
              <p className="text-sm text-destructive">
                La aprobación {defaultNumber} no existe.{' '}
                <Link href={APPROVALS_NEW} className="underline">
                  Registrarla
                </Link>
              </p>
            ) : defaultLookup.approvalLookup ? (
              <div className="text-sm">
                <p className="text-gray-700">
                  Aprobación{' '}
                  <span className="font-mono font-semibold">
                    {defaultLookup.approvalLookup.number}
                  </span>{' '}
                  · pedida por {defaultLookup.approvalLookup.branch.name}
                  {!defaultLookup.approvalLookup.acceptsBikes && (
                    <span className="ml-1 text-destructive">
                      · ya no acepta motos
                    </span>
                  )}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {!targetBranchId && (
                    <span className="text-xs text-gray-500">
                      Elija la sucursal que recibe para ver el cupo.
                    </span>
                  )}
                  {targetBranchId && defaultApprovalModels.size === 0 && (
                    <span className="text-xs text-destructive">
                      No envía motos a {targetBranchName || 'esta sucursal'}.
                    </span>
                  )}
                  {defaultLookup.approvalLookup.lines
                    .filter((line) => line.branch.id === targetBranchId)
                    .map((line) => {
                      const room =
                        defaultApprovalModels.get(line.product.id) ?? 0;
                      return (
                        <span
                          key={line.product.id}
                          className={cn(
                            'rounded-full px-2 py-0.5 text-xs ring-1 ring-inset',
                            room > 0
                              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                              : 'bg-gray-100 text-gray-500 ring-gray-200'
                          )}
                        >
                          {line.product.name}: {room} disponibles
                        </span>
                      );
                    })}
                </div>
              </div>
            ) : null)}
        </Card>

        {catalogQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando motos...</p>
        ) : bikes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No se encontraron motos
          </p>
        ) : (
          <>
            {bikes.map((bike) => {
              const room = defaultApprovalModels.get(bike.id);
              return (
                <Card
                  key={bike.id}
                  className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
                >
                  <div>
                    <p className="font-medium">
                      {bike.name}
                      {room !== undefined && (
                        <Badge
                          variant="secondary"
                          className={cn(
                            'ml-2',
                            room > 0 ? 'text-emerald-700' : 'text-gray-500'
                          )}
                        >
                          En la aprobación: {room} disponibles
                        </Badge>
                      )}
                    </p>
                    <p className="text-sm text-gray-600">SKU: {bike.sku}</p>
                    <p className="text-sm text-gray-600">
                      Modelo: {bike.model}
                    </p>
                    <p className="text-sm text-gray-600">Marca: {bike.brand}</p>
                    <p className="text-sm font-medium">
                      Costo catálogo: {formatCurrency(bike.prices?.cost ?? 0)}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => openIdentityModal(bike)}>
                    Elegir esta unidad
                  </Button>
                </Card>
              );
            })}
            {totalPages > 1 && (
              <PaginationComponent
                currentPage={page}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      {/* Carrito -- multi-línea, una unidad física por línea */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito de Compra
              </CardTitle>
              {bikeLines.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinesToClear(bikeLines.length);
                    setIsClearConfirmOpen(true);
                  }}
                  aria-label="Vaciar carrito"
                  title="Vaciar carrito"
                  className="h-8 w-8 shrink-0 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <CardDescription>
              Unidades seleccionadas para esta preorden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bikeLines.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bike className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay ninguna moto seleccionada</p>
                <p className="text-sm">
                  Elegí un modelo desde el catálogo o subí la factura
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bikeLines.map((line, index) => {
                    const lineErrors = saveErrors?.byLine[index] ?? [];
                    return (
                      <div
                        key={index}
                        className={cn(
                          'p-3 rounded-lg space-y-1',
                          lineErrors.length
                            ? 'bg-red-50 ring-1 ring-red-200'
                            : 'bg-gray-50'
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{line.name}</p>
                            <p className="text-sm text-gray-600">
                              SKU: {line.sku} · {line.brand}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(index)}
                              className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-0.5 pt-1">
                          <p>Placa: {line.plate}</p>
                          <p>Color: {line.color}</p>
                          <p>
                            Chasis:{' '}
                            <span className="font-mono">
                              {line.chassisSerial}
                            </span>
                          </p>
                          <p>
                            Motor:{' '}
                            <span className="font-mono">
                              {line.motorSerial}
                            </span>
                          </p>
                          <p>Año: {line.year}</p>
                          <p>
                            Aprobación:{' '}
                            <span className="font-mono font-medium text-gray-800">
                              {line.approvalNumber || 'falta'}
                            </span>
                          </p>
                          {line.invoiceNumber && (
                            <p>Nº de factura: {line.invoiceNumber}</p>
                          )}
                          {line.inNumber && (
                            <p>Nº de entrada: {line.inNumber}</p>
                          )}
                          {line.notes && <p>Notas: {line.notes}</p>}
                        </div>
                        {lineErrors.map((message) => (
                          <p
                            key={message}
                            className="flex items-start gap-1 text-xs text-destructive"
                          >
                            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            {message}
                          </p>
                        ))}
                        <div className="pt-1 flex flex-wrap items-center gap-2">
                          <Badge variant="secondary">
                            {formatCurrency(line.cost)}
                          </Badge>
                          {showInvoiceCost(line) && (
                            <span
                              className="text-xs text-amber-700"
                              title="Costo según la factura (Bs ÷ tasa BCV). Solo informativo."
                            >
                              costo factura{' '}
                              {formatCurrency(line.invoiceCost as number)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">
                    {formatCurrency(total)}
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="orderNotes">Observación de la preorden</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    placeholder="Opcional"
                    rows={2}
                  />
                </div>

                {saveErrors && (
                  <p className="text-sm text-destructive">
                    {saveErrors.message}
                  </p>
                )}
                {!bikeLines.every((line) => !!line.approvalNumber) && (
                  <p className="text-sm text-destructive">
                    Hay motos sin número de aprobación: edítelas para agregarlo.
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={!canConfirm || saveMutation.isLoading}
                  onClick={() => setIsReviewOpen(true)}
                >
                  {isEditing ? 'Revisar y guardar' : 'Revisar y confirmar'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de identidad de la unidad -- se reusa tanto para agregar una
          unidad nueva desde el catálogo como para editar una ya cargada. */}
      <Dialog
        open={isIdentityModalOpen}
        onOpenChange={(open) => !open && closeModal()}
      >
        <DialogContent width="min(520px, 95vw)" maxHeight="90vh">
          <DialogHeader>
            <DialogTitle>
              {isEditingLine ? 'Editar unidad' : 'Identidad de la unidad'}
            </DialogTitle>
            <DialogDescription>
              {modalProductName} -- copie los datos de la moto física o de su
              factura.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="approvalNumber">
                Número de aprobación Empire
              </Label>
              <ApprovalNumberInput
                id="approvalNumber"
                value={form.approvalNumber}
                onChange={(approvalNumber) =>
                  setForm({ ...form, approvalNumber })
                }
                branchId={targetBranchId}
              />
              {approvalProblem && approvalProblem !== 'pending' ? (
                <div className="space-y-1">
                  <p className="text-xs text-destructive">{approvalProblem}</p>
                  {movableFrom.length > 0 &&
                    (canMoveApprovalBikes ? (
                      <div className="flex flex-wrap gap-1.5">
                        {movableFrom.map((line) => (
                          <Button
                            key={line.branch.id}
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isMovingApprovalBikes}
                            onClick={() => moveOneHere(line.branch.id)}
                          >
                            Pasar 1 desde {line.branch.name} (
                            {line.availableQuantity})
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-600">
                        Hay cupo en{' '}
                        {movableFrom
                          .map(
                            (line) =>
                              `${line.branch.name} (${line.availableQuantity})`
                          )
                          .join(', ')}
                        . Pida a un gerente que pase una a esta sucursal.
                      </p>
                    ))}
                  {moveError && (
                    <p className="text-xs text-destructive">{moveError}</p>
                  )}
                </div>
              ) : approvalProblem === 'pending' ? (
                <p className="text-xs text-gray-500">Consultando...</p>
              ) : (
                modalRoom !== undefined && (
                  <p className="flex items-center gap-1 text-xs text-emerald-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Quedan {modalRoom} {modalProductName} en esta aprobación
                    (contando el carrito).
                  </p>
                )
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="plate">Placa</Label>
              <Input
                id="plate"
                value={form.plate}
                onChange={(e) =>
                  setForm({ ...form, plate: e.target.value.toUpperCase() })
                }
              />
              {touched && fieldErrors.plate && (
                <p className="text-xs text-destructive">{fieldErrors.plate}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="color">Color</Label>
              <select
                id="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="px-3 py-2 border rounded-md w-full"
              >
                <option value="" disabled>
                  Seleccione el color
                </option>
                {BIKES_COLORS.map((color) => (
                  <option key={color} value={color}>
                    {color}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="chassisSerial">Serial de chasis (VIN)</Label>
              <Input
                id="chassisSerial"
                value={form.chassisSerial}
                onChange={(e) =>
                  setForm({
                    ...form,
                    chassisSerial: e.target.value.toUpperCase(),
                  })
                }
                className="font-mono"
              />
              {touched && fieldErrors.chassisSerial && (
                <p className="text-xs text-destructive">
                  {fieldErrors.chassisSerial}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="motorSerial">Serial de motor</Label>
              <Input
                id="motorSerial"
                value={form.motorSerial}
                onChange={(e) =>
                  setForm({
                    ...form,
                    motorSerial: e.target.value.toUpperCase(),
                  })
                }
                className="font-mono"
              />
              {touched && fieldErrors.motorSerial && (
                <p className="text-xs text-destructive">
                  {fieldErrors.motorSerial}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="year">Año</Label>
              <Input
                id="year"
                inputMode="numeric"
                maxLength={4}
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
              />
              {touched && fieldErrors.year && (
                <p className="text-xs text-destructive">{fieldErrors.year}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="cost">Costo</Label>
              {/* A diferencia de Repuestos, el costo de una moto nunca se
               * edita acá -- siempre viene del catálogo de precios. */}
              <Input
                id="cost"
                type="number"
                value={form.cost}
                disabled
                className={NO_SPINNER_CLASSES}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowOptionalFields((prev) => !prev)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            {showOptionalFields ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
            Datos adicionales (opcional)
          </button>
          {showOptionalFields && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="invoiceNumber">Nº de factura</Label>
                <Input
                  id="invoiceNumber"
                  value={form.invoiceNumber}
                  onChange={(e) =>
                    setForm({ ...form, invoiceNumber: e.target.value })
                  }
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label htmlFor="unitNotes">Notas</Label>
                <Textarea
                  id="unitNotes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
          )}

          {(isDuplicatePlate || isDuplicateChassis || isDuplicateMotor) && (
            <p className="text-sm text-destructive">
              Ya hay una unidad con{' '}
              {[
                isDuplicatePlate && 'esa placa',
                isDuplicateChassis && 'ese chasis',
                isDuplicateMotor && 'ese motor',
              ]
                .filter(Boolean)
                .join(', ')}{' '}
              en esta preorden.
            </p>
          )}
          {identityConflicts.length > 0 && (
            <ul className="space-y-1 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
              {identityConflicts.map((conflict) => (
                <li
                  key={`${conflict.field}-${conflict.source}-${conflict.plate}`}
                >
                  {describeConflict(conflict)}
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              disabled={(touched && !canSaveIdentity) || isCheckingIdentity}
              onClick={handleSaveIdentity}
            >
              {isCheckingIdentity
                ? 'Verificando...'
                : isEditingLine
                  ? 'Guardar cambios'
                  : 'Agregar a la preorden'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PurchaseBikeReviewDialog
        open={isReviewOpen}
        onOpenChange={setIsReviewOpen}
        lines={bikeLines}
        targetBranchId={targetBranchId}
        targetBranchName={
          canPickAnyBranch ? targetBranchName : (lockedBranchName ?? '')
        }
        purchaseOrderId={editOrder?.id}
        isSaving={saveMutation.isLoading}
        onConfirm={handleSave}
        onEditLine={(index) => {
          setIsReviewOpen(false);
          openEditModal(index);
        }}
      />
    </section>
  );
}
