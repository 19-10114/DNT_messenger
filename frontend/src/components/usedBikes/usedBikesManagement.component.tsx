'use client';

import React, { useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import { useToast } from '@/components/ui/use-toast';
import { useUsedBikeMutations, useUsedBikes } from '@/hooks/products';
import { cn } from '@/lib/utils';
import {
  USED_BIKE_STATUS_LABELS,
  UsedBike,
  UsedBikeStatus,
} from '@/services/products/types/UsedBike.type';
import { useUser } from '@/stores/auth/auth.store';
import { getUsedBikeErrorMessage } from './usedBikeError';
import { UsedBikeDetail } from './usedBikeDetail.component';
import { UsedBikeEvaluation } from './usedBikeEvaluation.component';
import { UsedBikeForm } from './usedBikeForm.component';
import { UsedBikesTable } from './usedBikesTable.component';

const PAGE_SIZE = 10;

const STATUS_FILTERS = Object.keys(USED_BIKE_STATUS_LABELS) as UsedBikeStatus[];

type ManagementView =
  | { kind: 'list' }
  | { kind: 'register' }
  | { kind: 'edit'; usedBike: UsedBike }
  | { kind: 'detail'; usedBike: UsedBike }
  | { kind: 'evaluation'; usedBike: UsedBike };

/**
 * Contenedor del módulo de Motos Usadas.
 * El listado, la ficha, el formulario y la evaluación viven en la misma ruta.
 */
export function UsedBikesManagement() {
  const { toast } = useToast();
  const currentUser = useUser();

  const [view, setView] = useState<ManagementView>({ kind: 'list' });
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<UsedBikeStatus | ''>('');
  const [usedBikeToDelete, setUsedBikeToDelete] = useState<UsedBike>();
  // Unidad pendiente a la espera de que se confirme quién la evalúa
  const [usedBikeToTake, setUsedBikeToTake] = useState<UsedBike>();

  const {
    usedBikes,
    pagination,
    isLoadingUsedBikes,
    isFetchingUsedBikes,
    isErrorUsedBikes,
    refetchUsedBikes,
  } = useUsedBikes({
    page,
    pageSize: PAGE_SIZE,
    status: status ? [status] : undefined,
  });
  const {
    deleteUsedBike,
    isDeletingUsedBike,
    updateUsedBike,
    isUpdatingUsedBike,
  } = useUsedBikeMutations();

  const goToList = () => setView({ kind: 'list' });

  const handleStatusChange = (value: string) => {
    setStatus(value as UsedBikeStatus | '');
    setPage(1);
  };

  const handleDelete = async () => {
    if (!usedBikeToDelete) return;

    try {
      await deleteUsedBike(usedBikeToDelete.id);
      toast({
        title: 'Registro eliminado',
        description: `${usedBikeToDelete.product.name} · Placa ${usedBikeToDelete.plate}`,
      });
      goToList();
    } catch (error) {
      toast({
        title: 'No se pudo eliminar',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al eliminar el registro.'
        ),
        variant: 'destructive',
      });
    } finally {
      setUsedBikeToDelete(undefined);
    }
  };

  /**
   * Abre la evaluación. Con la unidad todavía pendiente hay que confirmar antes
   * quién la evalúa; si ya está en curso se entra directo.
   */
  const handleStartEvaluation = (usedBike: UsedBike) => {
    if (usedBike.status === 'pending') {
      setUsedBikeToTake(usedBike);
      return;
    }
    setView({ kind: 'evaluation', usedBike });
  };

  /**
   * Toma la evaluación: se asigna el responsable y la unidad pasa a en
   * evaluación. `reviewer` no se toca: es el mecánico elegido al registrarla.
   */
  const handleTakeEvaluation = async () => {
    if (!usedBikeToTake || !currentUser) return;

    try {
      const taken = await updateUsedBike({
        usedBikeId: usedBikeToTake.id,
        payload: { responsible: currentUser.id, status: 'in_review' },
      });

      setUsedBikeToTake(undefined);
      setView({ kind: 'evaluation', usedBike: taken });
    } catch (error) {
      toast({
        title: 'No se pudo comenzar la evaluación',
        description: getUsedBikeErrorMessage(
          error,
          'Ocurrió un error al asignarte como responsable de la evaluación.'
        ),
        variant: 'destructive',
      });
      setUsedBikeToTake(undefined);
    }
  };

  if (view.kind === 'register') {
    return (
      <UsedBikeForm
        onCancel={goToList}
        onSaved={(usedBike) => setView({ kind: 'detail', usedBike })}
      />
    );
  }

  if (view.kind === 'edit') {
    const { usedBike } = view;
    return (
      <UsedBikeForm
        usedBike={usedBike}
        onCancel={() => setView({ kind: 'detail', usedBike })}
        onSaved={(saved) => setView({ kind: 'detail', usedBike: saved })}
      />
    );
  }

  if (view.kind === 'detail') {
    const { usedBike } = view;
    return (
      <>
        <UsedBikeDetail
          usedBike={usedBike}
          isDeleting={isDeletingUsedBike}
          onBack={goToList}
          onEdit={() => setView({ kind: 'edit', usedBike })}
          onDelete={() => setUsedBikeToDelete(usedBike)}
          onStartEvaluation={() => handleStartEvaluation(usedBike)}
        />
        <DeleteDialog
          usedBike={usedBikeToDelete}
          isLoading={isDeletingUsedBike}
          onConfirm={handleDelete}
          onCancel={() => setUsedBikeToDelete(undefined)}
        />
        <TakeEvaluationDialog
          usedBike={usedBikeToTake}
          isLoading={isUpdatingUsedBike}
          onConfirm={handleTakeEvaluation}
          onCancel={() => setUsedBikeToTake(undefined)}
        />
      </>
    );
  }

  if (view.kind === 'evaluation') {
    const { usedBike } = view;
    return (
      <UsedBikeEvaluation
        usedBike={usedBike}
        onBack={() => setView({ kind: 'detail', usedBike })}
        // Aprobar o rechazar cierra el flujo: se vuelve al listado
        onDecided={goToList}
        // Al soltar la evaluación la unidad vuelve a estar disponible
        onResigned={(released) =>
          setView({ kind: 'detail', usedBike: released })
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground whitespace-nowrap">
            Estado
          </span>
          <select
            value={status}
            onChange={(event) => handleStatusChange(event.target.value)}
            className="flex h-10 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Todos</option>
            {STATUS_FILTERS.map((item) => (
              <option key={item} value={item}>
                {USED_BIKE_STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => refetchUsedBikes()}
            disabled={isFetchingUsedBikes}
            title="Actualizar listado"
          >
            <RefreshCw
              className={cn(
                'h-4 w-4 mr-1',
                isFetchingUsedBikes && 'animate-spin'
              )}
            />
            Actualizar
          </Button>
          <Button type="button" onClick={() => setView({ kind: 'register' })}>
            <Plus className="h-4 w-4 mr-1" />
            Registrar
          </Button>
        </div>
      </div>

      {isErrorUsedBikes ? (
        <p className="text-sm text-destructive py-8 text-center">
          No se pudieron cargar las motos usadas.
        </p>
      ) : (
        <UsedBikesTable
          usedBikes={usedBikes}
          isLoading={isLoadingUsedBikes}
          onSelect={(usedBike) => setView({ kind: 'detail', usedBike })}
        />
      )}

      {pagination && pagination.totalPages > 1 ? (
        <PaginationComponent
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  );
}

interface ConfirmProps {
  usedBike?: UsedBike;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Tomar la evaluación asigna al usuario como responsable de la evaluación de
 * la unidad
 */
function TakeEvaluationDialog({
  usedBike,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <ConfirmDialog
      open={!!usedBike}
      title="Comenzar la evaluación"
      description={
        usedBike
          ? `¿Estás seguro de ser el responsable de la evaluación de esta moto? Quedarás asignado a "${usedBike.product.name}" (placa ${usedBike.plate}) y pasará a estado En evaluación.`
          : ''
      }
      confirmLabel="Sí, soy el responsable de la evaluación"
      isLoading={isLoading}
      onConfirm={onConfirm}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    />
  );
}

/** El backend borra en duro: no hay vuelta atrás */
function DeleteDialog({
  usedBike,
  isLoading,
  onConfirm,
  onCancel,
}: ConfirmProps) {
  return (
    <ConfirmDialog
      open={!!usedBike}
      title="Eliminar registro"
      description={
        usedBike
          ? `Se eliminará "${usedBike.product.name}" (placa ${usedBike.plate}) de forma permanente. Esta acción no se puede deshacer.`
          : ''
      }
      confirmLabel="Eliminar"
      destructive
      isLoading={isLoading}
      onConfirm={onConfirm}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    />
  );
}
