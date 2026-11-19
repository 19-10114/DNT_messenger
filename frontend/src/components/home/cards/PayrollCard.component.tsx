import { EXPENSES } from '@/constants/routes';
import { ManagerDashboardPayroll } from '@/services/dashboard/types';
import { formatUsd } from '../managerHome.utils';
import { DashboardCard, Stat } from './DashboardCard.component';

/** Nómina: gastos de personal del período (grupo contable 6111). */
export function PayrollCard({
  payroll,
}: {
  payroll: ManagerDashboardPayroll | null;
}) {
  return (
    <DashboardCard
      className="xl:col-span-2"
      title="Nómina"
      href={EXPENSES}
      unavailable={!payroll}
    >
      {payroll && (
        <div className="space-y-3">
          <Stat
            label="Gastos de personal"
            value={formatUsd(payroll.totalUsd)}
            emphasis
          />
          {payroll.byAccount.length > 0 ? (
            <ul className="space-y-1">
              {payroll.byAccount.map((row) => (
                <li
                  key={row.code}
                  className="flex justify-between gap-2 text-xs"
                >
                  <span className="truncate text-gray-700">{row.name}</span>
                  <span className="tabular-nums text-gray-600">
                    {formatUsd(row.usd)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">
              Sin sueldos ni bonos registrados en el período.
            </p>
          )}
        </div>
      )}
    </DashboardCard>
  );
}
