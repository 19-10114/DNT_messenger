import { ARRANCA_REQUESTS } from '@/constants/routes';
import { ManagerDashboardArranca } from '@/services/dashboard/types';
import { formatCount } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Solicitudes de motos de Arranca: pedidas, despachadas y abiertas. */
export function ArrancaCard({
  arranca,
}: {
  arranca: ManagerDashboardArranca | null;
}) {
  return (
    <DashboardCard
      title="Arranca"
      href={ARRANCA_REQUESTS}
      unavailable={!arranca}
    >
      {arranca && (
        <div className="grid grid-cols-3 gap-3">
          <Stat
            label="Solicitadas"
            value={formatCount(arranca.requestedUnits)}
            hint={`${formatCount(arranca.requests)} ${arranca.requests === 1 ? 'solicitud' : 'solicitudes'}`}
          />
          <Stat
            label="Despachadas"
            value={formatCount(arranca.deliveredUnits)}
          />
          <Stat
            label="Abiertas"
            value={formatCount(arranca.openRequests)}
            hint={`faltan ${formatCount(arranca.openRemainingUnits)} · ahora`}
          />
        </div>
      )}
    </DashboardCard>
  );
}
