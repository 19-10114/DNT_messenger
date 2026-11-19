'use client';

import { useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import { HomeGreeting } from '@/components/dashBoard/HomeGreeting.component';
import { Button } from '@/components/ui/button.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { useManagerDashboard } from '@/hooks/dashboard';
import { useIsSuperAdmin, useUser } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { ArrancaCard } from './cards/ArrancaCard.component';
import { BikesCard } from './cards/BikesCard.component';
import { CashCard } from './cards/CashCard.component';
import { DashboardCardSkeleton } from './cards/DashboardCard.component';
import { PartsCard } from './cards/PartsCard.component';
import { PayrollCard } from './cards/PayrollCard.component';
import { PendingCard } from './cards/PendingCard.component';
import { QuotasCard } from './cards/QuotasCard.component';
import { TargetsCard } from './cards/TargetsCard.component';
import { TransfersCard } from './cards/TransfersCard.component';
import { UsedBikesCard } from './cards/UsedBikesCard.component';
import { WorkshopCard } from './cards/WorkshopCard.component';
import { currentWeek, dashboardErrorMessage } from './managerHome.utils';

/**
 * Inicio de gerencia ("Área para Gerente"): los bloques de la pizarra en una
 * sola petición, filtrados por sucursal y rango (semana en curso por
 * defecto). Super Admin elige la sucursal en la barra (`0` = todas); gerente y
 * administrador ven siempre la suya.
 */
export function ManagerHome() {
  const user = useUser();
  const isSuperAdmin = useIsSuperAdmin();
  const currentBranchId = useCurrentBranchId();
  const branchId = isSuperAdmin
    ? (currentBranchId ?? 0)
    : (user?.branch?.id ?? currentBranchId ?? 0);

  const [range, setRange] = useState(currentWeek);

  const {
    managerDashboard: data,
    isLoadingManagerDashboard,
    isErrorManagerDashboard,
    managerDashboardError,
    isFetchingManagerDashboard,
    refreshManagerDashboard,
  } = useManagerDashboard({ branchId, ...range });

  const failed = (block: string) =>
    !!data?.warnings.some((warning) => warning.startsWith(`${block}:`));

  return (
    <section>
      <HomeGreeting />

      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-neutral-950">
            Resumen de gerencia
          </h2>
          <p className="text-sm text-gray-500">
            {branchId === 0
              ? 'Todas las sucursales'
              : (data?.branch?.name ?? 'Sucursal')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterDate
            initialPreset="7D"
            yearly={false}
            clean={false}
            onChange={(start, finish) => {
              if (start && finish) setRange({ start, finish });
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshManagerDashboard()}
            disabled={isFetchingManagerDashboard}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isFetchingManagerDashboard ? 'animate-spin' : ''}`}
            />
            Actualizar
          </Button>
        </div>
      </div>

      {isErrorManagerDashboard && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {dashboardErrorMessage(managerDashboardError)}
        </div>
      )}
      {data && data.warnings.length > 0 && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Algunos bloques no se pudieron calcular. Prueba con “Actualizar”.
        </div>
      )}

      {isLoadingManagerDashboard && !data ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <DashboardCardSkeleton
              key={index}
              className={index < 2 ? 'md:col-span-2' : undefined}
            />
          ))}
        </div>
      ) : data ? (
        <div
          className={`grid grid-cols-1 gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-4 ${isFetchingManagerDashboard ? 'opacity-70' : ''}`}
        >
          <PartsCard parts={data.parts} />
          <WorkshopCard workshop={data.workshop} />
          <BikesCard bikes={data.bikes} />
          <UsedBikesCard usedBikes={data.usedBikes} />
          <TargetsCard targets={data.targets} failed={failed('targets')} />
          <CashCard branchId={branchId} />
          <ArrancaCard arranca={data.arranca} />
          <TransfersCard transfers={data.transfers} />
          <PendingCard pending={data.pending} />
          <PayrollCard payroll={data.payroll} />
          <QuotasCard quotas={data.quotas} />
        </div>
      ) : null}
    </section>
  );
}
