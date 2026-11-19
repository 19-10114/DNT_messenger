'use client';

import React from 'react';
import Link from 'next/link';
import { Truck } from 'lucide-react';

import { APPROVALS_PENDING } from '@/constants/routes';
import { useApprovalPendingByModel } from '@/hooks/approvals';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

/**
 * "N motos por recibir de Empire" para la sucursal activa (`0` = todas), en la
 * cabecera de las vistas de inventario por unidad, donde no hay una fila por
 * modelo en la que poner el número. Lleva a "Motos por recibir". No se
 * muestra si no hay nada pendiente.
 */
export function ApprovalPendingBadge() {
  const branchId = useCurrentBranchId();
  const { pendingTotal } = useApprovalPendingByModel(branchId);

  if (!pendingTotal) return null;
  return (
    <Link
      href={APPROVALS_PENDING}
      className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 ring-1 ring-inset ring-amber-200 hover:bg-amber-100"
      title="Aprobadas por Empire y todavía no registradas"
    >
      <Truck className="h-3.5 w-3.5" />
      {pendingTotal} {pendingTotal === 1 ? 'moto' : 'motos'} por recibir de
      Empire
    </Link>
  );
}
