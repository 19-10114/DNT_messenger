'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import type {
  PartInventorySummary,
  PartModelSummary,
  PartSkuSummary,
} from '@/services/products/types';
import { formatUnits, formatValue, modelLabel } from './inventorySummary.utils';

const SKU_PAGE_SIZE = 20;

export type PartBreakdownTab = 'sku' | 'model';

interface PartInventoryBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: PartInventorySummary | undefined;
  /** Columnas de valor: solo super admin. */
  showValue: boolean;
  /** Pestaña con la que se abre. */
  initialTab: PartBreakdownTab;
}

/**
 * Desglose del KPI de repuestos: por SKU (con buscador) y por modelo de moto.
 * La lista por SKU llega completa del backend (solo lo que tiene stock), así
 * que la búsqueda y la paginación son locales.
 */
export function PartInventoryBreakdownModal({
  isOpen,
  onClose,
  summary,
  showValue,
  initialTab,
}: PartInventoryBreakdownModalProps) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const bySku = useMemo(() => summary?.bySku ?? [], [summary]);
  const byModel = summary?.byModel ?? [];

  const filteredSku = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return bySku;
    return bySku.filter((row) =>
      [row.sku, row.name, row.model].some((field) =>
        (field ?? '').toLowerCase().includes(term)
      )
    );
  }, [bySku, search]);

  const totalPages = Math.max(1, Math.ceil(filteredSku.length / SKU_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const skuPage = filteredSku.slice(
    (currentPage - 1) * SKU_PAGE_SIZE,
    currentPage * SKU_PAGE_SIZE
  );

  const skuColumns: GenericTableColumn<PartSkuSummary>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'name', header: 'Nombre del producto' },
    { key: 'model', header: 'Modelo', render: (row) => modelLabel(row.model) },
    {
      key: 'units',
      header: 'Unidades',
      align: 'center',
      render: (row) => formatUnits(row.units),
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      hidden: !showValue,
      render: (row) => formatValue(row.value),
    },
  ];

  const modelColumns: GenericTableColumn<PartModelSummary>[] = [
    {
      key: 'model',
      header: 'Modelo',
      render: (row) => modelLabel(row.model),
      footer: 'Total',
    },
    {
      key: 'skuCount',
      header: 'Cantidad SKU',
      align: 'center',
      render: (row) => formatUnits(row.skuCount),
      footer: formatUnits(summary?.skuCount ?? 0),
    },
    {
      key: 'units',
      header: 'Unidades',
      align: 'center',
      render: (row) => formatUnits(row.units),
      footer: formatUnits(summary?.totalUnits ?? 0),
    },
    {
      key: 'value',
      header: 'Valor',
      align: 'right',
      hidden: !showValue,
      render: (row) => formatValue(row.value),
      footer: formatValue(summary?.totalValue),
    },
  ];

  const skuExport = filteredSku.map((row) => ({
    SKU: row.sku,
    'Nombre del producto': row.name,
    Modelo: modelLabel(row.model),
    Unidades: row.units,
    ...(showValue && { Valor: row.value ?? 0 }),
  }));

  const modelExport = byModel.map((row) => ({
    Modelo: modelLabel(row.model),
    'Cantidad SKU': row.skuCount,
    Unidades: row.units,
    ...(showValue && { Valor: row.value ?? 0 }),
  }));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent width="min(1040px, 95vw)" maxHeight="90vh">
        <DialogHeader>
          <DialogTitle>Repuestos disponibles</DialogTitle>
          <DialogDescription>
            {formatUnits(summary?.skuCount ?? 0)} SKU ·{' '}
            {formatUnits(summary?.totalUnits ?? 0)} unidades
            {showValue && ` · ${formatValue(summary?.totalValue)} a costo`}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={initialTab}>
          <TabsList>
            <TabsTrigger value="sku">Por SKU</TabsTrigger>
            <TabsTrigger value="model">Por modelo</TabsTrigger>
          </TabsList>

          <TabsContent value="sku">
            <GenericTable
              columns={skuColumns}
              data={skuPage}
              density="compact"
              maxHeight="50vh"
              emptyMessage={
                search
                  ? 'Ningún repuesto coincide'
                  : 'No hay repuestos en stock'
              }
              toolbar={
                <div className="flex items-center gap-2">
                  <SearchInput
                    placeholder="Buscar por SKU, nombre o modelo"
                    debounceMs={250}
                    onSearch={(term) => {
                      setSearch(term);
                      setPage(1);
                    }}
                  />
                  <ExportButton
                    data={skuExport}
                    title="Exportar"
                    fileName="repuestos-por-sku"
                  />
                </div>
              }
              pagination={{
                currentPage,
                totalPages,
                onPageChange: setPage,
                totalElements: filteredSku.length,
                pageSize: SKU_PAGE_SIZE,
              }}
            />
          </TabsContent>

          <TabsContent value="model">
            <GenericTable
              columns={modelColumns}
              data={byModel}
              getRowKey={(row) => row.model || '__sin_modelo__'}
              density="compact"
              maxHeight="55vh"
              emptyMessage="No hay repuestos en stock"
              toolbar={
                <ExportButton
                  data={modelExport}
                  title="Exportar"
                  fileName="repuestos-por-modelo"
                />
              }
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
