import { USED_BIKES } from '@/constants/routes';
import { ManagerDashboardUsedBikes } from '@/services/dashboard/types';
import { formatCount, formatUsd } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Compra y venta de motos usadas, y valoraciones abiertas en el período. */
export function UsedBikesCard({
  usedBikes,
}: {
  usedBikes: ManagerDashboardUsedBikes | null;
}) {
  return (
    <DashboardCard
      title="Motos usadas"
      href={USED_BIKES}
      unavailable={!usedBikes}
    >
      {usedBikes && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat
              label="Valoraciones"
              value={formatCount(usedBikes.evaluations)}
              hint={`${formatCount(usedBikes.inReview)} en curso`}
            />
            <Stat
              label="Compradas"
              value={formatCount(usedBikes.purchased)}
              hint={formatUsd(usedBikes.purchasedUsd)}
            />
            <Stat
              label="Vendidas"
              value={formatCount(usedBikes.sold)}
              hint={formatUsd(usedBikes.soldUsd)}
            />
          </div>
          <p className="text-xs text-gray-500">
            Aprobadas {formatCount(usedBikes.approved)} · Rechazadas{' '}
            {formatCount(usedBikes.rejected)}
          </p>
        </div>
      )}
    </DashboardCard>
  );
}
