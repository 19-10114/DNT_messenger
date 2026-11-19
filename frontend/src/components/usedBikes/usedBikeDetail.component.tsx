'use client';

import React from 'react';
import { ArrowLeft, ClipboardCheck, Pencil, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import {
  USED_BIKE_STATUS_LABELS,
  UsedBike,
} from '@/services/products/types/UsedBike.type';
import {
  formatDateTime,
  formatPrice,
  fullName,
  parseOfferRange,
  statusVariant,
} from './usedBike.utils';
import { EvaluationSummary } from './evaluation/evaluationSummary.component';
import {
  PriceMarker,
  PriceNegotiation,
} from './evaluation/priceNegotiation.component';
import { useRoles, useUser } from '@/stores/auth/auth.store';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';

interface UsedBikeDetailProps {
  usedBike: UsedBike;
  isDeleting?: boolean;
  onBack: () => void;
  /**
   * Acciones del módulo de motos usadas. Son opcionales porque la ficha
   * también se abre desde el inventario de motos, donde no hay flujo detrás:
   * el botón que no reciba su callback no se renderiza.
   */
  onEdit?: () => void;
  onDelete?: () => void;
  onStartEvaluation?: () => void;
}

interface DataFieldProps {
  label: string;
  children: React.ReactNode;
}

function DataField({ label, children }: DataFieldProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{children}</span>
    </div>
  );
}

/** Ficha de un registro de moto usada */
export function UsedBikeDetail({
  usedBike,
  isDeleting = false,
  onBack,
  onEdit,
  onDelete,
  onStartEvaluation,
}: UsedBikeDetailProps) {
  const roles = useRoles();
  const currentUser = useUser();
  // Sin callback no hay flujo detrás del botón: se oculta aunque el rol alcance
  const canEdit =
    (roles.includes('admin') || usedBike.status === 'pending') &&
    !!onEdit &&
    !!onDelete;

  /**
   * Escala de precios de la ficha. A diferencia de la etapa 2, aquí no se
   * recalcula nada: los justiprecios son los que se guardaron al aprobar.
   */
  const offerA = parseOfferRange(usedBike.offerA);
  const offerB = parseOfferRange(usedBike.offerB);
  const priceMarkers: PriceMarker[] = [
    {
      key: 'asked',
      label: 'Pedido',
      value: usedBike.askedPrice,
      labelTone: 'text-foreground',
      dotTone: 'bg-foreground',
    },
    {
      key: 'strategyA',
      label: 'Estrategia A',
      value: offerA?.min ?? null,
      to: offerA?.max ?? null,
      labelTone: 'text-emerald-700',
      dotTone: 'bg-emerald-600',
      dotToneSoft: 'bg-emerald-300',
    },
    {
      key: 'strategyB',
      label: 'Estrategia B',
      value: offerB?.min ?? null,
      to: offerB?.max ?? null,
      labelTone: 'text-blue-700',
      dotTone: 'bg-blue-600',
      dotToneSoft: 'bg-blue-300',
    },
    {
      key: 'offered',
      label: 'Ofrecido',
      value: usedBike.cost,
      labelTone: 'text-amber-700',
      dotTone: 'bg-amber-500',
    },
  ];

  /**
   * Comenzar una evaluación es tomarla: por eso solo se ofrece a quien puede
   * ser su responsable. Una vez en curso, la ficha sigue abierta para el
   * responsable asignado y para el vendedor que necesita consultarla.
   */
  const startEvaluationButton =
    !!onStartEvaluation &&
    (usedBike.status === 'pending'
      ? ['admin', 'seller', 'manager', 'administrator'].some((role) =>
          roles.includes(role)
        ) && usedBike.reviewer !== null
      : roles.includes('admin') ||
        currentUser?.id === usedBike.responsible?.id);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver
          </Button>
          <div>
            <h2 className="text-lg font-semibold">{usedBike.product.name}</h2>
            <p className="text-xs text-muted-foreground">
              Placa {usedBike.plate} · Registro #{usedBike.id}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canEdit && (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-destructive"
                onClick={onDelete}
                disabled={isDeleting}
                title="Eliminar registro"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button type="button" variant="outline" onClick={onEdit}>
                <Pencil className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </>
          )}

          {startEvaluationButton && (
            <Button type="button" onClick={onStartEvaluation}>
              <ClipboardCheck className="h-4 w-4 mr-1" />
              {usedBike.status === 'pending'
                ? 'Comenzar evaluación'
                : usedBike.status === 'approved' ||
                    usedBike.status === 'rejected'
                  ? 'Ver evaluación'
                  : 'Continuar evaluación'}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataField label="Modelo">{usedBike.product.name}</DataField>
            <DataField label="Año">{usedBike.year ?? '-'}</DataField>
            <DataField label="Placa">
              <span className="uppercase">{usedBike.plate}</span>
            </DataField>
            <DataField label="Color">{usedBike.color || '-'}</DataField>
            <DataField label="Kilometraje">
              {usedBike.km !== null ? usedBike.km.toLocaleString() : '-'}
            </DataField>
            <DataField label="Serial de chasis">
              {usedBike.chassisSerial || '-'}
            </DataField>
            <DataField label="Serial de motor">
              {usedBike.engineSerial || '-'}
            </DataField>
            <DataField label="SKU">{usedBike.product.sku || '-'}</DataField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gestión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <DataField label="Precio pedido">
              {formatPrice(usedBike.askedPrice)}
            </DataField>
            <DataField label="Precio de compra">
              {formatPrice(usedBike.cost)}
            </DataField>
            <DataField label="Precio de venta">
              {formatPrice(usedBike.price)}
            </DataField>
            <DataField label="Estado">
              <Badge variant={statusVariant(usedBike.status)}>
                {USED_BIKE_STATUS_LABELS[usedBike.status] ?? usedBike.status}
              </Badge>
            </DataField>
            <DataField label="Cliente vendedor">
              {fullName(usedBike.owner)}
            </DataField>
            <DataField label="Observaciones">{usedBike.notes || '-'}</DataField>

            <DataField label="Sucursal">{usedBike.branch.name}</DataField>
            <DataField label="Registrada">
              {formatDateTime(usedBike.createdAt)}
            </DataField>
            <DataField label="Última actualización">
              {formatDateTime(usedBike.lastUpdated)}
            </DataField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evaluación</CardTitle>
          <CardDescription>
            Responsable de la evaluación: {fullName(usedBike.responsible)} ·
            Mecánico: {fullName(usedBike.reviewer)}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EvaluationSummary usedBike={usedBike} />
        </CardContent>
      </Card>

      {/* Sin `onDecision` ni edición del ofrecido: la ficha solo consulta */}
      <PriceNegotiation
        markers={priceMarkers}
        offeredPrice={usedBike.cost}
        readOnly
      />

      <ActivityTimeline targetModel="used_bike" targetId={usedBike.id} />
    </div>
  );
}
