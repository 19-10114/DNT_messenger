import { APPROVALS_PENDING } from '@/constants/routes';
import { ManagerDashboardQuotas } from '@/services/dashboard/types';
import { formatCount } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Cupos Empire: motos aprobadas que faltan por llegar. */
export function QuotasCard({
  quotas,
}: {
  quotas: ManagerDashboardQuotas | null;
}) {
  return (
    <DashboardCard
      className="xl:col-span-2"
      title="Cupos Empire"
      href={APPROVALS_PENDING}
      snapshot
      unavailable={!quotas}
    >
      {quotas && (
        <div className="space-y-3">
          <Stat
            label="Motos por llegar"
            value={formatCount(quotas.pendingUnits)}
            emphasis
          />
          {quotas.byModel.length > 0 && (
            <ul className="space-y-1">
              {quotas.byModel.map((row) => (
                <li
                  key={row.productId}
                  className="flex justify-between gap-2 text-xs"
                >
                  <span className="truncate text-gray-700">{row.model}</span>
                  <span className="tabular-nums text-gray-600">
                    {formatCount(row.remaining)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
