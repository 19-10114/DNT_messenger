'use client';

import React, { useId, useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ChevronDown, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { BIKES_COLORS } from '@/constants/products';
import { cn } from '@/lib/utils';
import { AmountInput } from './AmountInput.component';
import { BranchSaleBike } from './branchSale.model';

interface BranchSaleBikeCardProps {
  bike: BranchSaleBike;
  onChange: (patch: Partial<BranchSaleBike>) => void;
  onRemove: () => void;
}

/** Todo el panel va en chico: es una columna angosta al lado del inventario */
const FIELD_CLASS = 'h-8 text-xs';
const SELECT_CLASS = 'w-full h-8 text-xs px-2 border rounded-md';

export function BranchSaleBikeCard({
  bike,
  onChange,
  onRemove,
}: BranchSaleBikeCardProps) {
  /**
   * El resto de los datos arranca plegado: ya vienen precargados del
   * inventario y sólo se tocan para corregir algo.
   */
  const [detailsOpen, setDetailsOpen] = useState(false);

  /**
   * Se pueden cargar varias motos a la vez, así que los `id` no pueden ser
   * fijos: con dos tarjetas abiertas, cada etiqueta enfocaría el campo de la
   * otra moto.
   */
  const fieldId = useId();

  /**
   * El color que trae la unidad puede no estar en el catálogo (cargas viejas).
   * Se agrega como opción para no perderlo al abrir el selector.
   */
  const colorOptions = useMemo(() => {
    if (bike.color && !BIKES_COLORS.includes(bike.color)) {
      return [bike.color, ...BIKES_COLORS];
    }
    return BIKES_COLORS;
  }, [bike.color]);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1">
          <h4 className="font-medium text-sm">{bike.productName}</h4>
          <p className="text-xs text-gray-600">
            {bike.brand} · {bike.model}
          </p>
          {/* La placa identifica a la unidad: se muestra, no se edita */}
          {bike.plate && (
            <p className="text-xs font-medium mt-0.5">{bike.plate}</p>
          )}
          {/* El monto queda siempre a la vista: es lo que más se edita */}
          <div className="flex items-center gap-1 mt-2">
            <Label className="text-xs" htmlFor={`${fieldId}-amount`}>
              $
            </Label>
            <AmountInput
              id={`${fieldId}-amount`}
              className="w-24"
              value={bike.amount}
              onChange={(amount) => onChange({ amount })}
            />
          </div>
        </div>
        <Button
          onClick={onRemove}
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 shrink-0 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setDetailsOpen((open) => !open)}
        aria-expanded={detailsOpen}
        className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform',
            detailsOpen && 'rotate-180'
          )}
        />
        Ver datos de la moto
      </button>

      {detailsOpen && (
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-order-id`}>
              Número de aprobación
            </Label>
            <Input
              id={`${fieldId}-order-id`}
              type="text"
              className={FIELD_CLASS}
              value={bike.orderId}
              onChange={(e) => onChange({ orderId: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Fecha de recepción</Label>
            <DatePicker
              selected={bike.receptionDate}
              onChange={(date: Date) => onChange({ receptionDate: date })}
              dateFormat="dd/MM/yyyy"
              placeholderText="DD/MM/AAAA"
              className="w-full h-8 text-xs px-3 border rounded-md"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-color`}>
              Color
            </Label>
            <select
              id={`${fieldId}-color`}
              className={SELECT_CLASS}
              value={bike.color}
              onChange={(e) => onChange({ color: e.target.value })}
            >
              <option value="">Seleccione el color</option>
              {colorOptions.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-serial-number`}>
              Serial del chasis
            </Label>
            <Input
              id={`${fieldId}-serial-number`}
              type="text"
              className={FIELD_CLASS}
              value={bike.serialNumber}
              onChange={(e) => onChange({ serialNumber: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-motor-serial`}>
              Serial del motor
            </Label>
            <Input
              id={`${fieldId}-motor-serial`}
              type="text"
              className={FIELD_CLASS}
              value={bike.motorSerial}
              onChange={(e) => onChange({ motorSerial: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-in-number`}>
              Número de entrada
            </Label>
            <Input
              id={`${fieldId}-in-number`}
              type="text"
              className={FIELD_CLASS}
              value={bike.inNumber}
              onChange={(e) => onChange({ inNumber: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs" htmlFor={`${fieldId}-year`}>
              Año
            </Label>
            <Input
              id={`${fieldId}-year`}
              type="text"
              className={FIELD_CLASS}
              value={bike.year}
              onChange={(e) => onChange({ year: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
