'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentBranchId, useBranches } from '@/stores/branch/branch.store';
import { useRoles } from '@/stores/auth/auth.store';
import {
  useAllPurchaseOrders,
  useApprovePurchaseOrder,
  useRejectPurchaseOrder,
} from '@/hooks/purchases/usePurchaseOrders';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { PURCHASES_NEW, PURCHASES_EDIT } from '@/constants/routes';
import {
  STATUS_LABELS,
  purchaseOrderGrandTotal,
  PurchaseOrderDetailModal,
} from './purchaseOrderDetailModal.component';
import {
  PurchaseOrder,
  PurchaseOrderCategory,
  PurchaseOrderStatus,
} from '@/services/purchases/types/PurchaseOrder.type';

// Mismo criterio que el backend (purchases/views.py, PURCHASE_ORDER_CREATE_ROLES
// / PURCHASE_ORDER_APPROVE_ROLES): quién puede editar una preorden (mientras
// no esté aprobada) y quién puede aprobarla/rechazarla.
const EDIT_ROLES = ['seller', 'manager', 'administrator', 'admin'];
// El gerente arma el carrito pero ya no lo aprueba.
const APPROVE_ROLES = ['admin', 'administrator'];

// 'draft' no aparece acá a propósito: nada en la app lo produce hoy (crear
// una preorden siempre manda directo a 'pending_approval', ver
// purchasePartsCart/purchaseBikeCart) -- es un estado del modelo alcanzable
// solo llamando a la API directo. Un tab que siempre muestra (0) es más
// confuso que útil.
const STATUS_TABS: PurchaseOrderStatus[] = [
  'pending_approval',
  'approved',
  'rejected',
];

interface PurchaseOrdersTableProps {
  /**
   * Cuando viene seteado, la tabla queda fija en ese estado: sin tabs de
   * estado y sin botón de crear. Es lo que separa "Preórdenes de Compra"
   * (`/dashboard/purchases`, sin lockedStatus) de "Órdenes de Compra"
   * (`/dashboard/purchases/orders`, `lockedStatus="approved"`) -- mismo
   * componente y misma tabla que ya vale (líneas, impuestos, quién aprobó),
   * igual que Ventas separa Pre Ordenes de Órdenes con el mismo `Order` pero
   * `billed` distinto.
   */
  lockedStatus?: PurchaseOrderStatus;
}

/**
 * Listado de preórdenes de compra -- calcado a propósito de
 * `deliveryNotesTable.component.tsx` (la "Pre Orden" de Ventas): tabs de
 * categoría arriba, botón de crear, tabs de estado con conteo, columna de
 * sucursal solo cuando se está viendo "todas las sucursales" (branch 0), y
 * clic en el ID abre el detalle en vez de un botón de fila aparte.
 * Editar/Aprobar/Rechazar viven dentro de ese modal, no como acciones de
 * fila (a diferencia de Ventas, que sí las deja en la fila -- acá se decidió
 * distinto porque Aprobar/Rechazar necesitan mostrar el desglose completo
 * antes de decidir).
 */
export function PurchaseOrdersTable({
  lockedStatus,
}: PurchaseOrdersTableProps = {}) {
  const router = useRouter();
  const currentBranchId = useCurrentBranchId();
  const branches = useBranches();
  const roles = useRoles();
  const canEdit = roles.some((role) => EDIT_ROLES.includes(role));
  const canApprove = roles.some((role) => APPROVE_ROLES.includes(role));

  const [page, setPage] = useState(1);
  const [category, setCategory] = useState<PurchaseOrderCategory>('parts');
  const [status, setStatus] = useState<PurchaseOrderStatus>(
    lockedStatus ?? 'pending_approval'
  );
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined
  );
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [rejectingOrder, setRejectingOrder] = useState<PurchaseOrder | null>(
    null
  );
  const [rejectReason, setRejectReason] = useState('');

  // Al cambiar de categoría o estado, volver a la primera página -- mismo
  // criterio que Ventas.
  useEffect(() => {
    setPage(1);
  }, [category, status]);

  const branchId =
    currentBranchId === 0 && selectedBranchId
      ? selectedBranchId.toString()
      : currentBranchId !== undefined
        ? currentBranchId.toString()
        : undefined;

  const effectiveStatus = lockedStatus ?? status;

  const { data, isLoading, isError } = useAllPurchaseOrders(branchId, {
    page: page.toString(),
    pageSize: '10',
    category,
    status: effectiveStatus,
  });

  const { toast } = useToast();
  const approvePurchaseOrder = useApprovePurchaseOrder();
  const rejectPurchaseOrder = useRejectPurchaseOrder();

  const closeRejectDialog = () => {
    setRejectingOrder(null);
    setRejectReason('');
  };

  const confirmReject = () => {
    if (!rejectingOrder || !rejectReason.trim()) return;
    rejectPurchaseOrder.mutate(
      { id: rejectingOrder.id, reason: rejectReason.trim() },
      { onSuccess: closeRejectDialog }
    );
  };

  const columns: GenericTableColumn<PurchaseOrder>[] = [
    {
      key: 'id',
      header: 'ID',
      align: 'center',
      // Al hacer click en el ID se abre el detalle, igual que en la Pre
      // Orden de Ventas -- no hay un botón de acción aparte para esto.
      onCellClick: (order) => setSelectedOrder(order),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (order) => formatDate(order.createdAt),
    },
    {
      key: 'targetBranch',
      header: 'Sucursal receptora',
      align: 'center',
      hidden: currentBranchId !== 0,
      render: (order) => order.targetBranch?.name,
    },
    {
      key: 'createdBy',
      header: 'Creado por',
      render: (order) => order.createdBy?.username,
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => formatCurrency(purchaseOrderGrandTotal(order)),
    },
  ];

  if (currentBranchId === undefined) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        Seleccioná una sucursal para ver las preórdenes de compra.
      </div>
    );
  }

  return (
    <>
      <div>
        {/* Selector de categoría */}
        <div className="mb-4 border-b border-gray-200">
          <div className="grid grid-cols-2">
            <button
              onClick={() => setCategory('parts')}
              className={cn(
                'py-3 px-1 font-bold transition-colors text-center',
                category === 'parts'
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              Repuestos
            </button>
            <button
              onClick={() => setCategory('bikes')}
              className={cn(
                'py-3 px-1 font-bold transition-colors text-center',
                category === 'bikes'
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              Motos
            </button>
          </div>
        </div>

        {canEdit && !lockedStatus && (
          <div className="flex justify-end mb-2">
            <Button
              onClick={() => router.push(PURCHASES_NEW)}
              size="sm"
              className="gap-2"
            >
              Crear preorden
            </Button>
          </div>
        )}

        {/* Tabs de estado -- no aplica en la vista de Órdenes, que ya está
         * fija en "Aprobada" (lockedStatus). */}
        {!lockedStatus && (
          <Tabs
            value={status}
            onValueChange={(value) => setStatus(value as PurchaseOrderStatus)}
            className="w-full mb-6"
          >
            <TabsList className="grid w-full grid-cols-3">
              {STATUS_TABS.map((option) => (
                <TabsTrigger key={option} value={option}>
                  {STATUS_LABELS[option]}
                  {status === option && data && ` (${data.totalElements || 0})`}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        )}

        {/* Filtro de sucursal -- solo tiene sentido viendo todas ("branch 0") */}
        {currentBranchId === 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">
                  Sucursal
                </label>
                <Select
                  value={selectedBranchId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedBranchId(value ? Number(value) : undefined);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todas las sucursales" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((branch) => (
                      <SelectItem key={branch.id} value={branch.id.toString()}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedBranchId && (
                <Button
                  variant="ghost"
                  onClick={() => setSelectedBranchId(undefined)}
                  className="h-10"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Tabla */}
        {isError ? (
          <p className="text-sm text-destructive">
            Error al cargar las preórdenes de compra.
          </p>
        ) : (
          <GenericTable<PurchaseOrder>
            columns={columns}
            data={data?.results || []}
            isLoading={isLoading}
            emptyMessage={`No hay preórdenes con estado "${STATUS_LABELS[effectiveStatus]}".`}
            pagination={
              data
                ? {
                    currentPage: data.currentPage,
                    totalPages: data.totalPages,
                    totalElements: data.totalElements,
                    pageSize: data.pageSize,
                    onPageChange: setPage,
                  }
                : undefined
            }
          />
        )}
      </div>

      <PurchaseOrderDetailModal
        purchaseOrder={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        onEdit={
          canEdit ? (order) => router.push(PURCHASES_EDIT(order.id)) : undefined
        }
        onApprove={
          canApprove
            ? (order) =>
                approvePurchaseOrder.mutate(order.id, {
                  onSuccess: () => setSelectedOrder(null),
                  onError: (error: any) => {
                    const errorMessage =
                      error?.response?.data?.message ||
                      error?.message ||
                      'Error desconocido al aprobar la preorden';
                    toast({
                      title: 'No se pudo aprobar la preorden',
                      description: errorMessage,
                      variant: 'destructive',
                    });
                  },
                })
            : undefined
        }
        onReject={
          canApprove
            ? (order) => {
                setSelectedOrder(null);
                setRejectingOrder(order);
              }
            : undefined
        }
        isApproving={approvePurchaseOrder.isLoading}
      />

      <Dialog
        open={!!rejectingOrder}
        onOpenChange={(open) => !open && closeRejectDialog()}
      >
        <DialogContent width="440px">
          <DialogHeader>
            <DialogTitle>Rechazar preorden #{rejectingOrder?.id}</DialogTitle>
            <DialogDescription>
              Explicá el motivo -- queda visible para quien la creó y puede
              editarla y reenviarla.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Motivo del rechazo..."
          />
          {rejectPurchaseOrder.isError && (
            <p className="text-sm text-destructive">
              No se pudo rechazar la preorden.
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeRejectDialog}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || rejectPurchaseOrder.isLoading}
              onClick={confirmReject}
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
