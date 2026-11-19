'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Loader2,
  Satellite,
  X,
} from 'lucide-react';

import { Input } from '@/components/ui/input.component';
import { useAvailableGpsSearch } from '@/hooks/gps';
import { cn } from '@/lib/utils';
import { GpsUnit } from '@/services/gps/types';
import { getGpsHardwareLabel } from './gps.utils';

interface GpsImeiSelectProps {
  /** Unidad elegida de la lista. `null` mientras no se haya elegido ninguna. */
  value: GpsUnit | null;
  onChange: (unit: GpsUnit | null) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  id?: string;
}

/** Filas fantasma mientras se busca: la altura del desplegable no salta. */
const SKELETON_ROWS = 3;

/**
 * Selector de IMEI para instalar un GPS en una moto.
 *
 * Es un campo de texto con autocompletado, no un input libre: escribir el IMEI
 * a mano **no alcanza**, hay que elegir la unidad de la lista. Por eso `value`
 * es la unidad entera y no un string — quien lo consume habilita el "Marcar"
 * solo cuando hay unidad elegida, y cualquier tecleo posterior la descarta.
 *
 * Las opciones son únicamente unidades en estado `available`: una unidad ya
 * instalada o en calle no puede instalarse de nuevo.
 *
 * La búsqueda espera 1,5s desde la última tecla antes de viajar al servidor
 * (`GPS_SEARCH_DEBOUNCE_MS`), y todo ese rato el campo muestra el spinner y el
 * desplegable sus filas fantasma: la espera se lee como "buscando".
 */
export function GpsImeiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Escribí el IMEI de la unidad...',
  className,
  id,
}: GpsImeiSelectProps) {
  const [term, setTerm] = useState(value?.imei ?? '');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    availableUnits,
    totalAvailableUnits,
    isSearchingAvailableUnits,
    isErrorAvailableUnits,
  } = useAvailableGpsSearch(term, isOpen && !disabled);

  // Clic fuera: cerrar sin tocar la selección (el campo mantiene lo tecleado).
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [availableUnits]);

  const handleTermChange = (nextTerm: string) => {
    setTerm(nextTerm);
    setIsOpen(true);
    // Tipear invalida la elección anterior: el texto suelto no es una unidad.
    if (value && nextTerm !== value.imei) onChange(null);
  };

  const handleSelect = (unit: GpsUnit) => {
    onChange(unit);
    setTerm(unit.imei);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  const handleClear = () => {
    onChange(null);
    setTerm('');
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (!availableUnits.length) return;

      setHighlightedIndex((current) => {
        const step = event.key === 'ArrowDown' ? 1 : -1;
        return (current + step + availableUnits.length) % availableUnits.length;
      });
      return;
    }

    if (event.key === 'Enter' && isOpen) {
      const unit = availableUnits[highlightedIndex];
      if (unit) {
        event.preventDefault();
        handleSelect(unit);
      }
    }
  };

  const isSearching = isOpen && isSearchingAvailableUnits;
  const hasPendingText = !value && term.trim() !== '';

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Satellite
          className={cn(
            'pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2',
            value ? 'text-emerald-600' : 'text-gray-400'
          )}
          aria-hidden
        />
        <Input
          id={id}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          autoComplete="off"
          inputMode="numeric"
          disabled={disabled}
          placeholder={placeholder}
          value={term}
          onChange={(event) => handleTermChange(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            'pl-9 pr-10 tabular-nums',
            value && 'border-emerald-300 focus-visible:ring-emerald-500',
            hasPendingText && 'border-amber-300'
          )}
        />

        <span className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center">
          {isSearching ? (
            <Loader2
              className="h-4 w-4 animate-spin text-gray-400"
              aria-label="Buscando unidades"
            />
          ) : value ? (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              aria-label="Quitar la unidad seleccionada"
              className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden />
          )}
        </span>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2 text-xs text-gray-500">
            <span>
              {isSearching
                ? 'Buscando unidades disponibles...'
                : `Disponibles${term.trim() ? ' que coinciden' : ''}`}
            </span>
            {!isSearching && !isErrorAvailableUnits && (
              <span className="tabular-nums">
                {availableUnits.length}
                {totalAvailableUnits > availableUnits.length &&
                  ` de ${totalAvailableUnits}`}
              </span>
            )}
          </div>

          <ul
            role="listbox"
            className="max-h-64 overflow-y-auto overscroll-contain py-1"
          >
            {isSearching &&
              Array.from({ length: SKELETON_ROWS }, (_, index) => (
                <li key={`skeleton-${index}`} className="px-3 py-2">
                  <div className="h-3.5 w-40 animate-pulse rounded bg-gray-200" />
                  <div className="mt-1.5 h-3 w-28 animate-pulse rounded bg-gray-100" />
                </li>
              ))}

            {!isSearching && isErrorAvailableUnits && (
              <li className="flex items-start gap-2 px-3 py-4 text-sm text-red-600">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                No se pudieron cargar las unidades disponibles.
              </li>
            )}

            {!isSearching &&
              !isErrorAvailableUnits &&
              !availableUnits.length && (
                <li className="px-3 py-4 text-sm text-gray-500">
                  {term.trim()
                    ? 'Ninguna unidad disponible coincide con esa búsqueda.'
                    : 'No hay unidades GPS disponibles en este momento.'}
                </li>
              )}

            {!isSearching &&
              !isErrorAvailableUnits &&
              availableUnits.map((unit, index) => {
                const isHighlighted = index === highlightedIndex;
                const isSelected = value?.id === unit.id;
                const hardware = getGpsHardwareLabel(unit);

                return (
                  <li key={unit.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      // El mousedown adelanta al blur del input, que cerraría
                      // el desplegable antes de que llegue el click.
                      onMouseDown={(event) => event.preventDefault()}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onClick={() => handleSelect(unit)}
                      className={cn(
                        'flex w-full items-center justify-between gap-3 px-3 py-2 text-left transition-colors',
                        isHighlighted ? 'bg-gray-100' : 'bg-white'
                      )}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium tabular-nums text-gray-900">
                          {unit.imei}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {[
                            hardware,
                            unit.number ? `Línea ${unit.number}` : '',
                            unit.targetBranch?.name,
                          ]
                            .filter(Boolean)
                            .join(' · ') || 'Sin datos adicionales'}
                        </span>
                      </span>
                      {isSelected && (
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      {value ? (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700">
          <Check className="h-3.5 w-3.5" aria-hidden />
          Unidad seleccionada
          {getGpsHardwareLabel(value) ? ` · ${getGpsHardwareLabel(value)}` : ''}
        </p>
      ) : hasPendingText ? (
        <p className="mt-1.5 text-xs text-amber-600">
          Elegí una unidad de la lista: escribir el IMEI a mano no la
          selecciona.
        </p>
      ) : null}
    </div>
  );
}
