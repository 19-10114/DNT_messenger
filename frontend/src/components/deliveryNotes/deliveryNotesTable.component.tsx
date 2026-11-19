'use client';
import React, {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { formatDate, getParsedAmount, formatCurrency } from '@/lib/utils';
import { useDeliveryNotes } from '@/hooks/useOrders';
import { ConsolidadoModal } from './ConsolidadoModal.component';
import { useBranches, useCurrentBranchId } from '@/stores/branch/branch.store';
import { OrderData } from '@/services/orders/types/Order.type';
import { Button } from '@/components/ui/button.component';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select.component';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { ORDERS_PAYMENT, PRE_ORDERS_NEW } from '@/constants/routes';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';
import { useOrders } from '@/hooks/useOrders';
import { useToken, useUser } from '@/stores/auth/auth.store';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { cn } from '@/lib/utils';
import { FilterDate } from '@/components/ui/filterDate.component';
import { useAllBikes } from '@/hooks/products';
import { useSeller, useRoles } from '@/stores/auth/auth.store';
import { useSellers } from '@/hooks/useSeller';

export function DeliveryNotesTable() {
  const router = useRouter();
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const currentBranchId = useCurrentBranchId();
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<OrderData | null>(null);
  const token = useToken();
  const { toast } = useToast();
  const userIsSeller = useSeller();
  const currentUser = useUser();
  const roles = useRoles();
  const userIsCashier = roles.includes('cashier') && !roles.includes('admin');
  const userIsPartsAdmin = roles.includes('parts_admin');
  const [activeStatus, setActiveStatus] = useState<string>('incomplete');
  const [productType, setProductType] = useState<'bikes' | 'parts' | 'others'>(
    userIsPartsAdmin ? 'parts' : 'bikes'
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [dateFilterKey, setDateFilterKey] = useState<number>(0);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');
  const [preorderNumber, setPreorderNumber] = useState<string>('');
  const [debouncedPreorder, setDebouncedPreorder] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<number | undefined>(
    undefined
  );
  const branches = useBranches();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [allBikesList, setAllBikesList] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [showConsolidadoModal, setShowConsolidadoModal] = useState(false);
  const [selectedSellerId, setSelectedSellerId] = useState<string>('');

  const { sellers } = useSellers();
  const inventoryCategoryId = productType === 'bikes' ? 1 : 2;

  // Ref para saber si es la primera carga
  const isFirstLoad = useRef(true);

  const statusOptions = [
    { value: 'incomplete', label: 'Activas' },
    { value: 'canceled', label: 'Canceladas' },
    { value: 'completed', label: 'Facturadas' },
  ];

  const getStatusText = (status: string) => {
    switch (status) {
      case 'incomplete':
        return 'Activas';
      case 'canceled':
        return 'Canceladas';
      case 'completed':
        return 'Facturadas';
      default:
        return status;
    }
  };

  // Debounces
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearchTerm(searchTerm), 1000);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedPreorder(preorderNumber), 500);
    return () => clearTimeout(timer);
  }, [preorderNumber]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setPage(1);
  }, [
    productType,
    activeStatus,
    debouncedSearchTerm,
    startDate,
    endDate,
    debouncedPreorder,
    selectedModelId,
  ]);

  const { data, isLoading, isError, isFetching } = useDeliveryNotes(
    currentBranchId === 0 && selectedBranchId
      ? String(selectedBranchId)
      : undefined,
    {
      page: String(page),
      pageSize: String(pageSize),
      // 'others' = abonos y servicios sin motos ni repuestos
      category: productType,
      status: activeStatus,
      search: debouncedSearchTerm,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      preorder: debouncedPreorder,
      seller:
        selectedSellerId && selectedSellerId !== 'all'
          ? selectedSellerId
          : undefined,
      model: selectedModelId,
    }
  );

  const allBikes = useAllBikes({ page: '1', pageSize: '1000' });

  useEffect(() => {
    if (allBikes.data?.results) {
      setAllBikesList(
        allBikes.data.results.map((bike: any) => ({
          id: bike.id,
          name: bike.name,
        }))
      );
    }
  }, [allBikes.data]);

  const { deleteOrderById, isDeletingOrderById } = useOrders(token);
  const orders = useMemo(() => data?.results ?? [], [data]);
  const totalPages = data?.totalPages ?? 1;
  const currentPage = data?.currentPage ?? page;
  const totalElements = data?.totalElements ?? 0;

  const columns: GenericTableColumn<OrderData>[] = [
    {
      key: 'deliveryNoteNumber',
      header: 'ID',
      align: 'center',
      // Al hacer click en el número se abren los detalles de la pre orden
      onCellClick: (order) => handleOrderClick(order),
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (order) => (order.createdAt ? formatDate(order.createdAt) : '-'),
    },
    {
      key: 'originBranch',
      header: 'Sucursal de origen',
      align: 'center',
      hidden: currentBranchId !== 0,
      render: (order) =>
        typeof order.originBranch === 'object'
          ? order.originBranch?.name || '-'
          : '-',
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (order) =>
        `${order.client?.firstName} ${order.client?.lastName} - ${order.client?.countryId}`,
    },
    {
      key: 'lineSummary',
      header: 'Concepto',
      // Solo en Otros: ahí conviven abonos y servicios
      hidden: productType !== 'others',
      render: (order) => order.lineSummary || '-',
    },
    {
      key: 'total',
      header: 'Total',
      render: (order) => formatCurrency(getParsedAmount(order.totalInvoiceBs)),
    },
  ];

  const handleFacturar = (order: OrderData) =>
    router.push(
      `${ORDERS_PAYMENT}?orderId=${order.id}&isPartsOrder=${productType !== 'bikes'}`
    );
  const handleOrderClick = (order: OrderData) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };
  const handleCreatePreOrder = () => router.push(PRE_ORDERS_NEW);

  const handleDeleteConfirm = () => {
    if (!orderToDelete) return;
    deleteOrderById(orderToDelete.id.toString(), {
      onSuccess: () => {
        toast({
          title: 'Éxito',
          description: `Pre Orden #${orderToDelete.id} cancelada correctamente`,
        });
        setOrderToDelete(null);
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description:
            error?.response?.data?.message || 'Error al cancelar la pre orden',
          variant: 'destructive',
        });
        setOrderToDelete(null);
      },
    });
  };

  // Handlers memorizados
  const handlePageChange = useCallback(
    (newPage: number) => setPage(newPage),
    []
  );
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  // Determinar si mostrar el loading inicial
  const showInitialLoading = isLoading && isFirstLoad.current;

  // Actualizar el ref después de la primera carga
  useEffect(() => {
    if (!isLoading && isFirstLoad.current) {
      isFirstLoad.current = false;
    }
  }, [isLoading]);

  // Mostrar loading solo en la primera carga
  if (showInitialLoading) {
    return <div className="py-4">Cargando pre órdenes...</div>;
  }

  return (
    <>
      <div>
        {/* Selector de tipo de producto */}
        <div className="mb-4 border-b border-gray-200">
          <div
            className={cn(
              'grid',
              userIsPartsAdmin ? 'grid-cols-2' : 'grid-cols-3'
            )}
          >
            {!userIsPartsAdmin && (
              <button
                onClick={() => setProductType('bikes')}
                className={cn(
                  'py-3 px-1 font-bold transition-colors text-center',
                  productType === 'bikes'
                    ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                    : 'text-gray-700 hover:text-gray-900'
                )}
              >
                Motos
              </button>
            )}
            <button
              onClick={() => setProductType('parts')}
              className={cn(
                'py-3 px-1 font-bold transition-colors text-center',
                productType === 'parts'
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              Repuestos
            </button>
            <button
              onClick={() => setProductType('others')}
              className={cn(
                'py-3 px-1 font-bold transition-colors text-center',
                productType === 'others'
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              Otros
            </button>
          </div>
        </div>

        {!roles.includes('cashier') && (
          <div className="flex justify-end mb-2">
            <Button onClick={handleCreatePreOrder} size="sm" className="gap-2">
              Crear Pre Orden
            </Button>
          </div>
        )}

        {/* Tabs de estado */}
        <Tabs
          value={activeStatus}
          onValueChange={setActiveStatus}
          className="w-full mb-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            {statusOptions.map((option) => (
              <TabsTrigger key={option.value} value={option.value}>
                {option.label}
                {activeStatus === option.value &&
                  data &&
                  ` (${data.totalElements || 0})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Filtros */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">
                Buscar cliente
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar cliente..."
                className="px-3 py-2 border rounded-md w-full"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-1 block">
                Pre Orden
              </label>
              <input
                type="text"
                value={preorderNumber}
                onChange={(e) => setPreorderNumber(e.target.value)}
                placeholder="Buscar por nro de pre orden..."
                className="px-3 py-2 border rounded-md w-full"
              />
            </div>

            {productType === 'bikes' && (
              <div className="min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">Modelo</label>
                <Select
                  value={selectedModelId}
                  onValueChange={setSelectedModelId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Todos los modelos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los modelos</SelectItem>
                    {allBikesList.map((bike) => (
                      <SelectItem key={bike.id} value={bike.id.toString()}>
                        {bike.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {currentBranchId === 0 && (
              <div className="min-w-[200px]">
                <label className="text-sm font-medium mb-1 block">
                  Sucursal
                </label>
                <Select
                  value={selectedBranchId?.toString() || ''}
                  onValueChange={(value) => {
                    setSelectedBranchId(Number(value));
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Seleccionar sucursal" />
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
            )}

            <div className="min-w-[180px]">
              <label className="text-sm font-medium mb-1 block">Vendedor</label>
              <Select
                value={selectedSellerId}
                onValueChange={setSelectedSellerId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los vendedores" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los vendedores</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(searchTerm ||
              preorderNumber ||
              startDate ||
              endDate ||
              selectedModelId !== 'all' ||
              selectedSellerId) && (
              <Button
                variant="ghost"
                onClick={() => {
                  setSearchTerm('');
                  setPreorderNumber('');
                  setStartDate(undefined);
                  setEndDate(undefined);
                  setDateFilterKey((k) => k + 1);
                  setSelectedModelId('all');
                  setSelectedSellerId('');
                }}
                className="h-10"
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        </div>

        {/* Filtro de fechas (izquierda) + Consolidado (derecha) */}
        <div className="flex justify-between items-center gap-4 mb-2">
          <FilterDate
            key={dateFilterKey}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />

          {activeStatus === 'incomplete' &&
            !preorderNumber &&
            productType !== 'others' && (
              <Button
                onClick={() => setShowConsolidadoModal(true)}
                size="sm"
                variant="outline"
              >
                Consolidado
              </Button>
            )}
        </div>

        {/* Tabla */}
        {isError ? (
          <div className="py-4 text-destructive">
            Error cargando pre órdenes.
          </div>
        ) : (
          <div className="relative">
            {isFetching && (
              // z por debajo del `z-10` del menú lateral, como la tabla
              <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-[5] rounded-md">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            <GenericTable<OrderData>
              columns={columns}
              data={orders}
              isLoading={isLoading}
              emptyMessage={`No hay pre órdenes ${getStatusText(activeStatus).toLowerCase()}.`}
              actions={[
                {
                  label: 'FACTURAR',
                  variant: 'ghost',
                  className:
                    'text-secondary border border-secondary hover:bg-secondary hover:text-white',
                  onClick: handleFacturar,
                  hidden: () => activeStatus !== 'incomplete' || userIsSeller,
                },
                {
                  label: 'Cancelar Pre Orden',
                  icon: 'close',
                  variant: 'ghost',
                  className:
                    'border border-red-500 text-red-600 hover:bg-red-600 hover:text-white',
                  onClick: (order) => setOrderToDelete(order),
                  disabled: () => isDeletingOrderById,
                  hidden: (order) =>
                    activeStatus === 'canceled' ||
                    userIsCashier ||
                    (userIsSeller && currentUser?.id !== order.seller),
                },
              ]}
              pagination={{
                currentPage,
                totalPages,
                totalElements,
                pageSize,
                onPageChange: handlePageChange,
                onPageSizeChange: handlePageSizeChange,
              }}
            />
          </div>
        )}
      </div>

      <OrderDetailsModal
        order={selectedOrder}
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
      />

      <ConsolidadoModal
        open={showConsolidadoModal}
        onClose={() => setShowConsolidadoModal(false)}
        categoryId={inventoryCategoryId}
        filters={{
          search: debouncedSearchTerm || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          model: selectedModelId || undefined,
          branch:
            currentBranchId === 0 && selectedBranchId
              ? String(selectedBranchId)
              : undefined,
          seller:
            selectedSellerId && selectedSellerId !== 'all'
              ? selectedSellerId
              : undefined,
        }}
      />

      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => {
          if (!open) setOrderToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar Pre Orden?</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de cancelar la Pre Orden{' '}
              <strong>#{orderToDelete?.id}</strong>. Al cancelar esta pre orden,
              podrás encontrarla en el apartado de pre ordenes canceladas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cerrar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletingOrderById ? 'Cancelando...' : 'Cancelar Pre Orden'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
