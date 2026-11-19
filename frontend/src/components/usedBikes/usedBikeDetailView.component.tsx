'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { BIKES_INVENTORY } from '@/constants/routes';
import { useUsedBike } from '@/hooks/products';
import { readUsedBikeReturn } from '@/utils/usedBikeReturn.utils';
import { UsedBikeDetail } from './usedBikeDetail.component';

interface UsedBikeDetailViewProps {
  /** `NaN` si el segmento de la URL no era un número */
  usedBikeId: number;
}

interface EmptyStateProps {
  message: string;
  isError?: boolean;
  onBack: () => void;
}

function EmptyState({ message, isError = false, onBack }: EmptyStateProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>
      <p
        className={
          isError
            ? 'text-sm text-destructive py-8 text-center'
            : 'text-sm text-muted-foreground py-8 text-center'
        }
      >
        {message}
      </p>
    </div>
  );
}

/**
 * Ficha de una moto usada abierta por id, fuera del módulo de motos usadas.
 *
 * Se entra desde el inventario de motos, así que no hay listado ni flujos de
 * edición detrás: la ficha va sin `onEdit`, `onDelete` ni `onStartEvaluation`
 * y esos botones no se renderizan.
 */
export function UsedBikeDetailView({ usedBikeId }: UsedBikeDetailViewProps) {
  const router = useRouter();
  const isValidId = Number.isInteger(usedBikeId) && usedBikeId > 0;

  const { usedBike, isLoadingUsedBike, isErrorUsedBike } = useUsedBike(
    isValidId ? usedBikeId : undefined
  );

  /**
   * Vuelve a la pantalla que abrió la ficha; esa tabla reabre su modal con la
   * fila que dejó anotada. Sin nada pendiente, al inventario de motos.
   */
  const goBack = () => {
    router.push(readUsedBikeReturn()?.returnPath ?? BIKES_INVENTORY);
  };

  if (!isValidId) {
    return (
      <EmptyState
        message="El identificador de la moto usada no es válido."
        isError
        onBack={goBack}
      />
    );
  }

  if (isLoadingUsedBike) {
    return <EmptyState message="Cargando la moto usada..." onBack={goBack} />;
  }

  // El borrado del backend es definitivo: un id viejo responde 404
  if (isErrorUsedBike || !usedBike) {
    return (
      <EmptyState
        message="No se encontró el registro de esta moto usada."
        isError
        onBack={goBack}
      />
    );
  }

  return <UsedBikeDetail usedBike={usedBike} onBack={goBack} />;
}
