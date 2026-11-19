'use client';

import { useState } from 'react';
import { KpiCardMain } from '@/components/tables/KpiCardMain.component';
import { useBikeInventorySummary } from '@/hooks/products';
import { useIsSuperAdmin } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { BikeInventoryBreakdownModal } from './BikeInventoryBreakdownModal.component';
import { formatUnits, formatValue } from './inventorySummary.utils';

interface BikeInventoryKpisProps {
  /** Sigue al check "usadas" de la tabla de inventario. */
  used: boolean;
}

/**
 * KPIs de la página de inventario de motos. La cantidad la ve todo el que ve
 * la página; el valor (costo) solo el super admin, igual que en el backend.
 * Las dos tarjetas abren el mismo desglose.
 */
export function BikeInventoryKpis({ used }: BikeInventoryKpisProps) {
  const isSuperAdmin = useIsSuperAdmin();
  const currentBranchId = useCurrentBranchId();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { bikeSummary, isLoadingBikeSummary, isErrorBikeSummary } =
    useBikeInventorySummary(used);

  const scopeLabel = used ? 'usadas' : 'nuevas';
  const showValue = isSuperAdmin && bikeSummary?.totalValue != null;

  const display = (text: string) =>
    isLoadingBikeSummary ? 'Cargando...' : isErrorBikeSummary ? 'Error' : text;
  const openModal = bikeSummary ? () => setIsModalOpen(true) : undefined;

  return (
    <>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCardMain
          label="Motos en inventario"
          value={display(formatUnits(bikeSummary?.totalUnits ?? 0))}
          subtitle={used ? 'Usadas' : 'Nuevas'}
          onClick={openModal}
          actionHint="Ver por modelo"
        />
        {isSuperAdmin && (
          <KpiCardMain
            label="Valor de inventario"
            value={display(formatValue(bikeSummary?.totalValue))}
            subtitle="A costo de adquisición"
            tone="green"
            onClick={openModal}
            actionHint={
              currentBranchId === 0
                ? 'Ver por modelo y por sede'
                : 'Ver por modelo'
            }
          />
        )}
      </div>

      <BikeInventoryBreakdownModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        summary={bikeSummary}
        showValue={showValue}
        showBranches={showValue && currentBranchId === 0}
        scopeLabel={scopeLabel}
      />
    </>
  );
}
