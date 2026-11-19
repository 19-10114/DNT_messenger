import Link from 'next/link';

import { ARRANCA_MC_REPORT, GPS } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { ManagerDashboardPending } from '@/services/dashboard/types';
import { formatCount, formatUsd } from '../managerHome.utils';
import { DashboardCard } from './DashboardCard.component';

interface PendingRowProps {
  href: string;
  label: string;
  count: number;
  detail?: string;
}

function PendingRow({ href, label, count, detail }: PendingRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50"
    >
      <span className="text-gray-700">{label}</span>
      <span className="flex items-center gap-2">
        {detail && <span className="text-xs text-gray-500">{detail}</span>}
        <span
          className={cn(
            'min-w-[2rem] rounded-full px-2 py-0.5 text-center text-xs font-semibold tabular-nums',
            count > 0
              ? 'bg-amber-100 text-amber-800'
              : 'bg-gray-100 text-gray-500'
          )}
        >
          {formatCount(count)}
        </span>
      </span>
    </Link>
  );
}

/** Lo que espera una decisión de la sucursal ahora mismo. */
export function PendingCard({
  pending,
}: {
  pending: ManagerDashboardPending | null;
}) {
  return (
    <DashboardCard
      className="xl:col-span-2"
      title="Casos pendientes"
      snapshot
      unavailable={!pending}
    >
      {pending && (
        <div className="-mx-2 space-y-0.5">
          <PendingRow
            href={GPS}
            label="GPS por aceptar"
            count={pending.gpsTransfers}
          />
          <PendingRow
            href={GPS}
            label="GPS de Arranca sin instalar"
            count={pending.gpsWaiting}
          />
          <PendingRow
            href={ARRANCA_MC_REPORT}
            label="Cierres de caja por decidir"
            count={pending.cashCloses.count}
            detail={
              pending.cashCloses.count > 0
                ? formatUsd(pending.cashCloses.usd)
                : undefined
            }
          />
        </div>
      )}
    </DashboardCard>
  );
}
