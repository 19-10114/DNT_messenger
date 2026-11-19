'use client';

import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eraser,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * FilterDate
 * Selector de rango de fechas basado en presets (1D, 7D, 30D, 90D, 1Y, Personalizado,
 * y 15D quincenal si se activa con `fortnightly`)
 * acotado por un selector de año (2025 -> año actual).
 *
 * Retorna las fechas seleccionadas mediante onChange en formato yyyy-mm-dd.
 * Si se selecciona un solo día, startDate === endDate.
 * Cuando no hay selección (o se limpia por cambio de año) devuelve undefined en ambos.
 */

const MIN_YEAR = 2025;

const MONTHS = [
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
const MONTHS_ABBR = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];
// Índice por getDay() (0 = Domingo)
const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
// Encabezados del calendario, empezando en Lunes
const WEEKDAY_HEADERS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

// Trimestres calendario [mesInicio, mesFin]
const QUARTERS: Array<[number, number]> = [
  [0, 2],
  [3, 5],
  [6, 8],
  [9, 11],
];

export type FilterDatePresetKey =
  | '1D'
  | '7D'
  | '15D'
  | '30D'
  | '90D'
  | '1Y'
  | 'custom';
type PresetKey = FilterDatePresetKey;

const PRESETS: Array<{ key: PresetKey; label: string; hint: string }> = [
  { key: '1D', label: '1D', hint: 'Diario' },
  { key: '7D', label: '7D', hint: 'Semanal' },
  { key: '15D', label: '15D', hint: 'Quincenal' },
  { key: '30D', label: '30D', hint: 'Mensual' },
  { key: '90D', label: '90D', hint: 'Trimestral' },
  { key: '1Y', label: '1A', hint: 'Anual' },
  { key: 'custom', label: 'Personalizado', hint: 'Rango personalizado' },
];

// Helpers de fecha (todo en horario local, sin UTC)
const pad = (n: number) => String(n).padStart(2, '0');
const fmt = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fmtHuman = (d: Date) =>
  `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

interface Week {
  start: Date;
  end: Date;
}

// Semanas (Lun-Dom) desde el 1 de enero hasta hoy (o 31 dic si el año ya pasó).
// La primera semana arranca el 1 de enero aunque no sea lunes.
// La última semana termina en el rango final aunque no sea domingo.
function getWeeks(year: number, rangeEnd: Date): Week[] {
  const weeks: Week[] = [];
  let cursor = new Date(year, 0, 1);
  while (cursor <= rangeEnd) {
    const day = cursor.getDay(); // 0 dom .. 6 sáb
    const daysToSunday = day === 0 ? 0 : 7 - day;
    let end = addDays(cursor, daysToSunday);
    if (end > rangeEnd) end = rangeEnd;
    weeks.push({ start: cursor, end });
    cursor = addDays(end, 1);
  }
  return weeks;
}

interface Fortnight {
  /** "9-1" (1–15 de octubre) o "9-2" (16–fin). Mes 0-indexado. */
  key: string;
  start: Date;
  end: Date;
}

// Quincenas (1–15 y 16–fin de mes) del año hasta `rangeEnd`; la última
// termina en `rangeEnd` aunque la quincena siga en curso.
function getFortnights(year: number, rangeEnd: Date): Fortnight[] {
  const result: Fortnight[] = [];
  for (let month = 0; month < 12; month++) {
    for (const half of [1, 2]) {
      const start = new Date(year, month, half === 1 ? 1 : 16);
      if (start > rangeEnd) return result;
      let end =
        half === 1 ? new Date(year, month, 15) : new Date(year, month + 1, 0);
      if (end > rangeEnd) end = rangeEnd;
      result.push({ key: `${month}-${half}`, start, end });
    }
  }
  return result;
}

function fortnightLabel(f: Fortnight) {
  const lastDay = new Date(f.start.getFullYear(), f.start.getMonth() + 1, 0);
  const until = f.start.getDate() === 1 ? 15 : lastDay.getDate();
  return `${f.start.getDate()}–${until} ${MONTHS_ABBR[f.start.getMonth()]}`;
}

function weekLabel(w: Week) {
  const s = `${DAY_ABBR[w.start.getDay()]} ${w.start.getDate()}/${w.start.getMonth() + 1}`;
  const e = `${DAY_ABBR[w.end.getDay()]} ${w.end.getDate()}/${w.end.getMonth() + 1}`;
  return `${s} - ${e}`;
}

// Calendario
interface MiniCalendarProps {
  value: Date | null;
  onSelect: (d: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  initialMonth?: Date;
}

function MiniCalendar({
  value,
  onSelect,
  minDate,
  maxDate,
  initialMonth,
}: MiniCalendarProps) {
  const today = startOfDay(new Date());
  const [view, setView] = useState<Date>(() => {
    const base = value ?? initialMonth ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const year = view.getFullYear();
  const month = view.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIdx = (new Date(year, month, 1).getDay() + 6) % 7; // Lunes primero

  const minMonth = minDate
    ? new Date(minDate.getFullYear(), minDate.getMonth(), 1)
    : null;
  const maxMonth = maxDate
    ? new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
    : null;
  const canPrev = !minMonth || new Date(year, month, 1) > minMonth;
  const canNext = !maxMonth || new Date(year, month, 1) < maxMonth;

  const isDisabled = (d: Date) =>
    (!!minDate && d < startOfDay(minDate)) ||
    (!!maxDate && d > startOfDay(maxDate));

  const cells: Array<Date | null> = [];
  for (let i = 0; i < firstDayIdx; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  return (
    <div className="w-[248px]">
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => setView(new Date(year, month - 1, 1))}
          className="p-1 rounded-md hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-medium capitalize">
          {MONTHS[month]} {year}
        </span>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => setView(new Date(year, month + 1, 1))}
          className="p-1 rounded-md hover:bg-orange-50 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAY_HEADERS.map((w) => (
          <div
            key={w}
            className="text-center text-[0.7rem] font-medium text-muted-foreground"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const disabled = isDisabled(d);
          const selected = !!value && isSameDay(d, value);
          const isToday = isSameDay(d, today);
          return (
            <button
              key={fmt(d)}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              className={cn(
                'h-8 w-8 rounded-full text-sm flex items-center justify-center transition-colors',
                disabled && 'text-gray-300 cursor-not-allowed',
                !disabled && !selected && 'hover:bg-orange-100 text-foreground',
                selected && 'bg-secondary text-white font-semibold',
                !selected && isToday && !disabled && 'ring-1 ring-secondary/50'
              )}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Componente principal
export interface FilterDateProps {
  onChange: (startDate?: string, endDate?: string) => void;
  className?: string;
  /** Presets disponibles. Todos habilitados por defecto; pasar false para ocultar uno. */
  daily?: boolean;
  weekly?: boolean;
  monthly?: boolean;
  quarterly?: boolean;
  yearly?: boolean;
  custom?: boolean;
  /** Botón para limpiar las fechas seleccionadas. */
  clean?: boolean;
  /**
   * Preset quincenal (1–15 y 16–fin de mes). Apagado por defecto: lo
   * activan las pantallas que trabajan por quincena (Retenciones).
   */
  fortnightly?: boolean;
  /**
   * Preset aplicado al montar, con su rango por defecto (el día, la semana,
   * la quincena... en curso), que se emite por `onChange`. Sin él, empieza
   * sin fechas.
   */
  initialPreset?: FilterDatePresetKey;
}

export function FilterDate({
  onChange,
  className,
  daily = true,
  weekly = true,
  monthly = true,
  quarterly = true,
  yearly = true,
  custom = true,
  clean = true,
  fortnightly = false,
  initialPreset,
}: FilterDateProps) {
  const today = startOfDay(new Date());
  const currentYear = today.getFullYear();

  const [year, setYear] = useState<number>(currentYear);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  const [openMenu, setOpenMenu] = useState<'year' | 'preset' | null>(null);

  // Selección concreta por preset
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedFortnight, setSelectedFortnight] = useState<string | null>(
    null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null); // mes inicio del trimestre
  const [customStart, setCustomStart] = useState<Date | null>(null);
  const [customEnd, setCustomEnd] = useState<Date | null>(null);

  // Rango aplicado
  const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);

  const isCurrentYear = year === currentYear;
  const yearStart = useMemo(() => new Date(year, 0, 1), [year]);
  const yearEnd = useMemo(
    () => (isCurrentYear ? today : new Date(year, 11, 31)),
    [year, isCurrentYear, today]
  );

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = MIN_YEAR; y <= currentYear; y++) arr.push(y);
    return arr;
  }, [currentYear]);

  const weeks = useMemo(() => getWeeks(year, yearEnd), [year, yearEnd]);
  const fortnights = useMemo(
    () => getFortnights(year, yearEnd),
    [year, yearEnd]
  );
  const months = useMemo(() => {
    const last = isCurrentYear ? today.getMonth() : 11;
    return Array.from({ length: last + 1 }, (_, m) => m);
  }, [isCurrentYear, today]);
  const quarters = useMemo(
    () => QUARTERS.filter(([s]) => !isCurrentYear || s <= today.getMonth()),
    [isCurrentYear, today]
  );

  // Versiones parametrizadas por año (para calcular defaults al cambiar de año,
  // antes de que los memos anteriores se recalculen)
  const endForYear = (y: number) =>
    y === currentYear ? today : new Date(y, 11, 31);
  const quartersForYear = (y: number) =>
    QUARTERS.filter(([s]) => y !== currentYear || s <= today.getMonth());

  // Presets habilitados según props (todos visibles por defecto)
  const enabledByKey: Record<PresetKey, boolean> = {
    '1D': daily,
    '7D': weekly,
    '15D': fortnightly,
    '30D': monthly,
    '90D': quarterly,
    '1Y': yearly,
    custom,
  };
  const visiblePresets = PRESETS.filter((p) => enabledByKey[p.key]);

  // Cerrar menús al hacer click afuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    if (openMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  const emit = (s: Date, e: Date) => {
    setRange({ start: s, end: e });
    onChange(fmt(s), fmt(e));
  };

  const clearSubSelections = () => {
    setSelectedDay(null);
    setSelectedWeek(null);
    setSelectedFortnight(null);
    setSelectedMonth(null);
    setSelectedQuarter(null);
    setCustomStart(null);
    setCustomEnd(null);
  };

  const clampEnd = (e: Date) => (e > yearEnd ? yearEnd : e);

  // Handlers de selección
  const selectDay = (d: Date) => {
    setSelectedDay(d);
    emit(d, d);
    setOpenMenu(null);
  };

  const selectWeek = (i: number) => {
    const w = weeks[i];
    setSelectedWeek(i);
    emit(w.start, w.end);
    setOpenMenu(null);
  };

  const selectFortnight = (f: Fortnight) => {
    setSelectedFortnight(f.key);
    emit(f.start, f.end);
    setOpenMenu(null);
  };

  const selectMonth = (m: number) => {
    const s = new Date(year, m, 1);
    const e = clampEnd(new Date(year, m + 1, 0));
    setSelectedMonth(m);
    emit(s, e);
    setOpenMenu(null);
  };

  const selectQuarter = (qs: number, qe: number) => {
    const s = new Date(year, qs, 1);
    const e = clampEnd(new Date(year, qe + 1, 0));
    setSelectedQuarter(qs);
    emit(s, e);
    setOpenMenu(null);
  };

  const handleCustomStart = (d: Date) => {
    setCustomStart(d);
    if (customEnd && d <= customEnd) {
      emit(d, customEnd);
      setOpenMenu(null);
    }
  };
  const handleCustomEnd = (d: Date) => {
    setCustomEnd(d);
    if (customStart && customStart <= d) {
      emit(customStart, d);
      setOpenMenu(null);
    }
  };

  // Aplica el rango por defecto del preset (relativo a la fecha actual) para el año dado
  const applyPreset = (key: PresetKey, y: number) => {
    const yStart = new Date(y, 0, 1);
    const yEnd = endForYear(y);
    const isCurrent = y === currentYear;
    clearSubSelections();

    switch (key) {
      case '1D': {
        const d = isCurrent ? today : yEnd;
        setSelectedDay(d);
        emit(d, d);
        setOpenMenu('preset');
        break;
      }
      case '7D': {
        const ws = getWeeks(y, yEnd);
        const i = ws.length - 1;
        setSelectedWeek(i);
        emit(ws[i].start, ws[i].end);
        setOpenMenu('preset');
        break;
      }
      case '15D': {
        const fs = getFortnights(y, yEnd);
        const last = fs[fs.length - 1];
        setSelectedFortnight(last.key);
        emit(last.start, last.end);
        setOpenMenu('preset');
        break;
      }
      case '30D': {
        const m = isCurrent ? today.getMonth() : 11;
        const s = new Date(y, m, 1);
        let e = new Date(y, m + 1, 0);
        if (e > yEnd) e = yEnd;
        setSelectedMonth(m);
        emit(s, e);
        setOpenMenu('preset');
        break;
      }
      case '90D': {
        const qs = quartersForYear(y);
        const [s0, e0] = qs[qs.length - 1];
        const s = new Date(y, s0, 1);
        let e = new Date(y, e0 + 1, 0);
        if (e > yEnd) e = yEnd;
        setSelectedQuarter(s0);
        emit(s, e);
        setOpenMenu('preset');
        break;
      }
      case '1Y': {
        setOpenMenu(null);
        emit(yStart, yEnd);
        break;
      }
      case 'custom': {
        setOpenMenu('preset');
        break;
      }
    }
  };

  // El preset inicial, una sola vez, sin dejar abierto su panel.
  useEffect(() => {
    if (!initialPreset) return;
    setActivePreset(initialPreset);
    applyPreset(initialPreset, currentYear);
    setOpenMenu(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePreset = (key: PresetKey) => {
    // Reabrir el preset ya activo: conservar la selección previa, solo alternar el panel
    if (activePreset === key) {
      if (key === '1Y') return;
      setOpenMenu((prev) => (prev === 'preset' ? null : 'preset'));
      return;
    }
    // Cambiar de preset: preseleccionar el rango actual por defecto
    setActivePreset(key);
    applyPreset(key, year);
  };

  const handleYearChange = (y: number) => {
    if (y < MIN_YEAR || y > currentYear) return;
    setYear(y);
    if (activePreset) {
      applyPreset(activePreset, y);
    } else {
      clearSubSelections();
      setOpenMenu(null);
    }
  };

  // Limpia el rango: el consumidor vuelve a consultar sin parámetros de fecha
  const handleClean = () => {
    clearSubSelections();
    setActivePreset(null);
    setRange(null);
    setOpenMenu(null);
    onChange(undefined, undefined);
  };

  // Render del panel activo
  const renderPanel = () => {
    switch (activePreset) {
      case '1D':
        return (
          <MiniCalendar
            value={selectedDay}
            onSelect={selectDay}
            minDate={yearStart}
            maxDate={yearEnd}
            initialMonth={isCurrentYear ? today : yearStart}
          />
        );
      case '7D':
        return (
          <div className="max-h-64 overflow-y-auto w-[240px] -mr-1 pr-1">
            {weeks
              .map((w, i) => ({ w, i }))
              .reverse()
              .map(({ w, i }) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectWeek(i)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors border border-transparent',
                    selectedWeek === i
                      ? 'bg-secondary text-white font-medium border-secondary'
                      : 'hover:bg-orange-50 hover:border-secondary'
                  )}
                >
                  {weekLabel(w)}
                </button>
              ))}
          </div>
        );
      case '15D':
        return (
          <div className="max-h-64 overflow-y-auto w-[200px] -mr-1 pr-1">
            {[...fortnights].reverse().map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => selectFortnight(f)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors border border-transparent',
                  selectedFortnight === f.key
                    ? 'bg-secondary text-white font-medium border-secondary'
                    : 'hover:bg-orange-50 hover:border-secondary'
                )}
              >
                {fortnightLabel(f)}
              </button>
            ))}
          </div>
        );
      case '30D':
        return (
          <div className="grid grid-cols-2 gap-1 w-[240px]">
            {[...months].reverse().map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => selectMonth(m)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm transition-colors border border-transparent',
                  selectedMonth === m
                    ? 'bg-secondary text-white font-medium border-secondary'
                    : 'hover:bg-orange-50 hover:border-secondary'
                )}
              >
                {MONTHS[m]}
              </button>
            ))}
          </div>
        );
      case '90D':
        return (
          <div className="flex flex-col gap-1 w-[200px]">
            {[...quarters].reverse().map(([qs, qe]) => (
              <button
                key={qs}
                type="button"
                onClick={() => selectQuarter(qs, qe)}
                className={cn(
                  'px-3 py-2 rounded-md text-sm transition-colors border border-transparent',
                  selectedQuarter === qs
                    ? 'bg-secondary text-white font-medium border-secondary'
                    : 'hover:bg-orange-50 hover:border-secondary'
                )}
              >
                {MONTHS_ABBR[qs]} - {MONTHS_ABBR[qe]}
              </button>
            ))}
          </div>
        );
      case 'custom':
        return (
          <div className="flex flex-row gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Fecha inicial
              </p>
              <MiniCalendar
                value={customStart}
                onSelect={handleCustomStart}
                maxDate={customEnd ?? undefined}
              />
            </div>
            <div className="border-l pl-4">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Fecha final
              </p>
              <MiniCalendar
                value={customEnd}
                onSelect={handleCustomEnd}
                minDate={customStart ?? undefined}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        'relative inline-flex flex-col items-center gap-1',
        className
      )}
    >
      {/* Fila: selector de año (izquierda) + presets */}
      <div className="flex flex-wrap items-center justify-center gap-1">
        {/* Selector de año */}
        <div className="relative flex items-center gap-1 mr-1">
          <button
            type="button"
            onClick={() =>
              setOpenMenu((prev) => (prev === 'year' ? null : 'year'))
            }
            className="px-3 py-1 border border-gray-300 rounded-full text-sm font-semibold min-w-[72px] text-center hover:bg-orange-50 hover:border-secondary transition-colors"
          >
            {year}
          </button>

          <div className="flex flex-col">
            <button
              type="button"
              disabled={year >= currentYear}
              onClick={() => handleYearChange(year + 1)}
              className="text-gray-500 hover:text-secondary disabled:opacity-30 disabled:hover:text-gray-500 leading-none"
              aria-label="Año siguiente"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
            <button
              type="button"
              disabled={year <= MIN_YEAR}
              onClick={() => handleYearChange(year - 1)}
              className="text-gray-500 hover:text-secondary disabled:opacity-30 disabled:hover:text-gray-500 leading-none"
              aria-label="Año anterior"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Dropdown de años */}
          {openMenu === 'year' && (
            <div className="absolute left-0 top-full mt-1 z-50 rounded-lg border bg-white shadow-lg p-1 w-[72px]">
              {years.map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => handleYearChange(y)}
                  className={cn(
                    'w-full px-3 py-1.5 rounded-md text-sm text-center transition-colors border border-transparent',
                    y === year
                      ? 'bg-secondary text-white font-medium border-secondary'
                      : 'hover:bg-orange-50 hover:border-secondary'
                  )}
                >
                  {y}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Presets */}
        {visiblePresets.map((p) => (
          <div key={p.key} className="relative group">
            <button
              type="button"
              onClick={() => handlePreset(p.key)}
              className={cn(
                'h-7 px-3 rounded-2xl text-xs font-medium border transition-colors',
                activePreset === p.key
                  ? 'bg-secondary text-white border-secondary'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-orange-50 hover:border-secondary'
              )}
            >
              {p.label}
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-50">
              {p.hint}
            </span>
          </div>
        ))}

        {/* Limpiar fechas */}
        {clean && (
          <div className="relative group">
            <button
              type="button"
              onClick={handleClean}
              aria-label="Limpiar Fechas"
              className="h-7 px-3 rounded-2xl border border-gray-300 bg-white text-gray-700 flex items-center transition-colors hover:bg-orange-50 hover:border-secondary hover:text-secondary"
            >
              <Eraser className="h-3.5 w-3.5" />
            </button>
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-[11px] text-white opacity-0 shadow-md transition-opacity duration-150 group-hover:opacity-100 z-50">
              Limpiar Fechas
            </span>
          </div>
        )}
      </div>

      {/* Feedback del rango aplicado */}
      {range && (
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {isSameDay(range.start, range.end)
            ? fmtHuman(range.start)
            : `${fmtHuman(range.start)} - ${fmtHuman(range.end)}`}
        </p>
      )}

      {/* Panel del preset activo */}
      {openMenu === 'preset' && activePreset && (
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-50 rounded-lg border bg-white shadow-lg p-3">
          {renderPanel()}
        </div>
      )}
    </div>
  );
}

export default FilterDate;
