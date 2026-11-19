'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { BranchItem } from '@/services/branches/types/Branch.type';
import { GpsUnit } from '@/services/gps/types';
import { isGpsUnitInTransfer, isGpsUnitInstalled } from './gps.utils';

interface GpsBranchCellProps {
  unit: GpsUnit;
  /** Sucursales MC (`/branches/mc/all`): los únicos destinos válidos. */
  branches: BranchItem[];
  onChange: (unit: GpsUnit, targetBranch: number) => void;
  /** `true` mientras el cambio de esta fila viaja al servidor. */
  isSaving?: boolean;
  /** Bloquea el control aunque no sea esta fila la que está guardando. */
  disabled?: boolean;
}

/**
 * La celda "Sucursal" del monitoreo, editable en el lugar.
 *
 * Una unidad **instalada** ya está montada en una moto, así que su sucursal
 * deja de ser algo que se mueva desde acá y la celda vuelve a ser texto. Lo
 * mismo una unidad **en traslado**: hasta que la sucursal que recibe la acepte
 * o la rechace no se mueve. Para el resto, elegir una sucursal dispara el
 * PATCH: el backend manda el id de la sucursal a Arranca, y si esa
 * sincronización falla el cambio no se guarda de ningún lado. Pasar de una
 * sucursal a otra deja la unidad en traslado.
 *
 * Las únicas opciones son sucursales MC: "sin sucursal" no es un destino
 * válido, así que no se ofrece. Una unidad que todavía no tiene ninguna muestra
 * el placeholder y solo se puede mover hacia adelante, nunca vaciar.
 */
export function GpsBranchCell({
  unit,
  branches,
  onChange,
  isSaving = false,
  disabled = false,
}: GpsBranchCellProps) {
  if (isGpsUnitInstalled(unit)) {
    return (
      <span
        className="text-gray-500"
        title="La unidad ya está instalada: su sucursal no se edita."
      >
        {unit.targetBranch?.name || '-'}
      </span>
    );
  }

  if (isGpsUnitInTransfer(unit)) {
    return (
      <span
        className="flex flex-col leading-tight"
        title="La sucursal que recibe tiene que aceptar o rechazar el traslado."
      >
        <span className="text-gray-900">{unit.targetBranch?.name || '-'}</span>
        <span className="text-[11px] font-medium text-amber-700">
          En traslado desde {unit.transferFromBranch?.name}
        </span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Select
        // Cadena vacía = todavía sin sucursal, que es lo que Radix entiende
        // como "nada elegido" y pinta con el placeholder. No es una opción:
        // `SelectItem` no admite ese valor, justamente para que no lo sea.
        value={unit.targetBranch ? String(unit.targetBranch.id) : ''}
        disabled={disabled || isSaving}
        onValueChange={(value) => onChange(unit, Number(value))}
      >
        <SelectTrigger className="h-8 w-full min-w-[9rem] border-gray-200 text-xs">
          <SelectValue placeholder="Asignar sucursal" />
        </SelectTrigger>
        <SelectContent>
          {branches.map((branch) => (
            <SelectItem key={branch.id} value={String(branch.id)}>
              {branch.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isSaving && (
        <Loader2
          className="h-3.5 w-3.5 shrink-0 animate-spin text-gray-400"
          aria-label="Guardando"
        />
      )}
    </div>
  );
}
