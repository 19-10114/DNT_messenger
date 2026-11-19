'use client';

import { useMemo } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const caracasMonth = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Caracas',
  year: 'numeric',
  month: '2-digit',
});

/** El mes en curso en Caracas, como `YYYY-MM`. */
export const currentMonthInCaracas = () =>
  caracasMonth.format(new Date()).slice(0, 7);

/** `2026-10` → "Octubre 2026". */
export const monthLabel = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${year}`;
};

/** `2026-10` desplazado `delta` meses. */
export const shiftMonth = (value: string, delta: number) => {
  const [year, month] = value.split('-').map(Number);
  const index = year * 12 + (month - 1) + delta;
  const shiftedYear = Math.floor(index / 12);
  const shiftedMonth = (index % 12) + 1;
  return `${shiftedYear}-${String(shiftedMonth).padStart(2, '0')}`;
};

interface MonthSelectProps {
  /** `YYYY-MM` */
  value: string;
  onValueChange: (value: string) => void;
  /** Meses anteriores al actual que se ofrecen. */
  pastMonths?: number;
  /** Meses posteriores al actual (para cargar metas por adelantado). */
  futureMonths?: number;
  disabled?: boolean;
  className?: string;
}

/** Selector de mes: del más reciente al más antiguo, en Caracas. */
export function MonthSelect({
  value,
  onValueChange,
  pastMonths = 12,
  futureMonths = 1,
  disabled,
  className,
}: MonthSelectProps) {
  const options = useMemo(() => {
    const current = currentMonthInCaracas();
    const months: string[] = [];
    for (let delta = futureMonths; delta >= -pastMonths; delta -= 1) {
      months.push(shiftMonth(current, delta));
    }
    if (!months.includes(value)) months.push(value);
    return months;
  }, [futureMonths, pastMonths, value]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)} aria-label="Mes">
        <SelectValue placeholder="Mes" />
      </SelectTrigger>
      <SelectContent>
        {options.map((month) => (
          <SelectItem key={month} value={month}>
            {monthLabel(month)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
