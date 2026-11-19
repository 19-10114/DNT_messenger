'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card.component';
import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import FilterDropdown from '@/components/ui/filterDropdown.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useCurrentBranchId, useBranches } from '@/stores/branch/branch.store';
import { useProcurementAnalysis } from '@/hooks/useProcurementAnalysis';
import { useProductBranchBreakdown } from '@/hooks/useProductBranchBreakdown';
import {
  ProcurementRow,
  ProcurementTier,
  ProcurementKpis,
  AbcClass,
} from '@/services/purchases/types/ProcurementAnalysis.type';

const TIER_META: Record<
  ProcurementTier,
  { label: string; icon: React.ReactNode; dot: string }
> = {
  urgente: {
    label: 'Urgente',
    icon: <AlertTriangle className="h-4 w-4 text-red-700" />,
    dot: 'bg-red-600',
  },
  pronto: {
    label: 'Pronto',
    icon: <Clock className="h-4 w-4 text-amber-700" />,
    dot: 'bg-amber-500',
  },
  ok: {
    label: 'OK',
    icon: <CheckCircle2 className="h-4 w-4 text-slate-500" />,
    dot: 'bg-slate-300',
  },
};

const ABC_STYLES: Record<string, string> = {
  A: 'bg-blue-50 text-blue-700 border-blue-200',
  B: 'bg-slate-50 text-slate-700 border-slate-200',
  C: 'bg-slate-50 text-slate-500 border-slate-200',
};

const TIER_OPTIONS = (['urgente', 'pronto', 'ok'] as ProcurementTier[]).map(
  (t) => ({ value: t, label: TIER_META[t].label })
);
const ABC_OPTIONS = (['A', 'B', 'C'] as AbcClass[]).map((a) => ({
  value: a,
  label: a,
}));

function ProductCell({
  row,
  onOpenDetail,
}: {
  row: ProcurementRow;
  onOpenDetail: (row: ProcurementRow) => void;
}) {
  return (
    <div className="min-w-0 max-w-[260px]">
      <button
        type="button"
        onClick={() => onOpenDetail(row)}
        className="font-medium truncate block w-full text-left hover:text-primary hover:underline"
        title={row.name}
      >
        {row.name}
      </button>
      <p className="text-xs text-muted-foreground truncate">
        {row.sku} · {row.model}
      </p>
    </div>
  );
}

function AbcXyzBadge({ abc, xyz }: { abc: string; xyz: string }) {
  return (
    <Badge variant="outline" className={ABC_STYLES[abc] ?? ''}>
      {abc}
      {xyz}
    </Badge>
  );
}

function TierBadge({ tier }: { tier: ProcurementTier }) {
  const meta = TIER_META[tier];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className={`inline-block h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

/** Global y local nunca se muestran uno en lugar del otro — ver ARCHITECTURE.md. */
function AbcXyzCell({ row }: { row: ProcurementRow }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase text-muted-foreground w-10 shrink-0">
          Global
        </span>
        <AbcXyzBadge abc={row.abc} xyz={row.xyz} />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase text-muted-foreground w-10 shrink-0">
          Aquí
        </span>
        <AbcXyzBadge abc={row.abcLocal} xyz={row.xyzLocal} />
      </div>
    </div>
  );
}

function RotationKpiStrip({ kpis }: { kpis: ProcurementKpis | undefined }) {
  if (!kpis) return null;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {(['A', 'B', 'C'] as AbcClass[]).map((abc) => {
        const kpi = kpis[abc];
        const pct = kpi.total > 0 ? (kpi.stockout / kpi.total) * 100 : 0;
        return (
          <Card key={abc}>
            <CardContent className="p-5 flex items-center gap-4">
              <Badge
                variant="outline"
                className={`h-10 w-10 rounded-full flex items-center justify-center text-base ${ABC_STYLES[abc]}`}
              >
                {abc}
              </Badge>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">
                  {kpi.total.toLocaleString()} repuestos
                </p>
                <p className="font-medium">
                  {kpi.stockout.toLocaleString()} en quiebre ({pct.toFixed(0)}
                  %)
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

const CATALOG_PAGE_SIZE = 25;

type SortKey =
  | 'name'
  | 'stockActual'
  | 'stockGlobal'
  | 'demandaDiariaPropia'
  | 'demandaDiariaGlobal'
  | 'lastSaleDate'
  | 'diasCobertura'
  | 'reorderPoint'
  | 'suggestedQty';
type SortDir = 'asc' | 'desc';

function SortableHead({
  label,
  sortKey,
  active,
  dir,
  onSort,
  align = 'left',
}: {
  label: string;
  sortKey: SortKey;
  active: SortKey | null;
  dir: SortDir;
  onSort: (key: SortKey) => void;
  align?: 'left' | 'right';
}) {
  const isActive = active === sortKey;
  return (
    <TableHead
      className={`cursor-pointer select-none ${align === 'right' ? 'text-right' : ''}`}
      onClick={() => onSort(sortKey)}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {isActive ? (
          dir === 'asc' ? (
            <ChevronUp className="h-3 w-3" />
          ) : (
            <ChevronDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-30" />
        )}
      </span>
    </TableHead>
  );
}

function RowCard({
  row,
  onOpenDetail,
}: {
  row: ProcurementRow;
  onOpenDetail: (row: ProcurementRow) => void;
}) {
  return (
    <div className="rounded-lg border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <ProductCell row={row} onOpenDetail={onOpenDetail} />
        <TierBadge tier={row.tier} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        <div>
          <p className="text-xs text-muted-foreground">Stock (aquí / global)</p>
          <p className="font-medium tabular-nums">
            {row.stockActual} / {row.stockGlobal}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Días de cobertura</p>
          <p className="font-medium tabular-nums">{row.diasCobertura ?? '—'}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            Venta/día (aquí / global)
          </p>
          <p className="font-medium tabular-nums">
            {row.demandaDiariaPropia.toFixed(3)} /{' '}
            {row.demandaDiariaGlobal.toFixed(3)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Sugerido pedir</p>
          <p className="font-medium tabular-nums">{row.suggestedQty}</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Última venta</p>
          <p className="font-medium tabular-nums">
            {row.lastSaleDate ? formatDate(row.lastSaleDate) : 'Nunca'}
          </p>
        </div>
      </div>
      <div className="pt-1 border-t">
        <AbcXyzCell row={row} />
      </div>
    </div>
  );
}

/**
 * Una sola tabla, filtrable y ordenable — reemplaza las secciones fijas que
 * escondían el resto del catálogo. `tier` incluye 'ok' como valor real, así
 * que por defecto se oculta (evita mostrar de una vez cientos/miles de filas
 * sin acción pendiente) pero se puede activar.
 */
function ProcurementCatalogTable({
  rows,
  onOpenDetail,
}: {
  rows: ProcurementRow[];
  onOpenDetail: (row: ProcurementRow) => void;
}) {
  const isMobile = useIsMobile();
  const [selectedTiers, setSelectedTiers] = useState<string[]>([
    'urgente',
    'pronto',
  ]);
  const [selectedAbc, setSelectedAbc] = useState<string[]>(['A', 'B', 'C']);
  const [showTierDropdown, setShowTierDropdown] = useState(false);
  const [showAbcDropdown, setShowAbcDropdown] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredRows = useMemo(() => {
    let result = rows.filter(
      (r) => selectedTiers.includes(r.tier) && selectedAbc.includes(r.abc)
    );
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp: number;
        if (sortKey === 'lastSaleDate') {
          // ISO strings sort chronologically as plain strings; null ("nunca
          // se vendió") goes to '' so it sorts before any real date.
          cmp = (a.lastSaleDate ?? '').localeCompare(b.lastSaleDate ?? '');
        } else {
          const av = a[sortKey];
          const bv = b[sortKey];
          cmp =
            typeof av === 'string'
              ? av.localeCompare(bv as string)
              : (av as number) - (bv as number);
        }
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [rows, selectedTiers, selectedAbc, sortKey, sortDir]);

  // Volver a la página 1 cada vez que cambian los filtros/orden/dataset —
  // si no, se puede quedar "atascado" en una página que ya no existe.
  useEffect(() => {
    setPage(1);
  }, [selectedTiers, selectedAbc, sortKey, sortDir, rows]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / CATALOG_PAGE_SIZE)
  );
  const pageRows = useMemo(
    () =>
      filteredRows.slice(
        (page - 1) * CATALOG_PAGE_SIZE,
        page * CATALOG_PAGE_SIZE
      ),
    [filteredRows, page]
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold tracking-tight">
              Catálogo de repuestos
            </h3>
            <p className="text-sm text-muted-foreground">
              {filteredRows.length === 0
                ? `Mostrando 0 de ${rows.length.toLocaleString()}`
                : `Mostrando ${((page - 1) * CATALOG_PAGE_SIZE + 1).toLocaleString()}-${Math.min(page * CATALOG_PAGE_SIZE, filteredRows.length).toLocaleString()} de ${filteredRows.length.toLocaleString()} (${rows.length.toLocaleString()} en total)`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-40">
              <FilterDropdown
                label="Estado"
                options={TIER_OPTIONS}
                selectedValues={selectedTiers}
                onToggle={(value) =>
                  setSelectedTiers((prev) =>
                    prev.includes(value)
                      ? prev.filter((v) => v !== value)
                      : [...prev, value]
                  )
                }
                showDropdown={showTierDropdown}
                setShowDropdown={setShowTierDropdown}
                onSelectAll={() =>
                  setSelectedTiers(TIER_OPTIONS.map((o) => o.value))
                }
                onClearAll={() => setSelectedTiers([])}
              />
            </div>
            <div className="w-32">
              <FilterDropdown
                label="ABC"
                options={ABC_OPTIONS}
                selectedValues={selectedAbc}
                onToggle={(value) =>
                  setSelectedAbc((prev) =>
                    prev.includes(value)
                      ? prev.filter((v) => v !== value)
                      : [...prev, value]
                  )
                }
                showDropdown={showAbcDropdown}
                setShowDropdown={setShowAbcDropdown}
                onSelectAll={() =>
                  setSelectedAbc(ABC_OPTIONS.map((o) => o.value))
                }
                onClearAll={() => setSelectedAbc([])}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredRows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nada con estos filtros.
          </p>
        ) : isMobile ? (
          <div className="space-y-3">
            {pageRows.map((row) => (
              <RowCard
                key={row.productId}
                row={row}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <SortableHead
                    label="Producto"
                    sortKey="name"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHead
                    label="Stock aquí"
                    sortKey="stockActual"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Stock global"
                    sortKey="stockGlobal"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Venta/día aquí"
                    sortKey="demandaDiariaPropia"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Venta/día global"
                    sortKey="demandaDiariaGlobal"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Última venta"
                    sortKey="lastSaleDate"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Días cobertura"
                    sortKey="diasCobertura"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <SortableHead
                    label="Sugerido pedir"
                    sortKey="suggestedQty"
                    active={sortKey}
                    dir={sortDir}
                    onSort={handleSort}
                    align="right"
                  />
                  <TableHead>Rotación (global/aquí)</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageRows.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <ProductCell row={row} onOpenDetail={onOpenDetail} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stockActual}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stockGlobal}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.demandaDiariaPropia.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.demandaDiariaGlobal.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.lastSaleDate
                        ? formatDate(row.lastSaleDate)
                        : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.diasCobertura ?? '—'}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {row.suggestedQty}
                    </TableCell>
                    <TableCell>
                      <AbcXyzCell row={row} />
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={row.tier} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        {filteredRows.length > 0 && totalPages > 1 && (
          <PaginationComponent
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </CardContent>
    </Card>
  );
}

/** "Si tuviera que pedir hoy": las mismas filas, filtradas a suggestedQty > 0. */
function SuggestedOrderTable({
  rows,
  onOpenDetail,
}: {
  rows: ProcurementRow[];
  onOpenDetail: (row: ProcurementRow) => void;
}) {
  const toOrder = useMemo(
    () =>
      rows
        .filter((r) => r.suggestedQty > 0)
        .sort((a, b) => b.estimatedCost - a.estimatedCost),
    [rows]
  );
  const total = useMemo(
    () => toOrder.reduce((sum, r) => sum + r.estimatedCost, 0),
    [toOrder]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <h3 className="text-lg font-semibold tracking-tight">
          Pedido sugerido hoy
        </h3>
        <p className="text-sm text-muted-foreground">
          {toOrder.length} líneas · total estimado {formatCurrency(total)}
        </p>
      </CardHeader>
      <CardContent>
        {toOrder.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No hay nada que pedir hoy.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock actual</TableHead>
                  <TableHead className="text-right">Sugerido pedir</TableHead>
                  <TableHead className="text-right">Costo unit.</TableHead>
                  <TableHead className="text-right">Total estimado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toOrder.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <ProductCell row={row} onOpenDetail={onOpenDetail} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stockActual}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {row.suggestedQty}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatCurrency(row.unitCost)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatCurrency(row.estimatedCost)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * "Ver detalle": desglose por sucursal de un repuesto, disparado al hacer
 * click en el nombre del producto (ver ProductCell). Usa
 * useProductBranchBreakdown, que solo pide datos mientras el modal está
 * abierto.
 */
function ProductBranchDetailModal({
  product,
  open,
  onOpenChange,
}: {
  product: ProcurementRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data, isLoading, isError } = useProductBranchBreakdown(
    product?.productId,
    open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="min(90vw, 640px)" maxHeight="80vh">
        <DialogHeader>
          <DialogTitle>{product?.name ?? 'Detalle por sucursal'}</DialogTitle>
          {product && (
            <p className="text-sm text-muted-foreground">
              {product.sku} · {product.model}
            </p>
          )}
        </DialogHeader>
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Cargando...
          </p>
        ) : isError ? (
          <p className="text-sm text-destructive py-6 text-center">
            No se pudo cargar el detalle por sucursal.
          </p>
        ) : !data || data.rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Este repuesto no tiene movimiento en ninguna sucursal.
          </p>
        ) : (
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead>Sucursal</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Venta/día</TableHead>
                  <TableHead className="text-right">Días cobertura</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.rows.map((row) => (
                  <TableRow key={row.branchId}>
                    <TableCell className="font-medium">
                      {row.branchName}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.stockActual}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.demandaDiaria.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {row.diasCobertura ?? '—'}
                    </TableCell>
                    <TableCell>
                      <TierBadge tier={row.tier} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ProcurementAnalysis() {
  const currentBranchId = useCurrentBranchId();
  const branches = useBranches();
  const branchName = branches.find((b) => b.id === currentBranchId)?.name;

  const [selectedProduct, setSelectedProduct] = useState<ProcurementRow | null>(
    null
  );
  const [modalOpen, setModalOpen] = useState(false);
  const handleOpenDetail = (row: ProcurementRow) => {
    setSelectedProduct(row);
    setModalOpen(true);
  };

  const { data, isLoading, isFetching, isError, refetch } =
    useProcurementAnalysis(currentBranchId);

  if (currentBranchId === undefined) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          Selecciona una sucursal para ver la procura de repuestos.
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 flex flex-col items-center justify-center gap-3 text-center">
          <p className="text-destructive font-medium">
            No se pudo cargar el análisis de procura.
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
      <Card>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Sucursal</p>
            <p className="font-medium">
              {currentBranchId === 0
                ? 'Todas las sucursales'
                : (branchName ?? currentBranchId)}
            </p>
            {currentBranchId === 0 && (
              <p className="text-xs text-muted-foreground">
                Agregado — stock y demanda sumados de toda la red, no una lista
                por sucursal
              </p>
            )}
          </div>
          {data && (
            <p className="text-sm text-muted-foreground">
              Ventana: {data.window.startDate} a {data.window.endDate} · lead
              time {data.window.leadTimeDays} días
            </p>
          )}
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
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center text-muted-foreground">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
            <p>Cargando análisis...</p>
          </div>
        </div>
      ) : (
        <>
          <RotationKpiStrip kpis={data?.kpis} />
          <ProcurementCatalogTable
            rows={data?.rows ?? []}
            onOpenDetail={handleOpenDetail}
          />
          <SuggestedOrderTable
            rows={data?.rows ?? []}
            onOpenDetail={handleOpenDetail}
          />
        </>
      )}

      <ProductBranchDetailModal
        product={selectedProduct}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
