import { cn } from '@/lib/utils';
import { SalesTargetDay } from '@/services/salesTargets/types';
import { dayOfMonth, formatInt } from './salesTargets.utils';

const WEEKDAYS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

interface TargetCalendarProps {
  days: SalesTargetDay[];
  cutoff: string;
  hasTarget: boolean;
}

/** Color de una casilla ya transcurrida: verde si llegó a la meta del día. */
function pastDayClass(day: SalesTargetDay, hasTarget: boolean) {
  if (!hasTarget || !day.working) return 'bg-gray-50';
  return (day.sold ?? 0) >= (day.dailyTarget ?? 0)
    ? 'bg-green-50'
    : 'bg-red-50';
}

/**
 * Meta día a día, de lunes a domingo. Cada casilla: el día, la meta del día,
 * la meta acumulada y lo vendido (hasta el corte). Los días no hábiles van en
 * gris con su motivo; un domingo con ventas también las muestra.
 */
export function TargetCalendar({
  days,
  cutoff,
  hasTarget,
}: TargetCalendarProps) {
  const leading = days.length ? days[0].weekday - 1 : 0;

  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[720px] grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200">
        {WEEKDAYS.map((name) => (
          <div
            key={name}
            className="bg-black py-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-white"
          >
            {name}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, index) => (
          <div key={`empty-${index}`} className="bg-white" />
        ))}
        {days.map((day) => {
          const isPast = day.date <= cutoff;
          const sold = day.sold ?? 0;
          return (
            <div
              key={day.date}
              className={cn(
                'flex min-h-[64px] flex-col justify-between p-2 text-xs',
                isPast ? pastDayClass(day, hasTarget) : 'bg-white',
                !day.working && !isPast && 'bg-gray-50'
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <span
                  className={cn(
                    'text-base font-semibold leading-none',
                    day.working ? 'text-gray-900' : 'text-gray-300'
                  )}
                >
                  {dayOfMonth(day.date)}
                </span>
                {day.working && hasTarget ? (
                  <span className="font-semibold text-secondary">
                    Meta {day.dailyTarget}
                  </span>
                ) : !day.working && day.weekday !== 7 ? (
                  <span
                    className="truncate text-right text-[11px] text-gray-400"
                    title={day.reason ?? undefined}
                  >
                    {day.reason || 'No hábil'}
                  </span>
                ) : null}
              </div>
              <div className="flex items-end justify-between gap-1">
                <span className="text-[11px] text-gray-400">
                  {day.working && hasTarget
                    ? `Acum. ${formatInt(day.cumulativeTarget)}`
                    : ''}
                </span>
                {isPast && (day.working || sold > 0) && (
                  <span
                    className={cn(
                      'font-semibold',
                      hasTarget && day.working && sold < (day.dailyTarget ?? 0)
                        ? 'text-red-600'
                        : 'text-gray-900'
                    )}
                  >
                    Vendido {sold}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
