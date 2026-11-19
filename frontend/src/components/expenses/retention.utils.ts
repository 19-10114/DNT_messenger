import { format } from 'date-fns';

/**
 * La quincena en curso (1–15 o 16–hoy) en `YYYY-MM-DD`: el rango con que
 * arranca la página Retenciones, igual al preset 15D de `FilterDate`.
 */
export function currentFortnight(today = new Date()): {
  startDate: string;
  endDate: string;
} {
  const start = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate() <= 15 ? 1 : 16
  );
  return {
    startDate: format(start, 'yyyy-MM-dd'),
    endDate: format(today, 'yyyy-MM-dd'),
  };
}
