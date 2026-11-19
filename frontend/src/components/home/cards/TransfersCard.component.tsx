import { TRANSACTIONS_BRANCH_SALE } from '@/constants/routes';
import { ManagerDashboardTransfers } from '@/services/dashboard/types';
import { formatCount, formatUsd } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Movimientos de inventario entre sucursales de Moto Candela. */
export function TransfersCard({
  transfers,
}: {
  transfers: ManagerDashboardTransfers | null;
}) {
  return (
    <DashboardCard
      title="Transferencias internas"
      href={TRANSACTIONS_BRANCH_SALE}
      unavailable={!transfers}
    >
      {transfers && (
        <div className="grid grid-cols-2 gap-3">
          <Stat
            label="Enviadas"
            value={formatCount(transfers.sent.lines)}
            hint={`${formatCount(transfers.sent.units)} u · ${formatUsd(transfers.sent.usd)}`}
          />
          <Stat
            label="Recibidas"
            value={formatCount(transfers.received.lines)}
            hint={`${formatCount(transfers.received.units)} u · ${formatUsd(transfers.received.usd)}`}
          />
        </div>
      )}
    </DashboardCard>
  );
}
