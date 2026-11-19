'use client';

import React from 'react';
import { History } from 'lucide-react';

/**
 * Registros de GPS — pendiente de implementación.
 *
 * La ruta ya existe para que el módulo tenga su lugar en la navegación; el
 * contenido (historial de movimientos y cambios de estado por unidad) se
 * implementa más adelante.
 */
export function GpsLogs() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <History className="h-6 w-6" aria-hidden />
      </span>
      <h2 className="mt-4 text-base font-semibold text-gray-900">
        Registros en construcción
      </h2>
      <p className="mt-1 max-w-md text-sm text-gray-500">
        Acá va a vivir el historial de cada unidad: movimientos entre
        sucursales, cambios de responsable e instalaciones. Por ahora, el estado
        actual del parque está en Monitoreo.
      </p>
    </div>
  );
}
