import Link from 'next/link';

import { SALES_TARGETS_REPORT } from '@/constants/routes';
import { cn } from '@/lib/utils';
import {
  STATUS_CLASSES,
  formatPct,
} from '@/components/salesTargets/salesTargets.utils';
import { ManagerDashboardTargets } from '@/services/dashboard/types';
import { formatCount } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Meta de motos del mes en curso, con corte hoy. */
export function TargetsCard({
  targets,
  failed,
}: {
  targets: ManagerDashboardTargets | null;
  /** El bloque falló (distinto de "no hay meta"). */
  failed: boolean;
}) {
  const progress = Math.min(targets?.progressPct ?? 0, 100);

  return (
    <DashboardCard
      title={targets ? `Metas · ${targets.monthLabel}` : 'Metas'}
      href={SALES_TARGETS_REPORT}
      unavailable={failed}
    >
      {!targets ? (
        <p className="text-sm text-gray-500">
          No hay meta configurada para este mes.{' '}
          <Link
            href={SALES_TARGETS_REPORT}
            className="text-primary hover:underline"
          >
            Configurar
          </Link>
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end justify-between gap-3">
            <Stat
              label="Vendidas / meta"
              value={`${formatCount(targets.soldUnits)} / ${formatCount(targets.targetUnits)}`}
              emphasis
            />
            {targets.status && (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-xs font-semibold',
                  STATUS_CLASSES[targets.status].chip
                )}
              >
                {formatPct(targets.compliancePct)} a la fecha
              </span>
            )}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            Proyección de cierre: {formatCount(targets.projectedUnits)} motos
          </p>
          {targets.branches && targets.branches.length > 0 && (
            <ul className="space-y-1 border-t border-gray-100 pt-2">
              {targets.branches.map((branch) => (
                <li
                  key={branch.branchId}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-gray-700">{branch.name}</span>
                  <span className="flex items-center gap-2 tabular-nums">
                    <span className="text-gray-500">
                      {formatCount(branch.soldUnits)}/
                      {formatCount(branch.targetUnits)}
                    </span>
                    {branch.status && (
                      <span
                        className={cn(
                          'rounded-full px-1.5 py-0.5 font-semibold',
                          STATUS_CLASSES[branch.status].chip
                        )}
                      >
                        {formatPct(branch.compliancePct)}
                      </span>
                    )}
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
