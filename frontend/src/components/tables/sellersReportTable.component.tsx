'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import {
  exportToXLSX,
  ExportData,
} from '@/components/excelExporter/exportXSLX';
import { UsersService } from '@/services/users/users.service';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  SellerReportItem,
  PaymentMethodTotal,
} from '@/services/users/types/usersBackendResponse.types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';

const categoryOptions = [
  { value: 'bikes', label: 'Motos' },
  { value: 'parts', label: 'Repuestos' },
];

const PAYMENT_LABELS: Record<string, string> = {
  pago_movil: 'Pago Móvil',
  punto_de_venta: 'Punto de Venta',
  efectivo_bs: 'Efectivo Bs',
  transferencia: 'Transferencia',
  efectivo_usd: 'Efectivo USD',
  zelle: 'Zelle',
  binance: 'Binance',
};

const BS_PAYMENT_TYPES = [
  'pago_movil',
  'punto_de_venta',
  'efectivo_bs',
  'transferencia',
];
const USD_PAYMENT_TYPES = ['efectivo_usd', 'zelle', 'binance'];
const ALL_PAYMENT_TYPES = [...USD_PAYMENT_TYPES, ...BS_PAYMENT_TYPES];

function isBsType(type: string) {
  return BS_PAYMENT_TYPES.includes(type);
}

function KpiCard({ pm }: { pm: PaymentMethodTotal }) {
  const isUsd = USD_PAYMENT_TYPES.includes(pm.type);
  const amount = isUsd
    ? `$${pm.total.toFixed(2)}`
    : `${pm.total.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs`;

  const borderClass = isUsd
    ? 'border-l-4 border-green-600'
    : 'border-l-4 border-secondary';
  const textClass = isUsd ? 'text-green-600' : 'text-secondary';

  return (
    <div
      className={`bg-white rounded-xl shadow-sm ${borderClass} px-5 py-4 flex flex-col gap-1`}
    >
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {PAYMENT_LABELS[pm.type] ?? pm.type}
      </span>
      <span className={`text-xl font-bold ${textClass}`}>{amount}</span>
    </div>
  );
}

function exportSellersReport(results: SellerReportItem[]) {
  let sumTotalSoldUsd = 0;
  let sumTotalBs = 0;
  let sumTotalUsd = 0;

  const rows: ExportData[] = results.map((item) => {
    const getTotal = (type: string) =>
      item.paymentMethodTotals.find((p) => p.type === type)?.total ?? 0;

    sumTotalSoldUsd += item.totals.totalSoldUsd;
    sumTotalBs += item.totals.totalBs;
    sumTotalUsd += item.totals.totalUsd;

    return {
      ID: item.seller.id,
      Nombre: item.seller.firstName,
      Apellido: item.seller.lastName,
      Cédula: item.seller.documentId,
      'Total Vendido (USD)': item.totals.totalSoldUsd,
      'Total Bs': item.totals.totalBs,
      'Total USD': item.totals.totalUsd,
      'Cantidad Vendida': item.totals.totalQuantity,
      ...Object.fromEntries(
        ALL_PAYMENT_TYPES.map((t) => [PAYMENT_LABELS[t], getTotal(t)])
      ),
      Sucursal: item.seller.branch.name,
    };
  });

  rows.push({
    ID: 'TOTALES',
    Nombre: '-',
    Apellido: '-',
    Cédula: '-',
    'Total Vendido (USD)': sumTotalSoldUsd,
    'Total Bs': sumTotalBs,
    'Total USD': sumTotalUsd,
    'Cantidad Vendida': '-',
    ...Object.fromEntries(
      ALL_PAYMENT_TYPES.map((t) => [PAYMENT_LABELS[t], '-'])
    ),
    Sucursal: '-',
  });

  exportToXLSX(rows, 'Reporte de Vendedores');
}

export function SellersReportTable() {
  const token = useToken();
  const branchId = useCurrentBranchId();
  const branchIdString = branchId != null ? branchId.toString() : '';

  const usersService = useMemo(() => new UsersService(), []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sellerInput, setSellerInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');

  const [appliedSeller, setAppliedSeller] = useState('');
  const [appliedCategory, setAppliedCategory] = useState('');
  const [appliedStart, setAppliedStart] = useState('');
  const [appliedFinish, setAppliedFinish] = useState('');
  // Remonta el FilterDate para reiniciar su selección interna
  const [dateFilterKey, setDateFilterKey] = useState(0);

  const [selectedSeller, setSelectedSeller] = useState<SellerReportItem | null>(
    null
  );
  const [paymentModalSeller, setPaymentModalSeller] =
    useState<SellerReportItem | null>(null);

  const hasActiveFilters = !!(
    appliedSeller ||
    appliedCategory ||
    appliedStart ||
    appliedFinish
  );

  const handleSearch = () => {
    setAppliedSeller(sellerInput);
    setAppliedCategory(categoryInput);
    setPage(1);
  };

  // El rango de fechas se aplica al instante, sin pasar por "Buscar"
  const handleDateChange = (start?: string, finish?: string) => {
    setAppliedStart(start ?? '');
    setAppliedFinish(finish ?? '');
    setPage(1);
  };

  const clearFilters = () => {
    setSellerInput('');
    setCategoryInput('');
    setAppliedSeller('');
    setAppliedCategory('');
    setAppliedStart('');
    setAppliedFinish('');
    setDateFilterKey((k) => k + 1);
    setPage(1);
  };

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      'sellers-report',
      {
        branchIdString,
        page,
        pageSize,
        appliedSeller,
        appliedCategory,
        appliedStart,
        appliedFinish,
      },
    ],
    queryFn: () =>
      usersService.getSellersReport(token as string, branchIdString, {
        page: String(page),
        page_size: String(pageSize),
        seller: appliedSeller || undefined,
        category: appliedCategory || undefined,
        start: appliedStart || undefined,
        finish: appliedFinish || undefined,
      }),
    enabled: !!token && !!branchIdString,
  });

  const results = data?.data?.results ?? [];
  const staticKpis = data?.data?.staticData?.paymentMethodTotals ?? [];
  const totalPages = data?.data?.totalPages ?? 1;
  const currentPage = data?.data?.currentPage ?? page;
  const totalElements = data?.data?.totalElements ?? 0;
  const columns: GenericTableColumn<SellerReportItem>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '5rem',
      // Al hacer click en el ID se abre el detalle del vendedor
      onCellClick: (item) => setSelectedSeller(item),
      render: (item) => item.seller.id,
    },
    {
      key: 'firstName',
      header: 'Nombre',
      render: (item) => item.seller.firstName,
    },
    {
      key: 'lastName',
      header: 'Apellido',
      render: (item) => item.seller.lastName,
    },
    {
      key: 'documentId',
      header: 'Cédula',
      render: (item) => item.seller.documentId,
    },
    {
      key: 'totalUsd',
      header: 'Total Recibido (USD)',
      render: (item) => item.totals.totalUsd.toFixed(2),
    },
    {
      key: 'totalBs',
      header: 'Total Recibido (Bs)',
      render: (item) => item.totals.totalBs.toFixed(2),
    },
    {
      key: 'totalSoldUsd',
      header: 'Total Vendido (USD)',
      // Al hacer click se abre el desglose por método de pago
      onCellClick: (item) => setPaymentModalSeller(item),
      render: (item) => item.totals.totalSoldUsd.toFixed(2),
    },
    {
      key: 'totalQuantity',
      header: 'Cantidad Vendida',
      render: (item) => item.totals.totalQuantity,
    },
    {
      key: 'branch',
      header: 'Sucursal',
      // Solo para el super admin: en una sucursal todas las filas son iguales
      hidden: branchId !== 0,
      render: (item) => item.seller.branch.name,
    },
  ];

  if (isError) {
    return (
      <div className="py-8 text-center text-red-500">
        Error al cargar el reporte de vendedores.
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
      {/* KPIs */}
      {staticKpis.length > 0 && (
        <div className="grid gap-3 mb-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {staticKpis.map((pm) => (
            <KpiCard key={pm.type} pm={pm} />
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col gap-4 my-4">
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={sellerInput}
            onChange={(e) => setSellerInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Buscar vendedor..."
            className="px-3 py-2 border rounded-md min-w-[200px]"
          />

          <Select value={categoryInput} onValueChange={setCategoryInput}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
        <div className="flex items-center">
          <FilterDate key={dateFilterKey} onChange={handleDateChange} />
        </div>
      </div>

      {/* Barra entre filtros y tabla */}
      <div className="flex justify-end items-center mb-2">
        <Button
          variant="outline"
          size="sm"
          disabled={results.length === 0 || isLoading}
          onClick={() => exportSellersReport(results)}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar
        </Button>
      </div>

      {/* Tabla */}
      <GenericTable<SellerReportItem>
        columns={columns}
        data={results}
        getRowKey={(item) => item.seller.id}
        isLoading={isLoading}
        emptyMessage="No hay resultados para mostrar"
        pagination={{
          currentPage,
          totalPages,
          totalElements,
          pageSize,
          onPageChange: setPage,
          onPageSizeChange: (newPageSize) => {
            setPageSize(newPageSize);
            setPage(1);
          },
        }}
      />

      {/* Modal detalle vendedor */}
      {selectedSeller && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedSeller(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-3 border-b border-gray-300 bg-gray-200">
              <h2 className="text-xl font-semibold font-serif text-gray-800">
                Detalle del Vendedor
              </h2>
              <p className="text-md text-gray-700 mt-1">
                <span className="text-green-600 font-medium">
                  {selectedSeller.seller.id}
                </span>{' '}
                - {selectedSeller.seller.firstName}{' '}
                {selectedSeller.seller.lastName}
              </p>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="grid grid-cols-2 gap-3 text-md bg-gray-50 rounded-lg p-4 justify-items-center">
                <div className="text-center">
                  <span className="text-gray-500 text-md">Total USD</span>
                  <p className="text-base font-semibold">
                    ${selectedSeller.totals.totalUsd.toFixed(2)}
                  </p>
                </div>
                <div className="text-center">
                  <span className="text-gray-500 text-md">Total Bs</span>
                  <p className="text-base font-semibold">
                    {selectedSeller.totals.totalBs.toFixed(2)} Bs
                  </p>
                </div>
                <div className="bg-green-50 rounded-md p-3 text-center w-full">
                  <span className="text-gray-500 text-md">
                    Total Vendido USD
                  </span>
                  <p className="text-xl font-bold text-green-600">
                    ${selectedSeller.totals.totalSoldUsd.toFixed(2)}
                  </p>
                </div>
                <div className="bg-blue-50 rounded-md p-3 text-center w-full">
                  <span className="text-gray-500 text-md">
                    Cantidad Vendida
                  </span>
                  <p className="text-xl font-bold text-blue-600">
                    {selectedSeller.totals.totalQuantity}
                  </p>
                </div>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-800 text-center pb-2 mb-3 border-b border-gray-300">
                  Productos Vendidos
                </h3>
                <div className="border rounded-lg overflow-hidden text-sm">
                  <div className="grid grid-cols-[1fr_auto_auto] bg-gray-100 px-4 py-2 font-medium text-gray-600 text-xs uppercase">
                    <span>Producto</span>
                    <span className="text-right pr-4">Cant.</span>
                    <span className="text-right">Total</span>
                  </div>
                  <ul className="divide-y divide-gray-100 max-h-52 overflow-y-auto">
                    {selectedSeller.productsSold.map((product) => (
                      <li
                        key={product.productId}
                        className="grid grid-cols-[1fr_auto_auto] items-center px-4 py-2"
                      >
                        <span className="text-gray-700">{product.name}</span>
                        <span className="text-gray-500 text-right pr-4 whitespace-nowrap">
                          {product.quantity}
                        </span>
                        <span className="text-gray-700 text-right whitespace-nowrap">
                          ${product.total.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedSeller(null)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal métodos de pago */}
      {paymentModalSeller &&
        (() => {
          const usdEntries = paymentModalSeller.paymentMethodTotals.filter(
            (p) => USD_PAYMENT_TYPES.includes(p.type)
          );
          const bsEntries = paymentModalSeller.paymentMethodTotals.filter((p) =>
            isBsType(p.type)
          );
          const usdTotal = usdEntries.reduce((s, p) => s + p.total, 0);
          const bsTotal = bsEntries.reduce((s, p) => s + p.total, 0);

          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
              onClick={() => setPaymentModalSeller(null)}
            >
              <div
                className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-6 pt-5 pb-3 border-b border-gray-300 bg-gray-200">
                  <h2 className="text-xl font-semibold font-serif text-gray-800">
                    Métodos de Pago
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {paymentModalSeller.seller.firstName}{' '}
                    {paymentModalSeller.seller.lastName}
                  </p>
                </div>

                <div className="px-6 py-5 grid grid-cols-2 gap-6">
                  {/* USD */}
                  <div className="flex flex-col gap-2 px-4">
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pb-1 border-b border-gray-200 text-center">
                      En USD
                    </h3>
                    {usdEntries.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin pagos en USD</p>
                    ) : (
                      usdEntries.map((p) => (
                        <div
                          key={p.type}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">
                            {PAYMENT_LABELS[p.type] ?? p.type}
                          </span>
                          <span className="font-medium text-green-600">
                            {p.total.toFixed(2)}
                          </span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center text-sm font-bold border-t border-gray-200 pt-2 mt-1">
                      <span className="text-gray-700">Total</span>
                      <span className="text-green-700">
                        {usdTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bs */}
                  <div className="flex flex-col gap-2 px-4">
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pb-1 border-b border-gray-200 text-center">
                      En Bs
                    </h3>
                    {bsEntries.length === 0 ? (
                      <p className="text-xs text-gray-400">Sin pagos en Bs</p>
                    ) : (
                      bsEntries.map((p) => (
                        <div
                          key={p.type}
                          className="flex justify-between items-center text-sm"
                        >
                          <span className="text-gray-600">
                            {PAYMENT_LABELS[p.type] ?? p.type}
                          </span>
                          <span className="font-medium text-secondary">
                            {p.total.toLocaleString('es-VE', {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      ))
                    )}
                    <div className="flex justify-between items-center text-sm font-bold border-t border-gray-200 pt-2 mt-1">
                      <span className="text-gray-700">Total</span>
                      <span className="text-secondary">
                        {bsTotal.toLocaleString('es-VE', {
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="px-6 pb-5 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaymentModalSeller(null)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            </div>
          );
        })()}
    </div>
  );
}
