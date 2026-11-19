import Link from 'next/link';

import { DELIVERY_NOTES, SALES_REPORTS } from '@/constants/routes';
import { ManagerDashboardBikes } from '@/services/dashboard/types';
import { formatCount, formatUsd } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Motos nuevas: recibidas de Empire, vendidas y preórdenes abiertas. */
export function BikesCard({ bikes }: { bikes: ManagerDashboardBikes | null }) {
  return (
    <DashboardCard title="Motos" href={SALES_REPORTS} unavailable={!bikes}>
      {bikes && (
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Recibidas"
            value={formatCount(bikes.received)}
            hint="de Empire"
          />
          <Stat
            label="Vendidas"
            value={formatCount(bikes.sold)}
            hint={formatUsd(bikes.soldUsd)}
          />
          <Link href={DELIVERY_NOTES} className="hover:opacity-80">
            <Stat
              label="Preórdenes"
              value={formatCount(bikes.openPreorders)}
              hint={`${formatCount(bikes.openPreorderUnits)} ${bikes.openPreorderUnits === 1 ? 'moto' : 'motos'} · ahora`}
            />
          </Link>
        </div>
      )}
    </DashboardCard>
  );
}
