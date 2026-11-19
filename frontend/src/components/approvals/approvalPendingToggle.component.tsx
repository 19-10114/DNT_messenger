'use client';

import React, { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox.component';

const STORAGE_KEY = 'inventory.showEmpirePending';

/**
 * Recordado por navegador: quien lo prende suele querer verlo siempre. Si el
 * almacenamiento no está disponible, arranca apagado y funciona igual.
 */
export function useShowEmpirePending(): [boolean, (value: boolean) => void] {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // Sin almacenamiento: queda apagado.
    }
  }, []);
  const update = (value: boolean) => {
    setShow(value);
    try {
      window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0');
    } catch {
      // Solo se pierde el recuerdo entre visitas.
    }
  };
  return [show, update];
}

/** Interruptor "Ver por recibir de Empire" de las vistas de inventario por modelo. */
export function ApprovalPendingToggle({
  checked,
  onChange,
  id = 'show-empire-pending',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  id?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onChange(value === true)}
      />
      <label htmlFor={id} className="cursor-pointer select-none text-sm">
        Ver por recibir de Empire
      </label>
    </div>
  );
}
