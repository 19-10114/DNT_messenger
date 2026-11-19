'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useAllBranches } from '@/hooks/useAllBranches';
import {
  useCreatePurchaseOrder,
  useUpdatePurchaseOrder,
} from '@/hooks/purchases/usePurchaseOrders';
import { PurchaseOrder } from '@/services/purchases/types/PurchaseOrder.type';
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
import { Textarea } from '@/components/ui/textarea.component';
import { Badge } from '@/components/ui/badge.component';
import { Separator } from '@/components/ui/separator.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { useToast } from '@/components/ui/use-toast';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import {
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Plus,
  Minus,
  ShoppingCart,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  PurchasePartsCartLine,
  RejectedCartRow,
} from '@/models/purchasePartsCart.model';
import {
  cartLineToPayload,
  invoiceFieldsFromSavedLine,
  mergeCartLines,
} from '@/utils/purchaseCart.utils';
import { useInvoiceReaderStatus } from '@/hooks/purchases/useReadInvoice';
import { LoadPartsToCartModal } from './loadPartsToCartModal.component';
import { RejectedRowsTable } from './rejectedRowsTable.component';
import { UploadInvoiceModal } from './uploadInvoiceModal.component';

const productsService = new ProductsService();

// "El Panita" (aliado) es la única sucursal que compra "para cualquiera" --
// toda otra sucursal solo puede recibir su propia preorden. Super admin
// (branchId 0) tampoco está parado en ninguna sucursal real, así que se
// comporta igual: elección libre.
const EL_PANITA_BRANCH_ID = 32;

// Los inputs numéricos nativos traen flechas de subir/bajar que no combinan
// con el resto del diseño -- se ocultan acá una vez para toda la pantalla.
const NO_SPINNER_CLASSES =
  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

interface CatalogPart {
  id: number;
  sku: string;
  name: string;
  model: string;
  brand: string;
  cost: number | null;
  /** Los precios de catálogo no incluyen impuestos -- se calculan aparte,
   * por línea, con la tasa propia de cada producto. */
  tax: { iva: number; igtf: number } | null;
}

type CartLine = PurchasePartsCartLine;

// Diferencia a partir de la cual se muestra el costo de factura junto al de
// catálogo (solo informativo: el costo de la línea sigue siendo el de catálogo).
const INVOICE_COST_HINT_RATIO = 0.05;

function showInvoiceCost(line: CartLine) {
  if (line.invoiceCost === null || line.invoiceCost === undefined) return false;
  if (!line.cost) return true;
  return (
    Math.abs(line.invoiceCost - line.cost) / line.cost > INVOICE_COST_HINT_RATIO
  );
}

interface PurchasePartsCartProps {
  /** Presente = editando una preorden existente en vez de creando una nueva
   * (PATCH en vez de POST, precargada con sus líneas actuales). */
  editOrder?: PurchaseOrder;
}

/**
 * Carrito de preorden de compra de repuestos: multi-línea, sin depender del
 * stock de ninguna sucursal (a diferencia del carrito de Ventas, acá estamos
 * comprando más, no vendiendo lo que ya hay). El buscador pega al catálogo
 * general (`/products/part/all`), no a inventario.
 */
export function PurchasePartsCart({ editOrder }: PurchasePartsCartProps) {
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
  // currentBranchId puede cambiar después del montaje inicial (el usuario
  // cambia de sucursal en el selector del sidebar sin salir de esta
  // pantalla) -- cuando la sucursal está bloqueada, targetBranch tiene que
  // seguirlo, no solo el texto mostrado.
  useEffect(() => {
    if (!canPickAnyBranch && currentBranchId !== undefined) {
      setTargetBranch(String(currentBranchId));
    }
  }, [canPickAnyBranch, currentBranchId]);
  const lockedBranchName = (branches || []).find(
    (branch) => branch.id === currentBranchId
  )?.name;

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch] = useDebounce(searchTerm, 400);
  const [page, setPage] = useState(1);
  const [cart, setCart] = useState<CartLine[]>(() =>
    editOrder
      ? editOrder.lines.map((line) => ({
          productId: line.product.id,
          sku: line.product.sku,
          name: line.product.name,
          model: line.product.model,
          brand: line.product.brand,
          quantity: line.quantity,
          cost: line.cost,
          // Misma regla que al agregar una línea nueva desde la búsqueda: si
          // el catálogo tiene un costo real, la línea queda bloqueada en ese
          // valor -- también al editar, no solo al crear. `product.cost`
          // viene anidado en la línea (costo de catálogo *actual*, no
          // confundir con `line.cost`, el costo con el que se guardó).
          costEditable: !line.product.cost,
          tax: line.product.tax,
          // Sin esto, guardar la edición borraría el nº de factura de cada
          // línea: el backend reemplaza todas las líneas.
          ...invoiceFieldsFromSavedLine(line),
        }))
      : []
  );
  const [orderNotes, setOrderNotes] = useState(editOrder?.notes ?? '');
  const [successId, setSuccessId] = useState<number | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  // Líneas a vaciar, fijadas al abrir la confirmación y no tocadas al cerrar:
  // si se leyera `cart`, el diálogo diría "0 líneas" mientras se desvanece.
  const [linesToClear, setLinesToClear] = useState(0);
  const { isInvoiceReaderEnabled } = useInvoiceReaderStatus();
  // Filas del último Excel o factura que no entraron; se limpia al guardar o
  // al cerrar el aviso
  const [rejectedRows, setRejectedRows] = useState<RejectedCartRow[]>([]);
  const { toast } = useToast();

  const createPurchaseOrder = useCreatePurchaseOrder();
  const updatePurchaseOrder = useUpdatePurchaseOrder(editOrder?.id ?? 0);
  const saveMutation = isEditing ? updatePurchaseOrder : createPurchaseOrder;

  const catalogQuery = useQuery({
    queryKey: ['purchasePartsCatalog', token, page, debouncedSearch],
    queryFn: () =>
      productsService.getAllParts(token as string, {
        page: page.toString(),
        pageSize: '10',
        search: debouncedSearch,
      }),
    enabled: !!token,
  });

  const catalogData = catalogQuery.data?.data;
  // BikeProduct (reused here despite the name -- /products/part/all uses the
  // same response shape) is missing `cost` in its type even though the API
  // includes it; same kind of mismatch already worked around with `as any`
  // elsewhere (transactionsTable.component.tsx).
  const parts: CatalogPart[] =
    (catalogData?.results as unknown as CatalogPart[]) || [];
  const totalPages = catalogData?.totalPages || 1;

  const addToCart = (part: CatalogPart) => {
    setCart((prev) =>
      mergeCartLines(prev, [
        {
          productId: part.id,
          sku: part.sku,
          name: part.name,
          model: part.model,
          brand: part.brand,
          quantity: 1,
          cost: part.cost ?? 0,
          costEditable: !part.cost,
          tax: part.tax,
        },
      ])
    );
  };

  // Excel ("Cargar Productos") y factura ("Subir Factura") terminan igual:
  // líneas al carrito y lo que no entró, al aviso.
  const handleLoadLines = (lines: CartLine[], rejected: RejectedCartRow[]) => {
    setCart((prev) => mergeCartLines(prev, lines));
    // Varias facturas seguidas: el aviso junta lo que no entró de todas.
    setRejectedRows((prev) => [...prev, ...rejected]);
    toast({
      title: 'Productos cargados',
      description:
        `Se agregaron ${lines.length} producto${lines.length === 1 ? '' : 's'} al carrito.` +
        (rejected.length > 0
          ? ` ${rejected.length} fila${rejected.length === 1 ? '' : 's'} no entr${rejected.length === 1 ? 'ó' : 'aron'}.`
          : ''),
    });
  };

  const updateLine = (
    productId: number,
    field: 'quantity' | 'cost',
    value: number
  ) => {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId ? { ...line, [field]: value } : line
      )
    );
  };

  const removeLine = (productId: number) => {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  };

  // Vacía las líneas y el aviso de filas que no entraron; sucursal y
  // observación se conservan. Al editar, la preorden guardada no cambia hasta
  // "Guardar cambios" (que pide al menos una línea).
  const clearCart = () => {
    setCart([]);
    setRejectedRows([]);
    setIsClearConfirmOpen(false);
    toast({ description: 'Carrito vaciado.' });
  };

  // Los precios de catálogo son sin impuesto -- IVA e IGTF se calculan aparte
  // con la tasa propia de cada línea (viene del producto, no es un número
  // fijo para todo el carrito, aunque hoy todo el catálogo use 16%/3%).
  const totals = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, line) => sum + line.quantity * line.cost,
      0
    );
    const iva = cart.reduce(
      (sum, line) =>
        sum + line.quantity * line.cost * ((line.tax?.iva ?? 0) / 100),
      0
    );
    const igtf = cart.reduce(
      (sum, line) =>
        sum + line.quantity * line.cost * ((line.tax?.igtf ?? 0) / 100),
      0
    );
    return { subtotal, iva, igtf, total: subtotal + iva + igtf };
  }, [cart]);

  const canConfirm =
    !!targetBranch && cart.length > 0 && cart.every((l) => l.quantity > 0);

  const handleConfirm = () => {
    if (!canConfirm) return;
    const payload = {
      target_branch: Number(targetBranch),
      category: 'parts' as const,
      notes: orderNotes,
      lines: cart.map(cartLineToPayload),
    };
    const onSuccess = (order: { id: number }) => {
      setSuccessId(order.id);
      setRejectedRows([]);
      if (!isEditing) setCart([]);
    };
    if (isEditing) {
      updatePurchaseOrder.mutate(payload, { onSuccess });
    } else {
      createPurchaseOrder.mutate(payload, { onSuccess });
    }
  };

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

  return (
    <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {rejectedRows.length > 0 && (
        <div className="lg:col-span-3 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p className="text-sm font-medium">
                {rejectedRows.length === 1
                  ? '1 fila no entró al carrito'
                  : `${rejectedRows.length} filas no entraron al carrito`}
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

      <LoadPartsToCartModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onConfirm={handleLoadLines}
      />
      <ConfirmDialog
        open={isClearConfirmOpen}
        onOpenChange={setIsClearConfirmOpen}
        title="¿Vaciar el carrito?"
        description={
          linesToClear === 1
            ? 'Se quita la línea del carrito.'
            : `Se quitan las ${linesToClear} líneas del carrito.`
        }
        confirmLabel="Vaciar carrito"
        destructive
        onConfirm={clearCart}
      />
      <UploadInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onConfirm={handleLoadLines}
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
          <Button
            variant="outline"
            className="shrink-0"
            onClick={() => setIsExcelModalOpen(true)}
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Cargar Productos
          </Button>
          {/* Un span alrededor: un botón deshabilitado no dispara el title */}
          <span
            className="shrink-0"
            title={
              isInvoiceReaderEnabled
                ? undefined
                : 'Lectura de facturas no configurada todavía'
            }
          >
            <Button
              variant="outline"
              className="w-full"
              disabled={!isInvoiceReaderEnabled}
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              Subir Factura
            </Button>
          </span>
        </div>

        {catalogQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Cargando repuestos...</p>
        ) : parts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No se encontraron repuestos
          </p>
        ) : (
          <>
            {parts.map((part) => (
              <Card
                key={part.id}
                className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div>
                  <p className="font-medium">{part.name}</p>
                  <p className="text-sm text-gray-600">SKU: {part.sku}</p>
                  <p className="text-sm text-gray-600">Modelo: {part.model}</p>
                  <p className="text-sm text-gray-600">Marca: {part.brand}</p>
                  <p className="text-sm font-medium">
                    Costo catálogo: {formatCurrency(part.cost ?? 0)}
                  </p>
                </div>
                <Button size="sm" onClick={() => addToCart(part)}>
                  <Plus className="h-4 w-4 mr-1" /> Agregar
                </Button>
              </Card>
            ))}
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

      {/* Carrito -- mismo lenguaje visual que OrderSummary (Ventas) */}
      <div>
        <Card className="sticky top-4">
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrito de Compra
              </CardTitle>
              {cart.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinesToClear(cart.length);
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
              Repuestos seleccionados para esta preorden
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay repuestos seleccionados</p>
                <p className="text-sm">
                  Agregalos desde el catálogo, con un Excel o subiendo la
                  factura
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {cart.map((line) => (
                    <div
                      key={line.productId}
                      className="flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{line.name}</p>
                        <p className="text-sm text-gray-600">
                          SKU: {line.sku} · {line.brand}
                        </p>
                        {(line.invoiceNumbers?.length ?? 0) > 0 && (
                          <p className="text-xs text-gray-500">
                            Factura{line.invoiceNumbers!.length > 1 ? 's' : ''}{' '}
                            {line.invoiceNumbers!.join(', ')}
                            {showInvoiceCost(line) && (
                              <>
                                {' · '}
                                <span
                                  className="text-amber-700"
                                  title="Costo unitario según la factura (Bs ÷ tasa BCV). Solo informativo."
                                >
                                  costo factura{' '}
                                  {formatCurrency(line.invoiceCost as number)}
                                </span>
                              </>
                            )}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                          {/* Stepper de cantidad, sin flechas nativas */}
                          <div className="flex items-center border rounded-md bg-white">
                            <button
                              type="button"
                              disabled={line.quantity <= 1}
                              onClick={() =>
                                updateLine(
                                  line.productId,
                                  'quantity',
                                  Math.max(1, line.quantity - 1)
                                )
                              }
                              className="px-2 py-1 text-gray-600 disabled:opacity-30"
                              aria-label="Restar"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center text-sm">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateLine(
                                  line.productId,
                                  'quantity',
                                  line.quantity + 1
                                )
                              }
                              className="px-2 py-1 text-gray-600"
                              aria-label="Sumar"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-gray-500">$</span>
                            <Input
                              type="number"
                              min={0}
                              step={0.01}
                              value={line.cost}
                              disabled={!line.costEditable}
                              // Sin esto, hacer click en el campo no
                              // selecciona el "0" que ya tiene -- cada
                              // dígito que se tipea se inserta DESPUÉS de
                              // ese "0" en vez de reemplazarlo, así que
                              // querer poner "5" termina en "05", "12" en
                              // "012", etc. (reportado por el usuario:
                              // terminó tipeando un costo real y le quedó
                              // "043532"). Seleccionar todo al enfocar hace
                              // que tipear reemplace el valor entero.
                              onFocus={(e) => e.target.select()}
                              onChange={(e) =>
                                updateLine(
                                  line.productId,
                                  'cost',
                                  Number(e.target.value)
                                )
                              }
                              className={`w-20 h-8 ${NO_SPINNER_CLASSES}`}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="secondary">
                          {formatCurrency(line.quantity * line.cost)}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(line.productId)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator />

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal (sin impuestos):</span>
                    <span className="font-medium">
                      {formatCurrency(totals.subtotal)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IVA:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.iva)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>IGTF:</span>
                    <span className="font-medium">
                      {formatCurrency(totals.igtf)}
                    </span>
                  </div>

                  <Separator />

                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="text-green-600">
                      {formatCurrency(totals.total)}
                    </span>
                  </div>
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

                {saveMutation.isError && (
                  <p className="text-sm text-destructive">
                    {isEditing
                      ? 'No se pudo actualizar la preorden.'
                      : 'No se pudo crear la preorden.'}
                  </p>
                )}
                <Button
                  className="w-full"
                  disabled={!canConfirm || saveMutation.isLoading}
                  onClick={handleConfirm}
                >
                  {isEditing ? 'Guardar cambios' : 'Confirmar preorden'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
