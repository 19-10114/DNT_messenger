'use client';

import React, { useState } from 'react';
import { Check, ThumbsDown, ThumbsUp } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import { Input } from '@/components/ui/input.component';
import { cn } from '@/lib/utils';
import { formatPrice } from '../usedBike.utils';

/**
 * Punto o rango graficado sobre la escala.
 * Con `to` se dibuja una línea entre ambos valores; sin él, un punto.
 */
export interface PriceMarker {
  key: string;
  label: string;
  value: number | null;
  /** Extremo superior del rango; si falta, el marcador es un punto */
  to?: number | null;
  /** Color del texto de la etiqueta en la leyenda */
  labelTone: string;
  /** Color del punto o de la línea del rango */
  dotTone: string;
  /**
   * Tono claro con el que se pinta la **mitad inferior** de un rango; la
   * superior se queda con `dotTone`. Sin él, el rango va de un solo color.
   * Se ignora en los marcadores que son un punto.
   */
  dotToneSoft?: string;
}

/** Contorno verde que se rellena al pasar el mouse; se comparte con "Aprobar" */
export const APPROVE_BUTTON_CLASS =
  'border-emerald-600 text-emerald-700 hover:bg-emerald-600 hover:text-white';

interface PriceNegotiationProps {
  markers: PriceMarker[];
  offeredPrice: number | null;
  /** Ya tiene transacción de compra: aprobar de nuevo duplicaría el inventario */
  isAlreadyApproved?: boolean;
  /**
   * Solo la escala: sin campo de precio ofrecido ni botones de decisión. Es
   * como la muestra la ficha de la unidad, donde ya no se negocia nada.
   */
  readOnly?: boolean;
  onOfferedPriceChange?: (price: number | null) => void;
  onDecision?: (decision: 'approve' | 'reject') => void;
}

interface PlottedMarker extends PriceMarker {
  value: number;
  /** Extremos del marcador sobre la barra, en porcentaje */
  start: number;
  end: number;
  isRange: boolean;
  low: number;
  high: number;
  /** Posición en el arreglo recibido: decide quién se antepone */
  order: number;
}

interface Scale {
  min: number;
  max: number;
  span: number;
}

/** Holgura del 10% en cada extremo, para que los puntos no queden pegados */
const SCALE_PADDING = 0.1;

/** Marcas del eje, extremos incluidos */
const AXIS_TICKS = 9;

/**
 * Escala del eje: 10% por debajo del mínimo y 10% por encima del máximo,
 * redondeados a enteros para que las marcas no muestren decimales.
 */
function buildScale(values: number[]): Scale {
  const min = Math.floor(Math.min(...values) * (1 - SCALE_PADDING));
  const max = Math.ceil(Math.max(...values) * (1 + SCALE_PADDING));
  return { min, max, span: max - min };
}

/** Reparte los marcadores sobre la escala */
function plotMarkers(markers: PriceMarker[], scale: Scale): PlottedMarker[] {
  const positionOf = (value: number) =>
    scale.span === 0 ? 50 : ((value - scale.min) / scale.span) * 100;

  return markers
    .map((marker, order) => ({ marker, order }))
    .filter(
      (
        entry
      ): entry is { marker: PriceMarker & { value: number }; order: number } =>
        entry.marker.value !== null
    )
    .map(({ marker, order }) => {
      const isRange = marker.to !== null && marker.to !== undefined;
      // Un rango invertido se dibuja igual: se ordenan los extremos
      const low = isRange ? Math.min(marker.value, marker.to!) : marker.value;
      const high = isRange ? Math.max(marker.value, marker.to!) : marker.value;

      return {
        ...marker,
        order,
        isRange,
        low,
        high,
        start: positionOf(low),
        end: positionOf(high),
      };
    })
    .sort((a, b) => a.low - b.low);
}

interface RangeOverlapState {
  /** Rangos que se cruzan con algún otro, estén arriba o abajo */
  overlapping: Set<string>;
  /** Los que además quedan debajo: son los que se engordan */
  covered: Set<string>;
}

/**
 * Cómo queda cada rango respecto de los demás.
 *
 * Entre rangos gana el último recibido —B se dibuja sobre A—, así que el de
 * abajo se engorda y asoma por arriba y por abajo del otro, como un contorno
 * que lo arropa. Es la forma de ver los dos sin mezclar colores ni partir la
 * barra. Sin solape nadie engorda.
 */
function buildRangeOverlapState(plotted: PlottedMarker[]): RangeOverlapState {
  const ranges = plotted.filter((marker) => marker.isRange);
  const overlapping = new Set<string>();
  const covered = new Set<string>();

  ranges.forEach((marker) => {
    ranges.forEach((other) => {
      if (other.key === marker.key) return;

      // Comparten al menos un punto del eje
      const crosses = marker.low <= other.high && other.low <= marker.high;
      if (!crosses) return;

      overlapping.add(marker.key);
      // El otro se dibuja encima, así que este es el que queda tapado
      if (other.order > marker.order) covered.add(marker.key);
    });
  });

  return { overlapping, covered };
}

/** Diámetro de la lupa, en píxeles */
const LENS_SIZE = 72;

/** Cuánto aumenta la lupa lo que hay debajo */
const LENS_ZOOM = 3;

/** Distancia del eje al borde superior de la pista, en píxeles (`top-6`) */
const AXIS_OFFSET = 24;

/** Cercanía, en % del ancho, para considerar que dos marcadores se cruzan */
const CLUSTER_THRESHOLD = 4;

/**
 * Agrupa los marcadores que quedan encimados sobre la barra.
 * Todos los de un grupo comparten tooltip, así se leen aunque se tapen.
 */
function buildClusters(plotted: PlottedMarker[]): PlottedMarker[][] {
  const clusters: PlottedMarker[][] = [];
  let currentEnd = -Infinity;

  plotted.forEach((marker) => {
    const isNear = marker.start <= currentEnd + CLUSTER_THRESHOLD;

    if (!isNear || clusters.length === 0) {
      clusters.push([marker]);
      currentEnd = marker.end;
      return;
    }

    clusters[clusters.length - 1].push(marker);
    currentEnd = Math.max(currentEnd, marker.end);
  });

  // Dentro del tooltip se listan en el mismo orden que la leyenda
  return clusters.map((cluster) =>
    [...cluster].sort((a, b) => a.order - b.order)
  );
}

interface MarkerShapeProps {
  marker: PlottedMarker;
  /** Queda debajo de otro rango: engorda para asomar a su alrededor */
  isCovered: boolean;
  /** Se cruza con otro rango: el borde estorba justo en el contacto */
  isOverlapping: boolean;
}

/**
 * El dibujo del marcador, sin posicionarlo. Lo comparten la escala y la lupa,
 * así el aumento muestra exactamente lo mismo que hay debajo.
 */
function MarkerShape({ marker, isCovered, isOverlapping }: MarkerShapeProps) {
  if (!marker.isRange) {
    return (
      <span
        className={cn(
          'block h-3 w-3 shrink-0 rounded-full border-2 border-background',
          marker.dotTone
        )}
      />
    );
  }

  return (
    /*
      El rango se parte por la mitad de su ancho: la mitad baja en el tono
      claro y la alta en el oscuro, para leer de un vistazo en qué extremo del
      justiprecio cae un precio.
    */
    <span
      className={cn(
        'flex w-full overflow-hidden rounded-full',
        // El de abajo se engorda para asomar ~2px por lado alrededor del que
        // lo tapa
        isCovered ? 'h-3' : 'h-2',
        // El borde solo separa la barra del eje gris cuando está sola. Entre
        // dos que se cruzan estorba: se come el asomo de color que es justo lo
        // que deja verlas a las dos, y mete una línea blanca entre ambas.
        !isOverlapping && 'border border-background'
      )}
    >
      <span
        className={cn('h-full w-1/2', marker.dotToneSoft ?? marker.dotTone)}
      />
      <span className={cn('h-full w-1/2', marker.dotTone)} />
    </span>
  );
}

/** Todos los valores que entran en la escala, extremos de rango incluidos */
function scaleValues(markers: PriceMarker[]): number[] {
  return markers.flatMap((marker) => {
    if (marker.value === null) return [];
    return marker.to !== null && marker.to !== undefined
      ? [marker.value, marker.to]
      : [marker.value];
  });
}

/** Las marcas del eje no llevan decimales */
function formatAxisValue(value: number): string {
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

function markerValueLabel(marker: {
  isRange: boolean;
  low: number;
  high: number;
}): string {
  return marker.isRange
    ? `${formatPrice(marker.low)} – ${formatPrice(marker.high)}`
    : formatPrice(marker.low);
}

/**
 * Escala de precios de la negociación.
 * Los valores se leen en la leyenda superior y en el eje inferior; al pasar el
 * mouse por un marcador se muestra su valor exacto.
 */
export function PriceNegotiation({
  markers,
  offeredPrice,
  isAlreadyApproved = false,
  readOnly = false,
  onOfferedPriceChange,
  onDecision,
}: PriceNegotiationProps) {
  const [draftOffer, setDraftOffer] = useState(
    offeredPrice !== null ? String(offeredPrice) : ''
  );

  /** La lupa estorba más de lo que ayuda si no se pidió: arranca apagada */
  const [isZoomEnabled, setIsZoomEnabled] = useState(false);

  /**
   * Posición del cursor sobre la pista y ancho de esta, en píxeles. `null`
   * mientras el mouse esté fuera: es lo que apaga la lupa.
   */
  const [lens, setLens] = useState<{ x: number; width: number } | null>(null);

  const values = scaleValues(markers);
  const scale = values.length ? buildScale(values) : null;
  const plotted = scale ? plotMarkers(markers, scale) : [];

  /**
   * Confirma el precio ofrecido. Lo dispara el check, el Enter y también el
   * blur del campo, así que sin cambio real no se avisa: el consumidor lo
   * persiste con un PATCH y no hace falta repetirlo por salir del input.
   */
  const confirmOffer = () => {
    const parsed = Number(draftOffer);
    const next =
      draftOffer.trim() === '' || Number.isNaN(parsed) ? null : parsed;

    if (next === offeredPrice) return;
    onOfferedPriceChange?.(next);
  };

  // Cada marcador muestra el tooltip de su grupo
  const clusterByKey = new Map<string, PlottedMarker[]>();
  buildClusters(plotted).forEach((cluster) => {
    cluster.forEach((marker) => clusterByKey.set(marker.key, cluster));
  });

  const rangeOverlap = buildRangeOverlapState(plotted);

  /** Sigue al cursor sobre la pista para colocar la lupa */
  const trackLens = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomEnabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setLens({ x: event.clientX - rect.left, width: rect.width });
  };

  /** Apagar el zoom con la lupa abierta la dejaría clavada en pantalla */
  const toggleZoom = (enabled: boolean) => {
    setIsZoomEnabled(enabled);
    if (!enabled) setLens(null);
  };

  const ticks =
    scale && scale.span > 0
      ? Array.from({ length: AXIS_TICKS }, (_, index) => {
          const ratio = index / (AXIS_TICKS - 1);
          return {
            ratio,
            value: Math.round(scale.min + scale.span * ratio),
          };
        })
      : [];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b py-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-base">Escala de precios</CardTitle>

          {/* La lupa solo aparece si se pide: apagada, la pista no reacciona */}
          <label className="flex items-center gap-2 text-sm font-normal cursor-pointer">
            <Checkbox
              checked={isZoomEnabled}
              onCheckedChange={(checked) => toggleZoom(checked === true)}
            />
            Zoom
          </label>
        </div>
      </CardHeader>
      <CardContent className="py-6 flex flex-col gap-6">
        {/* Leyenda: solo los nombres, los montos se leen en el eje y el tooltip */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {plotted.map((marker) => (
            <div key={marker.key} className="flex items-center gap-2">
              {/* La muestra repite el degradado por mitades de la barra */}
              {marker.isRange ? (
                <span className="flex h-1.5 w-5 shrink-0 overflow-hidden rounded-full">
                  <span
                    className={cn(
                      'h-full w-1/2',
                      marker.dotToneSoft ?? marker.dotTone
                    )}
                  />
                  <span className={cn('h-full w-1/2', marker.dotTone)} />
                </span>
              ) : (
                <span
                  className={cn(
                    'h-2.5 w-2.5 shrink-0 rounded-full',
                    marker.dotTone
                  )}
                />
              )}
              <span className={cn('text-xs font-semibold', marker.labelTone)}>
                {marker.label}
              </span>
            </div>
          ))}
        </div>

        {plotted.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay precios que graficar.
          </p>
        ) : (
          <div
            className={cn(
              'relative h-16 mx-6',
              // Avisa de que la pista responde al mouse
              isZoomEnabled && 'cursor-crosshair'
            )}
            onMouseMove={trackLens}
            onMouseLeave={() => setLens(null)}
          >
            {/* El eje: gris, para que resalten los marcadores */}
            <div className="absolute inset-x-0 top-6 -translate-y-1/2 h-1 rounded-full bg-gray-300" />

            {plotted.map((marker) => (
              <div
                key={marker.key}
                style={{
                  left: `${marker.start}%`,
                  width: `${marker.end - marker.start}%`,
                  // Los puntos siempre visibles; entre rangos gana el último
                  // recibido, así B se antepone a A.
                  zIndex: marker.isRange ? marker.order + 1 : marker.order + 10,
                }}
                className="group absolute top-6 -translate-y-1/2 flex justify-center"
              >
                <MarkerShape
                  marker={marker}
                  isCovered={rangeOverlap.covered.has(marker.key)}
                  isOverlapping={rangeOverlap.overlapping.has(marker.key)}
                />

                {/*
                  Tooltip del grupo: si varios marcadores se cruzan, se listan
                  todos, porque encimados no se distinguen.
                */}
                <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 flex-col gap-0.5 whitespace-nowrap rounded-md border border-gray-300 bg-white px-2 py-1.5 text-[11px] text-black shadow-md group-hover:flex">
                  {(clusterByKey.get(marker.key) ?? [marker]).map((item) => (
                    <span key={item.key}>
                      <span className="font-semibold">{item.label}:</span>{' '}
                      {markerValueLabel(item)}
                    </span>
                  ))}
                </span>
              </div>
            ))}

            {/* Marcas fijas del eje */}
            {ticks.map((tick) => (
              <div
                key={tick.ratio}
                style={{ left: `${tick.ratio * 100}%` }}
                className={cn(
                  'absolute top-8 flex flex-col items-center gap-1',
                  tick.ratio === 0 && 'items-start',
                  tick.ratio === 1 && 'items-end -translate-x-full',
                  tick.ratio > 0 && tick.ratio < 1 && '-translate-x-1/2'
                )}
              >
                <span className="h-1.5 w-px bg-gray-300" />
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {formatAxisValue(tick.value)}
                </span>
              </div>
            ))}

            {/*
              Lupa: un círculo centrado en el cursor con una copia de la pista
              aumentada. Se apoya en el mismo `MarkerShape` que la escala real,
              así que enseña exactamente lo que hay debajo, solo que en grande
              —útil justo donde los rangos se cruzan y quedan finos—.

              No captura el mouse ni se anuncia: el hover, los tooltips y toda
              la información siguen siendo cosa de la pista de abajo.
            */}
            {lens ? (
              <div
                aria-hidden
                className="pointer-events-none absolute z-40 overflow-hidden rounded-full border-2 border-gray-300 bg-white shadow-lg"
                style={{
                  width: LENS_SIZE,
                  height: LENS_SIZE,
                  left: lens.x - LENS_SIZE / 2,
                  top: AXIS_OFFSET - LENS_SIZE / 2,
                }}
              >
                {/*
                  La copia mide lo que la pista y se corre para que el punto
                  bajo el cursor caiga en el centro del círculo; el aumento se
                  hace tomando ese mismo punto como origen, de modo que no se
                  mueve al escalar.
                */}
                <div
                  className="absolute inset-y-0"
                  style={{
                    left: LENS_SIZE / 2 - lens.x,
                    width: lens.width,
                    transform: `scale(${LENS_ZOOM})`,
                    transformOrigin: `${lens.x}px center`,
                  }}
                >
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gray-300" />

                  {plotted.map((marker) => (
                    <div
                      key={marker.key}
                      style={{
                        left: `${marker.start}%`,
                        width: `${marker.end - marker.start}%`,
                        zIndex: marker.isRange
                          ? marker.order + 1
                          : marker.order + 10,
                      }}
                      className="absolute top-1/2 -translate-y-1/2 flex justify-center"
                    >
                      <MarkerShape
                        marker={marker}
                        isCovered={rangeOverlap.covered.has(marker.key)}
                        isOverlapping={rangeOverlap.overlapping.has(marker.key)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {readOnly ? null : (
          <>
            <div className="flex items-end gap-2 max-w-sm">
              <label className="flex flex-col gap-1 text-sm flex-1">
                <span className="font-medium">Precio ofrecido</span>
                <Input
                  type="number"
                  value={draftOffer}
                  onChange={(event) => setDraftOffer(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') confirmOffer();
                  }}
                  onBlur={confirmOffer}
                  placeholder="0"
                  min="0"
                />
              </label>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={APPROVE_BUTTON_CLASS}
                onClick={confirmOffer}
                title="Aplicar"
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 border-t pt-4">
              {isAlreadyApproved ? (
                <p className="text-xs text-muted-foreground mr-auto">
                  La compra ya fue aprobada y registrada en el inventario.
                </p>
              ) : null}
              <Button
                type="button"
                variant="outline"
                className="border-destructive text-destructive hover:bg-destructive/10"
                onClick={() => onDecision?.('reject')}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Rechazar
              </Button>
              <Button
                type="button"
                variant="outline"
                className={APPROVE_BUTTON_CLASS}
                disabled={isAlreadyApproved}
                title={
                  isAlreadyApproved
                    ? 'Esta unidad ya tiene su transacción de compra'
                    : undefined
                }
                onClick={() => onDecision?.('approve')}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Aprobar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
