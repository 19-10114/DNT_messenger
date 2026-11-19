'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as echarts from 'echarts';
import { RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card.component';
import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import FilterDropdown from '@/components/ui/filterDropdown.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { formatCurrency } from '@/lib/utils';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { PaymentMethodsSection } from '@/components/tables/PaymentMethodsSection.component';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useCategoryUtilityReport } from '@/hooks/useCategoryUtilityReport';
import {
  CATEGORY_LABELS,
  UTILITY_REPORT_CATEGORIES,
  UtilityByProduct,
} from '@/services/transactions/types/CategoryUtilityReport.type';

const CATEGORY_OPTIONS = UTILITY_REPORT_CATEGORIES.map((id) => ({
  value: String(id),
  label: CATEGORY_LABELS[id],
}));

const CATEGORY_BADGE_STYLES: Record<number, string> = {
  1: 'bg-blue-50 text-blue-700 border-blue-200',
  2: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  6: 'bg-amber-50 text-amber-700 border-amber-200',
  5: 'bg-purple-50 text-purple-700 border-purple-200',
};

const CHART_COLORS = [
  '#365fda',
  '#ec8f2b',
  '#22a06b',
  '#c14945',
  '#9A60B4',
  '#54b4db',
  '#EA7CCC',
  '#46bcbc',
  '#7e0303',
  '#A5D7C6',
];

const MONTH_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

const formatMonth = (month: string) => {
  const [year, m] = month.split('-');
  const idx = Number(m) - 1;
  return `${MONTH_LABELS[idx] ?? m} ${year}`;
};

const marginPct = (utility: number, revenue: number) =>
  revenue > 0 ? (utility / revenue) * 100 : 0;

// Versión corta para ejes de gráfico angostos (mobile) donde "USD 42.758,74"
// no cabe sin superponerse con el siguiente tick — el valor exacto sigue
// disponible en el tooltip y en la etiqueta de cada barra.
const formatCompactCurrency = (value: number) => {
  const sign = value < 0 ? '-' : '';
  const abs = Math.abs(value);
  if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}K`;
  return `${sign}$${Math.round(abs)}`;
};

// Punto de equilibrio mensual fijo para la tendencia global, definido por el negocio.
const BREAK_EVEN_UTILITY = 65000;
const BREAK_EVEN_COLOR = '#dc2626';
const AVERAGE_COLOR = '#6b7280';

const getDefaultDates = () => {
  const today = new Date();
  const lastMonth = new Date(today);
  lastMonth.setMonth(today.getMonth() - 1);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { startDate: fmt(lastMonth), endDate: fmt(today) };
};

/** Bar chart shared by the "por sucursal" and "por categoría" panels. */
function UtilityBarChart({
  title,
  categories,
  values,
}: {
  title: string;
  categories: string[];
  values: number[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  // Muchas barras verticales en poco ancho (celular) hacen que las etiquetas
  // rotadas y los valores encima de cada barra se superpongan. Con varias
  // categorías, en mobile se voltea a barras horizontales: cada categoría
  // ocupa su propia fila y el texto se lee sin rotar.
  const horizontal = isMobile && categories.length > 4;

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    const valueAxis = {
      type: 'value' as const,
      // En horizontal (mobile) el eje de valores queda angosto: formato
      // compacto y menos ticks para que no se superpongan las etiquetas.
      splitNumber: horizontal ? 4 : 5,
      axisLabel: {
        formatter: (v: number) =>
          horizontal ? formatCompactCurrency(v) : formatCurrency(v),
        fontSize: horizontal ? 10 : 11,
      },
    };
    const categoryAxis = {
      type: 'category' as const,
      data: categories,
      axisLabel: horizontal
        ? { fontSize: 11, width: 84, overflow: 'truncate' as const }
        : { rotate: categories.length > 5 ? 30 : 0, fontSize: 12, interval: 0 },
    };
    const barSeries = {
      type: 'bar' as const,
      data: values,
      barMaxWidth: horizontal ? 22 : 56,
      itemStyle: {
        borderRadius: horizontal ? [0, 4, 4, 0] : [6, 6, 0, 0],
        color: (params: any) =>
          CHART_COLORS[params.dataIndex % CHART_COLORS.length],
      },
      label: {
        show: true,
        position: horizontal ? ('right' as const) : ('top' as const),
        fontSize: 11,
        formatter: (params: any) =>
          horizontal
            ? formatCompactCurrency(params.value)
            : formatCurrency(params.value),
      },
    };

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const p = params[0];
          return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div>${formatCurrency(p.value)}`;
        },
      },
      grid: horizontal
        ? {
            left: '3%',
            right: '12%',
            bottom: '3%',
            top: '3%',
            containLabel: true,
          }
        : {
            left: '3%',
            right: '4%',
            bottom: '8%',
            top: '8%',
            containLabel: true,
          },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
      series: [barSeries],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [title, categories, values, horizontal]);

  // Cada barra horizontal necesita su propia fila; con muchas categorías el
  // panel crece en vez de aplastarlas todas dentro de una altura fija.
  const height = horizontal ? Math.max(340, categories.length * 38) : 340;

  return <div ref={ref} style={{ width: '100%', height: `${height}px` }} />;
}

/**
 * Single-line trend chart for the fixed trailing-12-months panel, with two
 * dashed reference lines: a fixed monthly break-even and the 12-month average.
 */
function UtilityTrendChart({
  months,
  values,
  average,
}: {
  months: string[];
  values: number[];
  average: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    // En mobile no hay espacio para las etiquetas de las líneas de referencia
    // sin que se corten contra el borde — quedan solo las líneas punteadas;
    // el significado de cada una ya está en la leyenda debajo del gráfico.
    const markLineLabel = (color: string) => ({
      show: !isMobile,
      formatter: (p: any) => formatCurrency(p.value),
      position: 'insideStartTop' as const,
      color,
      fontSize: 11,
      fontWeight: 600,
    });

    chart.setOption({
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const p = params.find((item: any) => item.seriesType === 'line');
          if (!p) return '';
          return `<div style="font-weight:600;margin-bottom:4px;">${p.name}</div>${formatCurrency(p.value)}`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '8%',
        top: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: months,
        boundaryGap: false,
        axisLabel: {
          fontSize: isMobile ? 10 : 12,
          interval: isMobile ? 1 : 0,
          rotate: isMobile ? 45 : 0,
        },
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => formatCurrency(v),
          fontSize: isMobile ? 10 : 12,
        },
      },
      series: [
        {
          type: 'line',
          data: values,
          smooth: true,
          symbolSize: 6,
          lineStyle: { color: '#365fda', width: 3 },
          itemStyle: { color: '#365fda' },
          areaStyle: { color: 'rgba(54, 95, 218, 0.08)' },
          markLine: {
            symbol: 'none',
            animation: false,
            silent: true,
            data: [
              {
                yAxis: BREAK_EVEN_UTILITY,
                lineStyle: {
                  color: BREAK_EVEN_COLOR,
                  type: 'dashed',
                  width: 2,
                },
                label: markLineLabel(BREAK_EVEN_COLOR),
              },
              {
                yAxis: average,
                lineStyle: { color: AVERAGE_COLOR, type: 'dashed', width: 2 },
                label: {
                  ...markLineLabel(AVERAGE_COLOR),
                  position: 'insideStartBottom' as const,
                },
              },
            ],
          },
        },
      ],
    });

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [months, values, average, isMobile]);

  return <div ref={ref} style={{ width: '100%', height: '340px' }} />;
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function CategoryUtilityReport() {
  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState<string | undefined>(
    defaultDates.startDate
  );
  const [endDate, setEndDate] = useState<string | undefined>(
    defaultDates.endDate
  );
  const [selectedBranches, setSelectedBranches] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    CATEGORY_OPTIONS.map((c) => c.value)
  );
  const [showBranchDropdown, setShowBranchDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [branchesInitialized, setBranchesInitialized] = useState(false);

  const { data: branches } = useAllBranches();

  // "Todas las sucursales" por defecto, en cuanto llega el catálogo de sucursales.
  useEffect(() => {
    if (!branchesInitialized && branches && branches.length > 0) {
      setSelectedBranches(branches.map((b) => String(b.id)));
      setBranchesInitialized(true);
    }
  }, [branches, branchesInitialized]);

  const branchOptions = useMemo(
    () => (branches ?? []).map((b) => ({ value: String(b.id), label: b.name })),
    [branches]
  );

  const handleDateChange = (start?: string, end?: string) => {
    setStartDate(start ?? defaultDates.startDate);
    setEndDate(end ?? defaultDates.endDate);
  };

  const allBranchesSelected =
    branchOptions.length > 0 &&
    selectedBranches.length === branchOptions.length;
  const allCategoriesSelected =
    selectedCategories.length === CATEGORY_OPTIONS.length;

  const { data, isLoading, isFetching, isError, refetch } =
    useCategoryUtilityReport({
      startDate,
      endDate,
      branches: allBranchesSelected ? undefined : selectedBranches.map(Number),
      categories: allCategoriesSelected
        ? undefined
        : selectedCategories.map(Number),
    });

  const summary = data?.summary;
  const margin = summary ? marginPct(summary.utility, summary.revenue) : 0;

  const branchChartData = useMemo(() => {
    const rows = [...(data?.byBranch ?? [])].sort(
      (a, b) => b.utility - a.utility
    );
    return {
      categories: rows.map((r) => r.branchName),
      values: rows.map((r) => r.utility),
    };
  }, [data?.byBranch]);

  const categoryChartData = useMemo(() => {
    const rows = [...(data?.byCategory ?? [])];
    const order = [1, 2, 6, 5];
    rows.sort(
      (a, b) => order.indexOf(a.categoryId) - order.indexOf(b.categoryId)
    );
    return {
      categories: rows.map((r) => r.categoryName),
      values: rows.map((r) => r.utility),
    };
  }, [data?.byCategory]);

  const trendChartData = useMemo(() => {
    const rows = data?.trend.byMonth ?? [];
    const values = rows.map((r) => r.utility);
    const average =
      values.length > 0
        ? values.reduce((sum, v) => sum + v, 0) / values.length
        : 0;
    return {
      months: rows.map((r) => formatMonth(r.month)),
      values,
      average,
    };
  }, [data?.trend.byMonth]);

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-destructive font-medium">
            No se pudo cargar el reporte de utilidad por categoría.
          </p>
          <Button onClick={() => refetch()} variant="outline">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                Rango de fechas
              </label>
              <FilterDate onChange={handleDateChange} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                Sucursales
              </label>
              <FilterDropdown
                label="Sucursales"
                options={branchOptions}
                selectedValues={selectedBranches}
                onToggle={(value) =>
                  setSelectedBranches((prev) =>
                    prev.includes(value)
                      ? prev.filter((v) => v !== value)
                      : [...prev, value]
                  )
                }
                showDropdown={showBranchDropdown}
                setShowDropdown={setShowBranchDropdown}
                onSelectAll={() =>
                  setSelectedBranches(branchOptions.map((o) => o.value))
                }
                onClearAll={() => setSelectedBranches([])}
                showSearch
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted-foreground">
                Categorías
              </label>
              <FilterDropdown
                label="Categorías"
                options={CATEGORY_OPTIONS}
                selectedValues={selectedCategories}
                onToggle={(value) =>
                  setSelectedCategories((prev) =>
                    prev.includes(value)
                      ? prev.filter((v) => v !== value)
                      : [...prev, value]
                  )
                }
                showDropdown={showCategoryDropdown}
                setShowDropdown={setShowCategoryDropdown}
                onSelectAll={() =>
                  setSelectedCategories(CATEGORY_OPTIONS.map((o) => o.value))
                }
                onClearAll={() => setSelectedCategories([])}
              />
            </div>
          </div>
          <div className="flex justify-end mt-3">
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              disabled={isFetching}
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`}
              />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
            <p>Cargando reporte...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Panel 1: KPIs — mismo modelo que el Reporte de Repuestos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCardMain
              label="Ventas"
              value={formatCurrency(summary?.revenue ?? 0)}
              tone="green"
            />
            <KpiCardMain
              label="Costo"
              value={formatCurrency(summary?.cogs ?? 0)}
              tone="red"
            />
            <KpiCardMain
              label="Utilidad"
              value={formatCurrency(summary?.utility ?? 0)}
              tone={(summary?.utility ?? 0) >= 0 ? 'green' : 'red'}
            />
            <KpiCardMain
              label="Margen de Utilidad"
              value={`${margin.toFixed(1)}%`}
              tone={margin >= 0 ? 'green' : 'red'}
            />
          </div>

          {/* Desglose de métodos de pago, colapsable — igual que en el Reporte de Repuestos */}
          {data && data.paymentMethodTotals.length > 0 && (
            <PaymentMethodsSection paymentKpis={data.paymentMethodTotals} />
          )}

          {/* Panel 2 y 3: comparación entre sucursales / por categoría */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard
              title="Comparación entre sucursales"
              description="Utilidad de las sucursales seleccionadas en el período y categorías filtrados"
            >
              {branchChartData.categories.length > 0 ? (
                <UtilityBarChart
                  title="sucursales"
                  categories={branchChartData.categories}
                  values={branchChartData.values}
                />
              ) : (
                <EmptyState />
              )}
            </SectionCard>
            <SectionCard
              title="Utilidad por categoría"
              description="Motos, repuestos, servicios y agropecuarios en el período y sucursales filtrados"
            >
              {categoryChartData.categories.length > 0 ? (
                <UtilityBarChart
                  title="categorias"
                  categories={categoryChartData.categories}
                  values={categoryChartData.values}
                />
              ) : (
                <EmptyState />
              )}
            </SectionCard>
          </div>

          {/* Panel 4: tendencia global */}
          <SectionCard
            title="Tendencia global"
            description={
              data
                ? `Últimos 12 meses completos (${data.trend.startDate} a ${data.trend.endDate}), sucursales y categorías filtrados`
                : undefined
            }
          >
            {trendChartData.months.length > 0 ? (
              <>
                <UtilityTrendChart
                  months={trendChartData.months}
                  values={trendChartData.values}
                  average={trendChartData.average}
                />
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 border-t-2 border-dashed"
                      style={{ borderColor: BREAK_EVEN_COLOR }}
                    />
                    Punto de equilibrio: {formatCurrency(BREAK_EVEN_UTILITY)}
                    /mes
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 border-t-2 border-dashed"
                      style={{ borderColor: AVERAGE_COLOR }}
                    />
                    Promedio 12 meses: {formatCurrency(trendChartData.average)}
                  </span>
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </SectionCard>

          {/* Panel 5: top productos por utilidad */}
          <SectionCard
            title="Top productos por utilidad"
            description="Los 20 productos con mayor utilidad en el período, sucursales y categorías filtrados. El disponible es el inventario actual en todas las sucursales, no se filtra."
          >
            <TopProductsTable products={data?.topProducts ?? []} />
          </SectionCard>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="h-[340px] flex items-center justify-center text-sm text-muted-foreground">
      No hay ventas en el período y filtros seleccionados
    </div>
  );
}

function ProductCategoryBadge({ categoryId }: { categoryId: number }) {
  return (
    <Badge
      variant="outline"
      className={CATEGORY_BADGE_STYLES[categoryId] ?? ''}
    >
      {CATEGORY_LABELS[categoryId as 1 | 2 | 6 | 5] ?? categoryId}
    </Badge>
  );
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

/** Una tarjeta por producto — reemplaza la tabla en mobile, donde 7 columnas
 * no caben sin scroll horizontal o texto ilegible. */
function ProductCard({ product }: { product: UtilityByProduct }) {
  return (
    <div className="rounded-lg border p-3 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium truncate">{product.name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {product.sku}
            {product.brand ? ` · ${product.brand}` : ''}
          </p>
        </div>
        <ProductCategoryBadge categoryId={product.categoryId} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        <Metric label="Cant. vendida" value={product.unitsSold} />
        <Metric label="Disponible" value={product.availableQuantity} />
        <Metric label="Ventas" value={formatCurrency(product.revenue)} />
        <Metric label="Costo" value={formatCurrency(product.cogs)} />
        <Metric
          label="Margen"
          value={`${marginPct(product.utility, product.revenue).toFixed(1)}%`}
        />
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <span className="text-xs text-muted-foreground">Utilidad</span>
        <span className="font-semibold tabular-nums text-emerald-700">
          {formatCurrency(product.utility)}
        </span>
      </div>
    </div>
  );
}

function TopProductsTable({ products }: { products: UtilityByProduct[] }) {
  const isMobile = useIsMobile();

  if (products.length === 0) {
    return <EmptyState />;
  }

  if (isMobile) {
    return (
      <div className="space-y-3">
        {products.map((product) => (
          <ProductCard key={product.productId} product={product} />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead>Producto</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-right">Cant. vendida</TableHead>
            <TableHead className="text-right">Disponible</TableHead>
            <TableHead className="text-right">Ventas</TableHead>
            <TableHead className="text-right">Costo</TableHead>
            <TableHead className="text-right">Utilidad</TableHead>
            <TableHead className="text-right">Margen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.productId}>
              <TableCell>
                <div className="font-medium">{product.name}</div>
                <div className="text-xs text-muted-foreground">
                  {product.sku}
                  {product.brand ? ` · ${product.brand}` : ''}
                </div>
              </TableCell>
              <TableCell>
                <ProductCategoryBadge categoryId={product.categoryId} />
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {product.unitsSold}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {product.availableQuantity}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(product.revenue)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatCurrency(product.cogs)}
              </TableCell>
              <TableCell className="text-right tabular-nums font-medium text-emerald-700">
                {formatCurrency(product.utility)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {marginPct(product.utility, product.revenue).toFixed(1)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
