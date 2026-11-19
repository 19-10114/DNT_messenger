'use client';

import { BRANCH_CASH } from '@/constants/routes';
import { useBranchCash } from '@/hooks/useTransactions';
import { useToken } from '@/stores/auth/auth.store';
import { formatUsd } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Efectivo en la sucursal: el mismo dato del Inicio de siempre. */
export function CashCard({ branchId }: { branchId: number }) {
  const token = useToken() || '';
  const { data, isLoading, isError } = useBranchCash(token, String(branchId));

  return (
    <DashboardCard
      title="Efectivo en sucursal"
      href={BRANCH_CASH}
      snapshot
      unavailable={isError}
    >
      <Stat
        label={branchId === 0 ? 'Todas las sucursales' : 'En caja'}
        value={isLoading ? '…' : formatUsd(data?.cash)}
        emphasis
      />
    </DashboardCard>
  );
}
