'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  MapPin,
  Satellite,
  Search,
  Truck,
  Wand2,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Input } from '@/components/ui/input.component';
import { Progress } from '@/components/ui/progress.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useBikeRequestAvailableUnits,
  useFulfillBikeRequest,
} from '@/hooks/bikeRequests';
import { cn, formatCurrency } from '@/lib/utils';
import {
  BikeRequest,
  BikeRequestAvailableLine,
  BikeRequestAvailableUnit,
} from '@/services/bikeRequests/types';
import {
  formatBikeRequestProduct,
  getBikeRequestErrorMessage,
  getBikeRequestErrorStatus,
  toBikeRequestAmount,
} from './bikeRequests.utils';

/** Tope del `invoice_number` de la transacción. */
const INVOICE_NUMBER_MAX_LENGTH = 15;

const ARRANCA_DID_NOT_CONFIRM_MESSAGE =
  'No se pudo registrar en el sistema de Arranca, no se despachó nada. Intente de nuevo.';

/** Moto elegida → línea a la que va. */
type Selection = Record<number, number>;

type Step = 'select' | 'confirm';

interface BikeRequestDispatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bikeRequest: BikeRequest;
}

function matchesSearch(unit: BikeRequestAvailableUnit, term: string) {
  if (!term) return true;
  const normalized = term.trim().toLowerCase();
  return (
    unit.plate?.toLowerCase().includes(normalized) ||
    unit.chassis?.toLowerCase().includes(normalized)
  );
}

function lineTitle(line: BikeRequestAvailableLine) {
  return `${formatBikeRequestProduct(line.product)} · ${line.requestedColor}`;
}

/**
 * Despacho de motos de una solicitud de Arranca.
 *
 * Paso 1: una sección por línea pendiente ("Keeway RKV 200 · Rojo · faltan
 * 3") con buscador por placa/chasis y la lista de motos que hoy la pueden
 * llenar. Se eligen con un tilde; cada línea se tapa en lo que le falta, y una
 * moto elegida en una línea queda bloqueada en las demás (la misma moto
 * aparece en todas las líneas de su modelo). El pie fijo resume cuántas van y
 * cuánto suman.
 *
 * Paso 2: resumen de lo que se va a enviar y confirmación. Todo el lote se
 * registra en MC y en Arranca en una sola operación: si Arranca no confirma
 * (502) no se despachó nada.
 */
export function BikeRequestDispatchDialog({
  open,
  onOpenChange,
  bikeRequest,
}: BikeRequestDispatchDialogProps) {
  const { toast } = useToast();

  const [selection, setSelection] = useState<Selection>({});
  const [searchByLine, setSearchByLine] = useState<Record<number, string>>({});
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [step, setStep] = useState<Step>('select');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    availableUnits,
    isLoadingAvailableUnits,
    isFetchingAvailableUnits,
    isErrorAvailableUnits,
    availableUnitsError,
    refetchAvailableUnits,
  } = useBikeRequestAvailableUnits(bikeRequest.id, open);

  const { fulfillBikeRequest, isFulfillingBikeRequest } =
    useFulfillBikeRequest();

  const lines = useMemo(() => availableUnits?.lines ?? [], [availableUnits]);

  // Cada apertura empieza de cero.
  useEffect(() => {
    if (!open) return;
    setSelection({});
    setSearchByLine({});
    setInvoiceNumber('');
    setStep('select');
    setSubmitError(null);
  }, [open]);

  // Si la lista cambió (se volvió a pedir tras un error), se suelta lo que ya
  // no está disponible en su línea.
  useEffect(() => {
    setSelection((current) => {
      const next: Selection = {};
      Object.entries(current).forEach(([unitId, lineId]) => {
        const line = lines.find((item) => item.lineId === lineId);
        if (line?.units.some((unit) => unit.bikeUnitId === Number(unitId))) {
          next[Number(unitId)] = lineId;
        }
      });
      return Object.keys(next).length === Object.keys(current).length
        ? current
        : next;
    });
  }, [lines]);

  const countByLine = useMemo(() => {
    const counts: Record<number, number> = {};
    Object.values(selection).forEach((lineId) => {
      counts[lineId] = (counts[lineId] ?? 0) + 1;
    });
    return counts;
  }, [selection]);

  const selectedCount = Object.keys(selection).length;

  const selectedTotal = useMemo(
    () =>
      lines.reduce(
        (sum, line) =>
          sum +
          (countByLine[line.lineId] ?? 0) * toBikeRequestAmount(line.unitPrice),
        0
      ),
    [lines, countByLine]
  );

  const toggleUnit = (line: BikeRequestAvailableLine, unitId: number) => {
    setSubmitError(null);
    setSelection((current) => {
      if (current[unitId] === line.lineId) {
        const next = { ...current };
        delete next[unitId];
        return next;
      }
      // Elegida en otra línea, o la línea ya está completa: no se agrega.
      if (current[unitId] !== undefined) return current;
      const inLine = Object.values(current).filter(
        (lineId) => lineId === line.lineId
      ).length;
      if (inLine >= line.remainingQuantity) return current;
      return { ...current, [unitId]: line.lineId };
    });
  };

  /** Completa la línea con las primeras motos libres (las del color pedido van primero). */
  const autoFillLine = (line: BikeRequestAvailableLine) => {
    setSubmitError(null);
    setSelection((current) => {
      const next = { ...current };
      let inLine = Object.values(next).filter(
        (lineId) => lineId === line.lineId
      ).length;
      for (const unit of line.units) {
        if (inLine >= line.remainingQuantity) break;
        if (next[unit.bikeUnitId] !== undefined) continue;
        next[unit.bikeUnitId] = line.lineId;
        inLine += 1;
      }
      return next;
    });
  };

  const clearLine = (line: BikeRequestAvailableLine) => {
    setSelection((current) => {
      const next: Selection = {};
      Object.entries(current).forEach(([unitId, lineId]) => {
        if (lineId !== line.lineId) next[Number(unitId)] = lineId;
      });
      return next;
    });
  };

  /** Lo elegido, agrupado por línea, en el orden de las líneas: para el resumen. */
  const summary = useMemo(
    () =>
      lines
        .map((line) => ({
          line,
          units: line.units.filter(
            (unit) => selection[unit.bikeUnitId] === line.lineId
          ),
        }))
        .filter((group) => group.units.length > 0),
    [lines, selection]
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isFulfillingBikeRequest) return;
    onOpenChange(nextOpen);
  };

  const handleConfirm = async () => {
    setSubmitError(null);
    const trimmedInvoice = invoiceNumber.trim();
    try {
      await fulfillBikeRequest({
        bikeRequestId: bikeRequest.id,
        payload: {
          units: Object.entries(selection).map(([unitId, lineId]) => ({
            lineId,
            bikeUnitId: Number(unitId),
          })),
          ...(trimmedInvoice && { invoiceNumber: trimmedInvoice }),
        },
      });
      toast({
        title: 'Motos despachadas',
        description: `Se ${selectedCount === 1 ? 'despachó 1 moto' : `despacharon ${selectedCount} motos`} de la solicitud ${bikeRequest.code}. Arranca ya las tiene registradas.`,
      });
      onOpenChange(false);
    } catch (error) {
      const status = getBikeRequestErrorStatus(error);
      const message =
        status === 502
          ? ARRANCA_DID_NOT_CONFIRM_MESSAGE
          : getBikeRequestErrorMessage(
              error,
              'No se pudo despachar. No se despachó nada, intente de nuevo.'
            );
      setSubmitError(message);
      toast({
        title: 'No se despachó ninguna moto',
        description: message,
        variant: 'destructive',
      });
      // Un rechazo por stock o por estado significa que la lista cambió.
      if (status !== 502) {
        setStep('select');
        refetchAvailableUnits();
      }
    }
  };

  const branchName =
    availableUnits?.mcBranch?.name || bikeRequest.mcBranch?.name || '';

  const availableUnitsStatus = getBikeRequestErrorStatus(availableUnitsError);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        width="min(960px, 96vw)"
        maxHeight="92vh"
        className="flex flex-col gap-0 overflow-hidden p-0"
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader className="border-b border-gray-100 px-6 pb-4 pt-6 text-left">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Truck className="h-5 w-5 text-primary" aria-hidden />
            {step === 'select'
              ? `Despachar motos · ${bikeRequest.code}`
              : 'Confirmar despacho'}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {branchName && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" aria-hidden />
                Salen de {branchName}
              </span>
            )}
            <span>
              {step === 'select'
                ? 'Marque las motos que se entregan a Arranca. Solo aparecen motos en stock con GPS instalado.'
                : 'Revise lo que se va a enviar. Cada moto queda registrada como venta a Arranca.'}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50/60 px-6 py-5">
          {isLoadingAvailableUnits ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-sm text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
              Buscando motos disponibles en la sucursal...
            </div>
          ) : isErrorAvailableUnits ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-10 text-center text-sm text-red-700">
              <AlertTriangle className="h-6 w-6" aria-hidden />
              {availableUnitsStatus === 409
                ? 'Esta solicitud ya no está abierta (se completó o Arranca la canceló).'
                : getBikeRequestErrorMessage(
                    availableUnitsError,
                    'No se pudieron cargar las motos disponibles.'
                  )}
              {availableUnitsStatus !== 409 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchAvailableUnits()}
                >
                  Reintentar
                </Button>
              )}
            </div>
          ) : lines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-gray-500">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" aria-hidden />
              No le falta ninguna moto a esta solicitud.
            </div>
          ) : step === 'select' ? (
            <div className="flex flex-col gap-4">
              {lines.map((line) => (
                <DispatchLineSection
                  key={line.lineId}
                  line={line}
                  branchName={branchName}
                  selection={selection}
                  selectedInLine={countByLine[line.lineId] ?? 0}
                  search={searchByLine[line.lineId] ?? ''}
                  onSearchChange={(value) =>
                    setSearchByLine((current) => ({
                      ...current,
                      [line.lineId]: value,
                    }))
                  }
                  onToggle={(unitId) => toggleUnit(line, unitId)}
                  onAutoFill={() => autoFillLine(line)}
                  onClear={() => clearLine(line)}
                />
              ))}
            </div>
          ) : (
            <DispatchSummary
              summary={summary}
              invoiceNumber={invoiceNumber.trim()}
              total={selectedTotal}
              branchName={branchName}
            />
          )}
        </div>

        {!isLoadingAvailableUnits &&
          !isErrorAvailableUnits &&
          lines.length > 0 && (
            <footer className="border-t border-gray-200 bg-white px-6 py-4">
              {submitError && (
                <p
                  role="alert"
                  className="mb-3 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                >
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0"
                    aria-hidden
                  />
                  {submitError}
                </p>
              )}
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <div aria-live="polite">
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedCount === 1
                        ? '1 moto seleccionada'
                        : `${selectedCount} motos seleccionadas`}
                    </p>
                    <p className="text-sm tabular-nums text-gray-500">
                      Total {formatCurrency(selectedTotal)}
                    </p>
                  </div>
                  {step === 'select' && (
                    <label className="flex flex-col gap-1 text-xs font-medium text-gray-500">
                      N° de factura (opcional)
                      <Input
                        value={invoiceNumber}
                        maxLength={INVOICE_NUMBER_MAX_LENGTH}
                        onChange={(event) =>
                          setInvoiceNumber(event.target.value)
                        }
                        placeholder="000123"
                        className="h-9 w-full sm:w-40"
                      />
                    </label>
                  )}
                </div>

                <div className="flex gap-2">
                  {step === 'select' ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => handleOpenChange(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="lg"
                        className="px-6"
                        disabled={
                          selectedCount === 0 || isFetchingAvailableUnits
                        }
                        onClick={() => {
                          setSubmitError(null);
                          setStep('confirm');
                        }}
                      >
                        Confirmar despacho
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        disabled={isFulfillingBikeRequest}
                        onClick={() => setStep('select')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
                        Volver
                      </Button>
                      <Button
                        size="lg"
                        className="px-6"
                        disabled={
                          isFulfillingBikeRequest || selectedCount === 0
                        }
                        onClick={handleConfirm}
                      >
                        {isFulfillingBikeRequest ? (
                          <>
                            <Loader2
                              className="mr-2 h-4 w-4 animate-spin"
                              aria-hidden
                            />
                            Despachando...
                          </>
                        ) : (
                          `Despachar ${selectedCount === 1 ? '1 moto' : `${selectedCount} motos`}`
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </footer>
          )}
      </DialogContent>
    </Dialog>
  );
}

interface DispatchLineSectionProps {
  line: BikeRequestAvailableLine;
  branchName: string;
  selection: Selection;
  selectedInLine: number;
  search: string;
  onSearchChange: (value: string) => void;
  onToggle: (unitId: number) => void;
  onAutoFill: () => void;
  onClear: () => void;
}

/** Una línea pendiente: encabezado, buscador y lista de motos con tilde. */
function DispatchLineSection({
  line,
  branchName,
  selection,
  selectedInLine,
  search,
  onSearchChange,
  onToggle,
  onAutoFill,
  onClear,
}: DispatchLineSectionProps) {
  const isFull = selectedInLine >= line.remainingQuantity;
  const visibleUnits = line.units.filter((unit) => matchesSearch(unit, search));
  const freeUnits = line.units.filter(
    (unit) => selection[unit.bikeUnitId] === undefined
  ).length;

  return (
    <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-gray-900">
            {lineTitle(line)}{' '}
            <span className="font-normal text-gray-500">
              · faltan {line.remainingQuantity}
            </span>
          </h3>
          <p className="text-xs text-gray-500">
            Precio Arranca {formatCurrency(toBikeRequestAmount(line.unitPrice))}{' '}
            c/u · {line.units.length}{' '}
            {line.units.length === 1 ? 'moto disponible' : 'motos disponibles'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="w-28">
            <Progress
              value={selectedInLine}
              max={line.remainingQuantity}
              size="sm"
              tone={isFull ? 'emerald' : 'blue'}
              aria-label={`Motos elegidas para ${lineTitle(line)}`}
              aria-valuetext={`${selectedInLine} de ${line.remainingQuantity}`}
            />
            <p
              className={cn(
                'mt-1 text-right text-xs font-medium tabular-nums',
                isFull ? 'text-emerald-600' : 'text-gray-500'
              )}
            >
              {selectedInLine} / {line.remainingQuantity} elegidas
            </p>
          </div>
          {selectedInLine > 0 ? (
            <Button variant="ghost" size="sm" onClick={onClear}>
              Quitar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onAutoFill}
              disabled={freeUnits === 0}
              title="Elige las primeras motos libres, primero las del color pedido"
            >
              <Wand2 className="mr-1.5 h-4 w-4" aria-hidden />
              Elegir {Math.min(line.remainingQuantity, freeUnits)}
            </Button>
          )}
        </div>
      </header>

      {line.units.length === 0 ? (
        <div className="flex items-start gap-3 p-4 text-sm text-amber-800">
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"
            aria-hidden
          />
          <p>
            No hay motos {formatBikeRequestProduct(line.product)} con GPS
            instalado en stock en {branchName || 'esta sucursal'}. Para
            despachar esta línea, instale el GPS a una moto de este modelo o
            traslade motos a esta sucursal. El color no tiene que coincidir.
          </p>
        </div>
      ) : (
        <div className="p-4">
          {line.units.length > 1 && (
            <div className="relative mb-3">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                aria-hidden
              />
              <Input
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Buscar por placa o chasis..."
                className="h-9 pl-9"
                aria-label={`Buscar motos para ${lineTitle(line)}`}
              />
            </div>
          )}

          {visibleUnits.length === 0 ? (
            <p className="py-4 text-center text-sm text-gray-500">
              Ninguna moto coincide con &quot;{search}&quot;.
            </p>
          ) : (
            <ul className="flex max-h-80 flex-col divide-y divide-gray-100 overflow-y-auto rounded-lg border border-gray-100">
              {visibleUnits.map((unit) => {
                const pickedLineId = selection[unit.bikeUnitId];
                const isChecked = pickedLineId === line.lineId;
                const isTakenElsewhere =
                  pickedLineId !== undefined && pickedLineId !== line.lineId;
                const isDisabled = isTakenElsewhere || (!isChecked && isFull);
                const checkboxId = `dispatch-${line.lineId}-${unit.bikeUnitId}`;

                return (
                  <li key={unit.bikeUnitId}>
                    <label
                      htmlFor={checkboxId}
                      className={cn(
                        'grid cursor-pointer grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 px-3 py-2.5 text-sm transition-colors sm:grid-cols-[auto_7rem_1fr_minmax(0,12rem)_3.5rem_auto]',
                        isChecked ? 'bg-primary/5' : 'hover:bg-gray-50',
                        isDisabled && 'cursor-not-allowed opacity-50'
                      )}
                    >
                      <Checkbox
                        id={checkboxId}
                        checked={isChecked}
                        disabled={isDisabled}
                        onCheckedChange={() => onToggle(unit.bikeUnitId)}
                      />
                      <span className="font-semibold tracking-wide text-gray-900">
                        {unit.plate || 'Sin placa'}
                      </span>
                      <span className="col-start-2 flex flex-wrap items-center gap-1.5 sm:col-start-auto">
                        <span className="text-gray-700">
                          {unit.color || 'Sin color'}
                        </span>
                        {!unit.colorMatches && (
                          <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                            color distinto
                          </span>
                        )}
                        {isTakenElsewhere && (
                          <span className="rounded-full bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                            elegida en otra línea
                          </span>
                        )}
                      </span>
                      <span
                        className="col-start-2 truncate font-mono text-xs text-gray-500 sm:col-start-auto"
                        title={unit.chassis}
                      >
                        {unit.chassis || '-'}
                      </span>
                      <span className="col-start-2 text-xs tabular-nums text-gray-500 sm:col-start-auto">
                        {unit.year || '-'}
                      </span>
                      <span
                        className="col-start-2 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 sm:col-start-auto"
                        title={
                          unit.gpsImei ? `IMEI ${unit.gpsImei}` : undefined
                        }
                      >
                        <Satellite className="h-3.5 w-3.5" aria-hidden />
                        GPS ok
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

interface DispatchSummaryProps {
  summary: {
    line: BikeRequestAvailableLine;
    units: BikeRequestAvailableUnit[];
  }[];
  invoiceNumber: string;
  total: number;
  branchName: string;
}

/** Paso de confirmación: qué sale, de dónde, a qué precio y con qué factura. */
function DispatchSummary({
  summary,
  invoiceNumber,
  total,
  branchName,
}: DispatchSummaryProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        Cada moto se registra como venta a Arranca al Precio Arranca y queda en
        la Oficina Principal de Arranca, aunque físicamente sigue en{' '}
        {branchName || 'esta sucursal'}. La venta queda aprobada
        automáticamente en el balance con Arranca. Si falla la conexión con el
        sistema de Arranca, no se despacha ninguna.
      </div>

      {summary.map(({ line, units }) => {
        const unitPrice = toBikeRequestAmount(line.unitPrice);
        return (
          <section
            key={line.lineId}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <header className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-gray-900">{lineTitle(line)}</h3>
              <span className="text-sm tabular-nums text-gray-600">
                {units.length} × {formatCurrency(unitPrice)} ={' '}
                <span className="font-semibold text-gray-900">
                  {formatCurrency(units.length * unitPrice)}
                </span>
              </span>
            </header>
            <ul className="flex flex-wrap gap-2">
              {units.map((unit) => (
                <li
                  key={unit.bikeUnitId}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs"
                >
                  <span className="font-semibold text-gray-900">
                    {unit.plate || 'Sin placa'}
                  </span>
                  <span className="text-gray-500"> · {unit.color}</span>
                  {!unit.colorMatches && (
                    <span className="text-amber-700"> (color distinto)</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <dl className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm sm:grid-cols-3">
        <div>
          <dt className="text-xs text-gray-500">Motos</dt>
          <dd className="font-semibold tabular-nums text-gray-900">
            {summary.reduce((sum, group) => sum + group.units.length, 0)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">Total</dt>
          <dd className="font-semibold tabular-nums text-gray-900">
            {formatCurrency(total)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-gray-500">N° de factura</dt>
          <dd className="font-semibold text-gray-900">
            {invoiceNumber || 'Sin factura'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
