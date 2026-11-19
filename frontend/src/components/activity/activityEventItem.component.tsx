'use client';

import React from 'react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { SUPPORT_TICKET, USED_BIKE_DETAIL } from '@/constants/routes';
import { ActivityEvent } from '@/services/activity/types';
import { useRoles } from '@/stores/auth/auth.store';
import {
  activityBulkItems,
  activityDetails,
  formatActivityDateTime,
  formatActivityTime,
  showsTarget,
  verbConfig,
} from './activity.utils';

interface ActivityEventItemProps {
  event: ActivityEvent;
  /** En el feed basta la hora (el día es el encabezado); en la ficha, fecha y hora */
  showDate?: boolean;
  /** En la ficha de la entidad el objetivo ya es obvio: se omite el enlace */
  showTarget?: boolean;
  /** Dibuja la línea vertical que une los eventos */
  isLast?: boolean;
}

/**
 * Enlace al objetivo cuando tiene ficha propia. La ficha de moto usada por id
 * está reservada a admin, así que para el resto no se enlaza.
 */
function targetHref(event: ActivityEvent, isAdmin: boolean): string | null {
  if (
    isAdmin &&
    event.targetModel === 'used_bike' &&
    event.verb !== 'used_bike.deleted'
  ) {
    return USED_BIKE_DETAIL(event.targetId);
  }
  // Quien ve el registro (Super Admin) es el equipo de soporte
  if (event.targetModel === 'support_ticket') {
    return SUPPORT_TICKET(event.targetId);
  }
  return null;
}

/** Una acción del registro: "Ana Pérez registró la moto usada AB123CD" */
export function ActivityEventItem({
  event,
  showDate = false,
  showTarget = true,
  isLast = false,
}: ActivityEventItemProps) {
  const { phrase, icon: Icon, tone } = verbConfig(event.verb);
  const details = activityDetails(event);
  const bulk = activityBulkItems(event);
  const roles = useRoles();
  const href = targetHref(event, roles.includes('admin'));

  const target = event.targetLabel || `#${event.targetId}`;

  return (
    <li className="relative flex gap-3 pb-5">
      {!isLast && (
        <span
          className="absolute left-4 top-9 -ml-px h-[calc(100%-2.25rem)] w-px bg-gray-200"
          aria-hidden
        />
      )}
      <span
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          tone
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm text-gray-900">
          <span className="font-semibold">
            {/* Sin nombre solo queda quien actuó sin sesión (registro público,
                encuesta anónima): un usuario eliminado conserva su nombre */}
            {event.actorLabel || 'Un visitante sin sesión'}
          </span>{' '}
          {phrase}
          {showTarget && showsTarget(event) && (
            <>
              {' '}
              {href ? (
                <Link
                  href={href}
                  className="font-medium uppercase text-primary hover:underline"
                >
                  {target}
                </Link>
              ) : (
                <span className="font-medium uppercase">{target}</span>
              )}
            </>
          )}
        </p>
        {details.length > 0 && (
          <p className="text-xs text-gray-500">{details.join(' · ')}</p>
        )}
        {bulk.items.length > 0 && (
          <details className="mt-1 text-xs text-gray-600">
            <summary className="cursor-pointer select-none font-medium text-primary">
              Ver productos ({bulk.total.toLocaleString()})
            </summary>
            <ul className="mt-1 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 divide-y divide-gray-200">
              {bulk.items.map((item, index) => (
                <li key={`${item.sku}-${index}`} className="px-2 py-1">
                  <span className="font-medium uppercase">{item.sku}</span>
                  {item.name ? (
                    <span className="text-gray-500"> · {item.name}</span>
                  ) : null}
                  {item.description ? (
                    <span className="block text-gray-700">
                      {item.description}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
            {bulk.total > bulk.items.length && (
              <p className="mt-1 text-gray-400">
                Se guardaron los primeros {bulk.items.length.toLocaleString()}{' '}
                de {bulk.total.toLocaleString()}.
              </p>
            )}
          </details>
        )}
        <p className="text-xs text-gray-400">
          {showDate
            ? formatActivityDateTime(event.createdAt)
            : formatActivityTime(event.createdAt)}
          {event.branchName ? ` · ${event.branchName}` : ''}
        </p>
      </div>
    </li>
  );
}
