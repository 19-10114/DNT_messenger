'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { PaymentMethodsSection } from '@/components/tables/PaymentMethodsSection.component';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import {
  cn,
  formatDate,
  usdFormatCurrency,
  getParsedAmount,
} from '@/lib/utils';
import { TransactionService } from '@/services/transactions/transactions.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useBranchOrdersList } from '@/hooks/useOrders';
import { useOrderForBikeSale } from '@/hooks/useBikeService';
import {
  PartSaleDetailItem,
  PartsReportProduct,
  PartsSoldReportItem,
} from '@/services/transactions/types/PartsReport.type';
import { OrderData } from '@/services/orders/types/Order.type';
import OrderDetailsModal from '@/app/dashboard/orders/orderDetailsModal';

const transactionService = new TransactionService();

const SORT_STORAGE_KEY = 'lastPartsReportSort';

type SortColumn =
  | 'sku'
  | 'name'
  | 'quantitySold'
  | 'revenue'
  | 'cost'
  | 'utility'
  | 'margin';
type SortDirection = 'asc' | 'desc';
type SortState = { column: SortColumn; direction: SortDirection };

const marginOf = (item: PartsSoldReportItem) =>
  item.revenue > 0 ? (item.utility / item.revenue) * 100 : 0;

// >30% verde, 10-30% amarillo, <10% rojo
const marginColorClass = (margin: number) =>
  margin > 30
    ? 'text-green-600'
    : margin > 10
      ? 'text-yellow-600'
      : 'text-red-600';

const SORT_VALUE: Record<
  SortColumn,
  (item: PartsSoldReportItem) => string | number
> = {
  sku: (item) => item.product.sku,
  name: (item) => item.product.name,
  quantitySold: (item) => item.quantitySold,
  revenue: (item) => item.revenue,
  cost: (item) => item.cost,
  utility: (item) => item.utility,
  margin: (item) => marginOf(item),
};

function PartSaleRow({ sale }: { sale: PartSaleDetailItem }) {
  const [showOrderModal, setShowOrderModal] = useState(false);
  const { data: order, isLoading: isLoadingOrder } = useOrderForBikeSale(
    sale.orderNumber ?? null
  );

  return (
    <>
      <tr>
        <td className="px-4 py-2">{formatDate(sale.date)}</td>
        <td className="px-4 py-2">{sale.branchName}</td>
        <td className="px-4 py-2 text-right">{sale.quantity}</td>
        <td className="px-4 py-2 text-right">
          {usdFormatCurrency(sale.salePrice)}
        </td>
        <td className="px-4 py-2 text-right">{usdFormatCurrency(sale.cost)}</td>
        <td className="px-4 py-2 text-right">
          {usdFormatCurrency(sale.utility)}
        </td>
        <td className="px-4 py-2 text-center">
          {sale.orderNumber ? (
            <Button
              size="sm"
              variant="outline"
              disabled={isLoadingOrder}
              onClick={() => setShowOrderModal(true)}
            >
              #{sale.orderNumber}
            </Button>
          ) : (
            '-'
          )}
        </td>
      </tr>
      {order && (
        <OrderDetailsModal
          order={order}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}
    </>
  );
}

function PartSaleDetailModal({
  product,
  branchIdString,
  start,
  finish,
  onClose,
}: {
  product: PartsReportProduct;
  branchIdString: string;
  start: string;
  finish: string;
  onClose: () => void;
}) {
  const token = useToken();
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: [
      'partSaleDetail',
      product.id,
      branchIdString,
      start,
      finish,
      page,
    ],
    queryFn: () =>
      transactionService.getPartSaleDetail(token, branchIdString, product.id, {
        start,
        finish,
        page: String(page),
        pageSize: '10',
      }),
    enabled: !!token,
  });

  const results: PartSaleDetailItem[] = data?.data?.results ?? [];
  const totalPages = data?.data?.totalPages ?? 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 pt-5 pb-3 border-b border-gray-300 bg-gray-200">
          <h2 className="text-xl font-semibold font-serif text-gray-800">
            Ventas de {product.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1">SKU: {product.sku}</p>
        </div>
        <div className="px-6 py-5">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando ventas...</p>
          ) : isError ? (
            <p className="text-sm text-destructive">
              Error al cargar las ventas.
            </p>
          ) : results.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay ventas de esta pieza en el periodo seleccionado.
            </p>
          ) : (
            <div className="border rounded-lg overflow-hidden text-sm">
              <table className="min-w-full">
                <thead className="bg-gray-100 text-xs uppercase text-gray-600">
                  <tr>
                    <th className="px-4 py-2 text-left">Fecha</th>
                    <th className="px-4 py-2 text-left">Sucursal</th>
                    <th className="px-4 py-2 text-right">Cantidad</th>
                    <th className="px-4 py-2 text-right">Precio Venta</th>
                    <th className="px-4 py-2 text-right">Costo</th>
                    <th className="px-4 py-2 text-right">Utilidad</th>
                    <th className="px-4 py-2 text-center">Orden</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((sale) => (
                    <PartSaleRow key={sale.transactionId} sale={sale} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-sm">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          )}
        </div>
        <div className="px-6 pb-5 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}

function OrdersWithPartsList({
  branchIdString,
  start,
  finish,
}: {
  branchIdString: string;
  start: string;
  finish: string;
}) {
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderData | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const { data, isLoading, isError } = useBranchOrdersList(branchIdString, {
    category: 'parts',
    start,
    finish,
    page: String(page),
    pageSize: '10',
  });

  const results = data?.results ?? [];
  const totalPages = data?.totalPages ?? 1;

  const columns: GenericTableColumn<OrderData>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '6rem',
      render: (order) => `#${order.id}`,
    },
    {
      key: 'createdAt',
      header: 'Fecha',
      render: (order) => formatDate(order.createdAt),
    },
    {
      key: 'client',
      header: 'Cliente',
      render: (order) =>
        order.client
          ? `${order.client.firstName} ${order.client.lastName}`
          : 'N/A',
    },
    {
      key: 'totalUsd',
      header: 'Total USD',
      render: (order) => usdFormatCurrency(getParsedAmount(order.totalUsd)),
    },
    {
      key: 'totalBs',
      header: 'Total Bs',
      render: (order) => getParsedAmount(order.totalBs)?.toFixed(2) ?? '-',
    },
  ];

  if (isError) {
    return (
      <p className="text-sm text-destructive py-4">
        Error al cargar las órdenes.
      </p>
    );
  }

  return (
    <>
      <GenericTable<OrderData>
        columns={columns}
        data={results}
        isLoading={isLoading}
        emptyMessage="No hay órdenes con repuestos en el periodo seleccionado."
        onRowClick={(order) => {
          setSelectedOrder(order);
          setShowOrderModal(true);
        }}
        pagination={{
          currentPage: page,
          totalPages,
          onPageChange: setPage,
        }}
      />
      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          open={showOrderModal}
          onOpenChange={setShowOrderModal}
        />
      )}
    </>
  );
}

export function PartsReportTable() {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString = branchId != null ? branchId.toString() : '';

  const [activeTab, setActiveTab] = useState<'parts' | 'orders'>('parts');
  const [page, setPage] = useState(1);
  const [partInput, setPartInput] = useState('');

  const [appliedPart, setAppliedPart] = useState('');
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedFinish, setAppliedFinish] = useState('');
  // Remonta el FilterDate para reiniciar su selección interna
  const [dateFilterKey, setDateFilterKey] = useState(0);

  const [selectedPart, setSelectedPart] = useState<PartsSoldReportItem | null>(
    null
  );

  const [sortState, setSortState] = useState<SortState | null>(null);

  // Se lee en un efecto (no en el useState inicial) para no desincronizar el
  // render de servidor/cliente: localStorage no existe durante el SSR.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SORT_STORAGE_KEY);
      if (raw) setSortState(JSON.parse(raw));
    } catch {
      // Storage no disponible: se queda con el orden original.
    }
  }, []);

  const handleSort = (column: SortColumn) => {
    setSortState((prev) => {
      const next: SortState | null =
        !prev || prev.column !== column
          ? { column, direction: 'asc' }
          : prev.direction === 'asc'
            ? { column, direction: 'desc' }
            : null; // tercer click: vuelve al orden original

      try {
        if (next) {
          localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(next));
        } else {
          localStorage.removeItem(SORT_STORAGE_KEY);
        }
      } catch {
        // Nada que persistir si el storage no está disponible.
      }
      return next;
    });
  };

  const handleSearch = () => {
    setAppliedPart(partInput);
    setPage(1);
  };

  // El rango de fechas se aplica al instante, sin pasar por "Buscar"
  const handleDateChange = (start?: string, finish?: string) => {
    setAppliedStart(start ?? '');
    setAppliedFinish(finish ?? '');
    setPage(1);
  };

  const clearFilters = () => {
    setPartInput('');
    setAppliedPart('');
    setAppliedStart('');
    setAppliedFinish('');
    setDateFilterKey((k) => k + 1);
    setPage(1);
  };

  const hasActiveFilters = !!(appliedPart || appliedStart || appliedFinish);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'parts-sold-report',
      { branchIdString, page, appliedPart, appliedStart, appliedFinish },
    ],
    queryFn: () =>
      transactionService.getPartsSoldReport(token, branchIdString, {
        page: String(page),
        pageSize: '10',
        part: appliedPart || undefined,
        start: appliedStart || undefined,
        finish: appliedFinish || undefined,
      }),
    enabled: !!token && !!branchIdString,
  });

  const results = data?.data?.results ?? [];
  const staticData = data?.data?.staticData;
  const totalPages = data?.data?.totalPages ?? 1;

  const paymentKpis = useMemo(
    () => staticData?.paymentMethodTotals ?? [],
    [staticData]
  );

  const marginPercent =
    staticData && staticData.totalRevenue
      ? (staticData.totalUtility / staticData.totalRevenue) * 100
      : 0;

  // El sort corre en memoria sobre la página actual (10 filas): no dispara
  // una nueva llamada al endpoint ni cambia la lógica de paginación/filtros.
  const sortedResults = useMemo(() => {
    if (!sortState) return results;
    const { column, direction } = sortState;
    const getValue = SORT_VALUE[column];
    const sorted = [...results].sort((a, b) => {
      const va = getValue(a);
      const vb = getValue(b);
      return typeof va === 'string' && typeof vb === 'string'
        ? va.localeCompare(vb)
        : (va as number) - (vb as number);
    });
    return direction === 'asc' ? sorted : sorted.reverse();
  }, [results, sortState]);

  const sortableHeader = (
    column: SortColumn,
    label: string,
    align: 'left' | 'right' = 'left'
  ): Pick<
    GenericTableColumn<PartsSoldReportItem>,
    'header' | 'headerClassName'
  > => {
    const isActive = sortState?.column === column;
    return {
      header: (
        <button
          type="button"
          onClick={() => handleSort(column)}
          className={cn(
            'inline-flex items-center gap-1',
            align === 'right' && 'flex-row-reverse'
          )}
        >
          {label}
          {isActive ? (
            sortState!.direction === 'asc' ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          ) : (
            <ChevronsUpDown className="h-3 w-3 opacity-30" />
          )}
        </button>
      ),
      headerClassName: cn(
        'cursor-pointer select-none transition-colors hover:bg-gray-200',
        isActive && 'bg-blue-500/10'
      ),
    };
  };

  const partsColumns: GenericTableColumn<PartsSoldReportItem>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '5rem',
      render: (item) => item.product.id,
    },
    {
      key: 'sku',
      ...sortableHeader('sku', 'SKU'),
      render: (item) => item.product.sku,
    },
    {
      key: 'name',
      ...sortableHeader('name', 'Repuesto'),
      render: (item) => item.product.name,
    },
    {
      key: 'currentInventory',
      header: 'Inventario Actual',
      render: (item) => item.currentInventory,
    },
    {
      key: 'quantitySold',
      ...sortableHeader('quantitySold', 'Cantidad Vendida'),
      render: (item) => item.quantitySold,
    },
    {
      key: 'revenue',
      ...sortableHeader('revenue', 'Ingreso'),
      render: (item) => usdFormatCurrency(item.revenue),
    },
    {
      key: 'cost',
      ...sortableHeader('cost', 'Costo'),
      render: (item) => usdFormatCurrency(item.cost),
    },
    {
      key: 'utility',
      ...sortableHeader('utility', 'Utilidad'),
      render: (item) => usdFormatCurrency(item.utility),
    },
    {
      key: 'margin',
      ...sortableHeader('margin', 'Margen %', 'right'),
      align: 'right',
      render: (item) => {
        const margin = marginOf(item);
        return (
          <span className={marginColorClass(margin)}>{margin.toFixed(1)}%</span>
        );
      },
    },
  ];

  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        Error al cargar el reporte de repuestos.
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="ml-2"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="py-3">
      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          type="text"
          value={partInput}
          onChange={(e) => setPartInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Buscar repuesto..."
          className="px-3 py-2 border rounded-md min-w-[200px]"
        />

        <Button onClick={handleSearch} size="sm">
          Buscar
        </Button>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        )}
      </div>

      {/* Filtro de fechas */}
      <div className="flex items-center mb-4">
        <FilterDate key={dateFilterKey} onChange={handleDateChange} />
      </div>

      {/* Sección 1: KPIs principales */}
      {staticData && results.length > 0 && (
        <div className="grid gap-3 mb-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          <KpiCardMain
            label="Ingreso Total"
            value={usdFormatCurrency(staticData.totalRevenue)}
            tone="green"
          />
          <KpiCardMain
            label="Costo Total"
            value={usdFormatCurrency(staticData.totalCost)}
            tone="red"
          />
          <KpiCardMain
            label="Utilidad Total"
            value={usdFormatCurrency(staticData.totalUtility)}
            tone={staticData.totalUtility >= 0 ? 'green' : 'red'}
          />
          <KpiCardMain
            label="Margen de Utilidad"
            value={`${marginPercent.toFixed(1)}%`}
            tone={marginPercent >= 0 ? 'green' : 'red'}
          />
        </div>
      )}

      {/* Sección 2: Desglose de métodos de pago (colapsable) */}
      {staticData && results.length > 0 && paymentKpis.length > 0 && (
        <PaymentMethodsSection paymentKpis={paymentKpis} />
      )}

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as 'parts' | 'orders')}
        className="w-full mb-4"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="parts">Repuestos Vendidos</TabsTrigger>
          <TabsTrigger value="orders">Órdenes con Repuestos</TabsTrigger>
        </TabsList>
      </Tabs>

      {activeTab === 'orders' ? (
        <OrdersWithPartsList
          branchIdString={branchIdString}
          start={appliedStart}
          finish={appliedFinish}
        />
      ) : (
        <GenericTable<PartsSoldReportItem>
          columns={partsColumns}
          data={sortedResults}
          getRowKey={(item) => item.product.id}
          isLoading={isLoading}
          emptyMessage="No hay repuestos vendidos en el periodo seleccionado."
          onRowClick={(item) => setSelectedPart(item)}
          pagination={{
            currentPage: page,
            totalPages,
            onPageChange: setPage,
          }}
        />
      )}

      {selectedPart && (
        <PartSaleDetailModal
          product={selectedPart.product}
          branchIdString={branchIdString}
          start={appliedStart}
          finish={appliedFinish}
          onClose={() => setSelectedPart(null)}
        />
      )}
    </div>
  );
}
