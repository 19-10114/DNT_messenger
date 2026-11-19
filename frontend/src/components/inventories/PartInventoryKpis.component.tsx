'use client';

import { useState } from 'react';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { usePartInventorySummary } from '@/hooks/products';
import { useIsSuperAdmin } from '@/stores/auth/auth.store';
import {
  PartBreakdownTab,
  PartInventoryBreakdownModal,
} from './PartInventoryBreakdownModal.component';
import { formatUnits, formatValue } from './inventorySummary.utils';

/**
 * KPIs de la página de inventario de repuestos. SKU y unidades los ve
 * todo el que ve la página; el valor (costo FIFO) solo el super admin.
 */
export function PartInventoryKpis() {
  const isSuperAdmin = useIsSuperAdmin();
  const [openTab, setOpenTab] = useState<PartBreakdownTab | null>(null);
  const { partSummary, isLoadingPartSummary, isErrorPartSummary } =
    usePartInventorySummary();

  const showValue = isSuperAdmin && partSummary?.totalValue != null;

  const display = (text: string) =>
    isLoadingPartSummary ? 'Cargando...' : isErrorPartSummary ? 'Error' : text;
  const openOn = (tab: PartBreakdownTab) =>
    partSummary ? () => setOpenTab(tab) : undefined;

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isSuperAdmin && (
          <KpiCardMain
            label="Valor de repuestos disponibles"
            value={display(formatValue(partSummary?.totalValue))}
            subtitle="A costo (FIFO)"
            tone="green"
            onClick={openOn('sku')}
            actionHint="Ver por SKU y por modelo"
          />
        )}
        <KpiCardMain
          label="SKU en stock"
          value={display(formatUnits(partSummary?.skuCount ?? 0))}
          subtitle={
            partSummary
              ? `${formatUnits(partSummary.totalUnits)} unidades`
              : undefined
          }
          onClick={openOn('sku')}
          actionHint="Ver por SKU"
        />
        <KpiCardMain
          label="Modelos con repuestos"
          value={display(
            formatUnits(
              partSummary?.byModel.filter((row) => row.model).length ?? 0
            )
          )}
          subtitle="Modelos de moto con stock"
          onClick={openOn('model')}
          actionHint="Ver por modelo"
        />
      </div>

      {/* Se monta al abrir para que la pestaña inicial y el buscador arranquen limpios. */}
      {openTab && (
        <PartInventoryBreakdownModal
          isOpen
          onClose={() => setOpenTab(null)}
          summary={partSummary}
          showValue={showValue}
          initialTab={openTab}
        />
      )}
    </>
  );
}
