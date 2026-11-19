'use client';

import React, { useState } from 'react';
import { ChevronRight, History } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button.component';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { useEntityActivity } from '@/hooks/activity';
import { ActivityTargetModel } from '@/services/activity/types';
import { useIsStaff, useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { ActivityEventItem } from './activityEventItem.component';
import { canViewActivity } from './activity.utils';

/** Si el usuario actual puede ver el registro de actividad (Super Admin) */
export function useCanViewActivity(): boolean {
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  return canViewActivity(roles, isSuperuser, isStaff);
}

interface ActivityTimelineProps {
  targetModel: ActivityTargetModel;
  targetId: number;
  /**
   * `card` (por defecto) la envuelve en una tarjeta con título; `plain` la
   * deja suelta, para cuando ya vive dentro de una pestaña "Historial";
   * `collapsible` es una sección plegada que solo consulta al abrirse, para
   * modales que ya son largos.
   */
  variant?: 'card' | 'plain' | 'collapsible';
}

/**
 * Historia de una entidad en su ficha ("Registrada por Ana → Verificada por
 * Pedro → Aprobada por Luis"). Incluye lo relacionado que el backend agrega
 * (las líneas de una orden, las cargas masivas que tocaron un producto…).
 * Solo se muestra a quien puede ver el registro de actividad; para el resto
 * no se renderiza ni se consulta.
 */
export function ActivityTimeline({
  targetModel,
  targetId,
  variant = 'card',
}: ActivityTimelineProps) {
  const hasAccess = useCanViewActivity();
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldFetch = hasAccess && (variant !== 'collapsible' || isExpanded);

  const {
    entityActivity,
    totalEntityActivity,
    hasMoreEntityActivity,
    loadMoreEntityActivity,
    isLoadingMoreEntityActivity,
    isLoadingEntityActivity,
    isErrorEntityActivity,
  } = useEntityActivity(targetModel, targetId, shouldFetch);

  if (!hasAccess) return null;

  const body = isLoadingEntityActivity ? (
    <p className="text-sm text-gray-500">Cargando historial…</p>
  ) : isErrorEntityActivity ? (
    <p className="text-sm text-red-600">No se pudo cargar el historial.</p>
  ) : entityActivity.length === 0 ? (
    <p className="text-sm text-gray-500">
      Todavía no hay acciones registradas. El historial empezó a guardarse con
      esta versión, así que los pasos anteriores no aparecen.
    </p>
  ) : (
    <>
      <ol>
        {entityActivity.map((event, index) => (
          <ActivityEventItem
            key={event.id}
            event={event}
            showDate
            // Lo que es de la propia entidad no repite su nombre; lo relacionado
            // (una línea de la orden, una carga masiva) sí lo necesita
            showTarget={
              !(
                event.targetModel === targetModel && event.targetId === targetId
              )
            }
            isLast={index === entityActivity.length - 1}
          />
        ))}
      </ol>
      {hasMoreEntityActivity && (
        <div className="flex items-center justify-between gap-2 pb-2">
          <span className="text-xs text-gray-400">
            Mostrando {entityActivity.length.toLocaleString()} de{' '}
            {totalEntityActivity.toLocaleString()}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => loadMoreEntityActivity()}
            disabled={isLoadingMoreEntityActivity}
          >
            {isLoadingMoreEntityActivity ? 'Cargando…' : 'Ver más'}
          </Button>
        </div>
      )}
    </>
  );

  if (variant === 'collapsible') {
    return (
      <section className="rounded-lg border">
        <button
          type="button"
          onClick={() => setIsExpanded((value) => !value)}
          aria-expanded={isExpanded}
          className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold hover:bg-muted/50"
        >
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          Historial
          <span className="font-normal text-muted-foreground">
            · quién hizo cada paso y cuándo
          </span>
          <ChevronRight
            className={cn(
              'ml-auto h-4 w-4 transition-transform',
              isExpanded && 'rotate-90'
            )}
            aria-hidden
          />
        </button>
        {isExpanded && <div className="border-t px-4 pt-3">{body}</div>}
      </section>
    );
  }

  if (variant === 'plain') {
    return <div className="py-2">{body}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial</CardTitle>
        <CardDescription>Quién hizo cada paso y cuándo.</CardDescription>
      </CardHeader>
      <CardContent>{body}</CardContent>
    </Card>
  );
}
