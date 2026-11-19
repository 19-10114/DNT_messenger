'use client';

import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { ColorCircles } from '@/components/tables/colorCircles.component';
import { Button } from '@/components/ui/button.component';
import {
  formatDate,
  usdFormatCurrency,
  formatCurrencyBolivares,
} from '@/lib/utils';
import { useDailyReport } from '@/hooks';
import { useToast } from '@/components/ui/use-toast';

/** Fila de los cuadros Gastos / Abonos / Pagos */
interface ConceptRow {
  concept: string;
  usd?: number;
  bs?: number;
}

/** Los tres cuadros de conceptos comparten forma: concepto + USD + Bs */
const CONCEPT_COLUMNS: GenericTableColumn<ConceptRow>[] = [
  { key: 'concept', header: 'Concepto' },
  {
    key: 'usd',
    header: 'USD',
    render: (item) =>
      item.usd !== undefined ? usdFormatCurrency(item.usd) : '-',
  },
  {
    key: 'bs',
    header: 'Bs',
    render: (item) =>
      item.bs !== undefined ? formatCurrencyBolivares(item.bs) : '-',
  },
];

function ConceptTable({ title, rows }: { title: string; rows: ConceptRow[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <GenericTable<ConceptRow>
        columns={CONCEPT_COLUMNS}
        data={rows}
        density="compact"
        getRowKey={(item) => item.concept}
      />
    </div>
  );
}

export default function DailyReport() {
  const [date, setDate] = useState<string>(formatDate(new Date()));
  const [queryParams, setQueryParams] = useState({
    date,
    page: '1',
    pageSize: '10',
  });
  const todayStr = formatDate(new Date());

  // La consulta se dispara al entrar con la fecha de hoy
  const {
    isLoading,
    isError,
    isEmpty,
    rows,
    summary,
    pagination,
    colorRows,
    notes,
    other,
    branchId,
  } = useDailyReport(queryParams, true);
  const toast = useToast();

  // Fecha consultada en formato dd/mm/aaaa para los mensajes
  const queriedDateLabel = queryParams.date.split('-').reverse().join('/');

  const handleApply = () => {
    if (date > todayStr) {
      toast.toast({
        title: 'Fecha inválida',
        description: 'La fecha seleccionada no puede ser futura.',
        variant: 'destructive',
      });
      return;
    }
    setQueryParams({
      date,
      page: '1',
      pageSize: '10',
    });
  };

  const goToPage = (page: number) => {
    setQueryParams((prev) => ({ ...prev, page: String(page) }));
  };

  const isHexColor = (value: string) =>
    /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(value);

  // Agrupar colores por producto, mostrando sus cantidades
  const groupedColorsByProduct = useMemo(() => {
    const map = new Map<
      string,
      {
        colors: { color: string; colorHex: string; quantity: number }[];
        total: number;
      }
    >();

    for (const r of colorRows) {
      const productKey = r.product;
      const colorHex = isHexColor(r.color) ? r.color : '#ccc';
      const entry = { color: r.color, colorHex, quantity: r.count };

      if (!map.has(productKey)) {
        map.set(productKey, { colors: [entry], total: r.count });
      } else {
        const current = map.get(productKey)!;
        current.colors.push(entry);
        current.total += r.count;
        map.set(productKey, current);
      }
    }

    return Array.from(map.entries()).map(([product, data]) => ({
      product,
      colors: data.colors,
      total: data.total,
    }));
  }, [colorRows]);

  // Secciones para Resumen adicional: Pagos, Abonos, Gastos
  const paymentsRows: ConceptRow[] = [
    { concept: 'Efectivo USD', usd: Number(summary.totalCashUsdOther) },
    { concept: 'Total USD ', usd: Number(summary.totalUsdOther) },
    { concept: 'Efectivo Bs ', bs: Number(summary.totalCashBsOther) },
    { concept: 'Total Bs ', bs: Number(summary.totalBsOther) },
    { concept: 'DP', usd: Number(summary.dp) },
  ];

  const abonosRows: ConceptRow[] = [
    { concept: 'Abonos Efectivo USD', usd: Number(summary.abonoCashUsd) },
    { concept: 'Abonos USD', usd: Number(summary.abonoUsd) },
    { concept: 'Abonos Efectivo Bs', bs: Number(summary.abonoCashBs) },
    { concept: 'Abonos Bs', bs: Number(summary.abonoBs) },
  ];

  const gastosRows: ConceptRow[] = [
    { concept: 'Gastos USD', usd: Number(summary.spentUsd) },
    { concept: 'Gastos Bs', bs: Number(summary.spentBs) },
    { concept: 'Gastos Efectivo USD', usd: Number(summary.spentCashUsd) },
    { concept: 'Gastos Efectivo Bs', bs: Number(summary.spentCashBs) },
  ];

  // Salidas de efectivo: no son gastos, van aparte. Ya están restadas del
  // "Efectivo USD" de Pagos.
  const withdrawnCashUsd = Number(summary.withdrawnCashUsd);
  const withdrawalsRows: ConceptRow[] = [
    { concept: 'Salidas Efectivo USD', usd: withdrawnCashUsd },
  ];

  // Transacciones del día: los totales de cada columna van al pie de la tabla
  type TransactionRow = (typeof rows)[number];
  const transactionColumns: GenericTableColumn<TransactionRow>[] = [
    { key: 'orderId', header: 'Orden', footer: '' },
    { key: 'invoiceNumber', header: 'Factura', footer: '' },
    {
      key: 'inNumber',
      header: 'N° Entrada',
      render: (row) => row.inNumber || '-',
      footer: '',
    },
    {
      key: 'outNumber',
      header: 'N° Salida',
      render: (row) => row.outNumber || '-',
      footer: '',
    },
    { key: 'product', header: 'Producto', footer: '' },
    { key: 'color', header: 'Color', footer: '' },
    {
      key: 'cashUsd',
      header: 'Efectivo USD',
      render: (row) => usdFormatCurrency(row.cashUsd),
      footer: usdFormatCurrency(summary.totalCashUsd),
    },
    {
      key: 'nonCashUsd',
      header: 'Zelle/Binance',
      render: (row) => usdFormatCurrency(row.nonCashUsd),
      footer: usdFormatCurrency(summary.totalNonCashUsd),
    },
    {
      key: 'cashBs',
      header: 'Efectivo Bs',
      render: (row) => formatCurrencyBolivares(row.cashBs),
      footer: formatCurrencyBolivares(summary.totalCashBs),
    },
    {
      key: 'nonCashBs',
      header: 'Pago movil/Transferencia',
      render: (row) => formatCurrencyBolivares(row.nonCashBs),
      footer: formatCurrencyBolivares(summary.totalNonCashBs),
    },
    {
      key: 'totalUsd',
      header: 'Total USD',
      render: (row) => usdFormatCurrency(row.totalUsd),
      footer: usdFormatCurrency(summary.grandTotalUsd),
    },
    {
      key: 'totalBs',
      header: 'Total Bs',
      render: (row) => formatCurrencyBolivares(row.totalBs),
      footer: formatCurrencyBolivares(summary.grandTotalBs),
    },
    {
      key: 'originBranchName',
      header: 'Sucursal',
      hidden: branchId !== 0,
      footer: '',
    },
  ];

  const colorColumns: GenericTableColumn<
    (typeof groupedColorsByProduct)[number]
  >[] = [
    { key: 'product', header: 'Producto' },
    {
      key: 'colors',
      header: 'Colores',
      render: (row) => <ColorCircles colors={row.colors} />,
    },
    { key: 'total', header: 'Cantidad Total' },
  ];

  type OtherRow = NonNullable<typeof other>['results'][number];
  const otherColumns: GenericTableColumn<OtherRow>[] = [
    { key: 'id', header: 'ID', footer: 'Totales' },
    {
      key: 'concept',
      header: 'Concepto',
      // Las filas del Módulo de Gastos traen categoría y concepto; las
      // legadas son órdenes con el producto "Gasto" o "Abono".
      render: (item) =>
        item.source === 'expense'
          ? `Gasto ${item.category ?? ''}: ${item.concept ?? ''}`
          : 'Orden',
    },
    {
      key: 'totalUsd',
      header: 'USD',
      render: (item) => usdFormatCurrency(item.totalUsd),
      footer: usdFormatCurrency(Number(summary.totalUsdOther)),
    },
    {
      key: 'totalBs',
      header: 'Bs',
      render: (item) => formatCurrencyBolivares(item.totalBs),
      footer: formatCurrencyBolivares(Number(summary.totalBsOther)),
    },
  ];

  const noteColumns: GenericTableColumn<string>[] = [
    { key: 'note', header: 'Descripción', render: (note) => note },
  ];

  return (
    <section className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col md:col-span-2">
              <label htmlFor="date" className="text-sm font-medium">
                Fecha
              </label>
              <input
                id="date"
                type="date"
                className="px-3 py-2 border rounded-md"
                value={date}
                max={todayStr}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Button onClick={handleApply} className="w-full md:w-auto">
                Aplicar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transacciones del día (debajo de filtros) */}
      <Card>
        <CardHeader>
          <CardTitle>Transacciones del día</CardTitle>
        </CardHeader>
        <CardContent>
          {isError && (
            <p className="text-sm text-red-600 mb-2">
              Ocurrió un error al cargar el reporte.
            </p>
          )}
          {isEmpty && (
            <p className="text-sm text-muted-foreground mb-2">
              No se registraron movimientos el {queriedDateLabel}.
            </p>
          )}
          <GenericTable<TransactionRow>
            columns={transactionColumns}
            data={rows}
            getRowKey={(row) => `tx-${row.orderId}-${row.invoiceNumber}`}
            isLoading={isLoading}
            emptyMessage="No hay transacciones para mostrar."
            pagination={{
              currentPage: pagination.currentPage || Number(queryParams.page),
              totalPages: pagination.totalPages || 1,
              onPageChange: goToPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Abajo: 3 tablas (colores, cuadros adicionales, observaciones) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tabla de colores */}
        <Card>
          <CardHeader>
            <CardTitle>Colores por producto</CardTitle>
          </CardHeader>
          <CardContent>
            <GenericTable
              columns={colorColumns}
              data={groupedColorsByProduct}
              getRowKey={(row) => row.product}
              emptyMessage="No hay datos de colores."
            />
          </CardContent>
        </Card>

        {/* Tabla de cuadros adicionales */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen adicional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4">
              <ConceptTable title="Gastos" rows={gastosRows} />
              {withdrawnCashUsd > 0 && (
                <ConceptTable
                  title="Salidas de efectivo"
                  rows={withdrawalsRows}
                />
              )}
              <ConceptTable title="Abonos" rows={abonosRows} />
              <ConceptTable title="Pagos" rows={paymentsRows} />
            </div>

            {/* Tabla de Otros (paginado) */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold mb-2">Totales</h4>
              <GenericTable<OtherRow>
                columns={otherColumns}
                data={other?.results ?? []}
                getRowKey={(item) => `${item.source ?? 'order'}-${item.id}`}
                isLoading={isLoading}
                emptyMessage="No hay datos de otros."
                pagination={{
                  currentPage:
                    other?.pagination.currentPage || Number(queryParams.page),
                  totalPages: other?.pagination.totalPages || 1,
                  onPageChange: goToPage,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de observaciones (movida abajo para mejor espacio) */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <GenericTable<string>
            columns={noteColumns}
            data={notes ?? []}
            getRowKey={(_note, index) => `note-${index}`}
            emptyMessage="Sin observaciones."
          />
        </CardContent>
      </Card>
    </section>
  );
}
