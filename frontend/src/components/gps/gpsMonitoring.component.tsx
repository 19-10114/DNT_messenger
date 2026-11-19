'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  MapPin,
  RefreshCw,
  Satellite,
  Wrench,
} from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { useAllBranches } from '@/hooks';
import { useGpsUnits, useGpsUnitActions } from '@/hooks/gps';
import { cn } from '@/lib/utils';
import { GpsUnit } from '@/services/gps/types';
import {
  GPS_STATUS_DOT_CLASSES,
  GPS_STATUS_LABELS,
  GPS_STATUS_ORDER,
  countGpsUnitsByStatus,
  filterGpsUnitsByTerm,
  isGpsUnitAvailable,
} from './gps.utils';
import { GpsKpiCard } from './gpsKpiCard.component';
import { GpsTabbedTable, GpsTableTab } from './gpsTabbedTable.component';
import { GpsTransfersPanel } from './gpsTransfersPanel.component';

/** Valor del filtro de sucursal que significa "sin filtrar". */
const ALL_BRANCHES = 'all';

function getSharePercentage(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Monitoreo de GPS: el estado del parque de unidades de un vistazo.
 *
 * Trabaja sobre un único snapshot del inventario (ver `useGpsUnits`), así que
 * los indicadores, las dos tablas y sus pestañas siempre cuentan exactamente
 * el mismo universo, y filtrar o cambiar de pestaña no dispara consultas.
 */
export function GpsMonitoring() {
  const {
    gpsUnits,
    isAllBranchesGpsView,
    isTruncatedGpsUnits,
    isLoadingGpsUnits,
    isFetchingGpsUnits,
    isErrorGpsUnits,
    refetchGpsUnits,
  } = useGpsUnits();

  const { toast } = useToast();
  const {
    approveGpsUnit,
    rejectGpsUnit,
    setGpsUnitBranch,
    isRejectingGpsUnit,
    isActingOnGpsUnit,
  } = useGpsUnitActions();
  // Todas las sucursales MC, no solo las que hoy tienen unidades: son los
  // destinos posibles al mover una unidad, no un filtro sobre lo que ya hay.
  const { data: allBranches } = useAllBranches();

  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState<string>(ALL_BRANCHES);
  /** Unidad esperando confirmación de rechazo; `null` = diálogo cerrado. */
  const [unitToReject, setUnitToReject] = useState<GpsUnit | null>(null);
  /** Unidad cuyo cambio de sucursal está viajando, para animar solo esa fila. */
  const [savingBranchUnitId, setSavingBranchUnitId] = useState<number | null>(
    null
  );

  const handleApprove = async (unit: GpsUnit) => {
    try {
      await approveGpsUnit(unit.id);
      toast({
        title: 'Unidad aprobada',
        description: `${unit.imei} quedó disponible y en sucursal en Arranca.`,
      });
    } catch {
      toast({
        title: 'No se pudo aprobar la unidad',
        description:
          'El cambio no se guardó. Si Arranca no respondió, volvé a intentar en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  const handleBranchChange = async (unit: GpsUnit, targetBranch: number) => {
    setSavingBranchUnitId(unit.id);
    try {
      await setGpsUnitBranch({ gpsUnitId: unit.id, targetBranch });
      const branchName =
        allBranches?.find((branch) => branch.id === targetBranch)?.name ??
        'la otra sucursal';
      // De una sucursal a otra es un traslado: la que recibe lo acepta o lo
      // rechaza. Una unidad sin sucursal se asigna sin más.
      toast(
        unit.targetBranch
          ? {
              title: 'Traslado enviado',
              description: `${unit.imei} ya figura en ${branchName}, que tiene que aceptarlo o rechazarlo.`,
            }
          : {
              title: 'Sucursal actualizada',
              description: `${unit.imei} quedó en ${branchName}.`,
            }
      );
    } catch {
      toast({
        title: 'No se pudo cambiar la sucursal',
        description:
          'El cambio no se guardó. Si Arranca no respondió, volvé a intentar en unos segundos.',
        variant: 'destructive',
      });
    } finally {
      setSavingBranchUnitId(null);
    }
  };

  const handleReject = async () => {
    if (!unitToReject) return;

    try {
      await rejectGpsUnit(unitToReject.id);
      toast({
        title: 'Unidad rechazada',
        description: `${unitToReject.imei} se eliminó y quedó liberada en Arranca.`,
      });
      setUnitToReject(null);
    } catch {
      toast({
        title: 'No se pudo rechazar la unidad',
        description:
          'La unidad sigue en el listado. Si Arranca no respondió, volvé a intentar en unos segundos.',
        variant: 'destructive',
      });
    }
  };

  /** Sucursales realmente presentes en el parque, para no ofrecer filtros vacíos. */
  const branchOptions = useMemo(() => {
    const branches = new Map<number, string>();
    gpsUnits.forEach((unit) => {
      if (unit.targetBranch)
        branches.set(unit.targetBranch.id, unit.targetBranch.name);
    });
    return Array.from(branches, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [gpsUnits]);

  const filteredUnits = useMemo(() => {
    const byBranch = gpsUnits.filter((unit: GpsUnit) => {
      if (branchFilter === ALL_BRANCHES) return true;
      return String(unit.targetBranch?.id) === branchFilter;
    });

    return filterGpsUnitsByTerm(byBranch, search);
  }, [gpsUnits, branchFilter, search]);

  const availableUnits = useMemo(
    () => filteredUnits.filter(isGpsUnitAvailable),
    [filteredUnits]
  );
  const unavailableUnits = useMemo(
    () => filteredUnits.filter((unit) => !isGpsUnitAvailable(unit)),
    [filteredUnits]
  );
  const statusCounts = useMemo(
    () => countGpsUnitsByStatus(filteredUnits),
    [filteredUnits]
  );

  const totalUnits = filteredUnits.length;
  const isFiltered = search.trim() !== '' || branchFilter !== ALL_BRANCHES;
  const scopeHint = isAllBranchesGpsView
    ? 'Parque completo'
    : 'Unidades de esta sucursal';

  const availabilityTabs: GpsTableTab[] = [
    {
      key: 'available',
      label: 'Disponibles',
      units: availableUnits,
      dotClassName: GPS_STATUS_DOT_CLASSES.available,
      emptyMessage: 'No hay unidades disponibles con estos filtros.',
    },
    {
      key: 'unavailable',
      label: 'No disponibles',
      units: unavailableUnits,
      dotClassName: 'bg-gray-400',
      emptyMessage: 'No hay unidades comprometidas con estos filtros.',
    },
  ];

  const statusTabs: GpsTableTab[] = GPS_STATUS_ORDER.map((status) => ({
    key: status,
    label: GPS_STATUS_LABELS[status],
    units: filteredUnits.filter((unit) => unit.status === status),
    dotClassName: GPS_STATUS_DOT_CLASSES[status],
    emptyMessage: `No hay unidades en estado "${GPS_STATUS_LABELS[status]}" con estos filtros.`,
  }));

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <SearchInput
            placeholder="Buscar por IMEI, línea, equipo o responsable..."
            onSearch={setSearch}
            className="w-full sm:max-w-sm"
          />
          {/* Filtrar por sucursal solo tiene sentido viendo el parque entero:
              una sucursal ya ve únicamente lo suyo. */}
          {isAllBranchesGpsView && (
            <Select value={branchFilter} onValueChange={setBranchFilter}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="Todas las sucursales" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_BRANCHES}>
                  Todas las sucursales
                </SelectItem>
                {branchOptions.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchGpsUnits()}
          disabled={isFetchingGpsUnits}
          className="self-start md:self-auto"
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isFetchingGpsUnits && 'animate-spin')}
          />
          {isFetchingGpsUnits ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </section>

      {isErrorGpsUnits && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            No se pudieron cargar las unidades GPS. Intentá actualizar en unos
            segundos.
          </span>
        </div>
      )}

      {isTruncatedGpsUnits && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            El parque supera las 5.000 unidades: las tablas y los indicadores
            muestran solo las más recientes.
          </span>
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <GpsKpiCard
          label={isFiltered ? 'Unidades filtradas' : 'Unidades totales'}
          value={totalUnits}
          hint={isFiltered ? 'Sobre el parque filtrado' : scopeHint}
          icon={Satellite}
          isLoading={isLoadingGpsUnits}
        />
        <GpsKpiCard
          label="Disponibles"
          value={availableUnits.length}
          hint={`${getSharePercentage(availableUnits.length, totalUnits)}% del parque`}
          icon={CheckCircle2}
          tone="available"
          meterPercentage={getSharePercentage(
            availableUnits.length,
            totalUnits
          )}
          isLoading={isLoadingGpsUnits}
        />
        <GpsKpiCard
          label="No disponibles"
          value={unavailableUnits.length}
          hint="Pendientes, en sucursal, en calle o instaladas"
          icon={Wrench}
          tone="pending"
          meterPercentage={getSharePercentage(
            unavailableUnits.length,
            totalUnits
          )}
          isLoading={isLoadingGpsUnits}
        />
        <GpsKpiCard
          label="En calle"
          value={statusCounts.on_street}
          hint="Vendidas, con su cliente final"
          icon={MapPin}
          isLoading={isLoadingGpsUnits}
        />
        <GpsKpiCard
          label="Instaladas"
          value={statusCounts.installed}
          hint={`${getSharePercentage(statusCounts.installed, totalUnits)}% del parque`}
          icon={Satellite}
          tone="installed"
          meterPercentage={getSharePercentage(
            statusCounts.installed,
            totalUnits
          )}
          isLoading={isLoadingGpsUnits}
        />
      </section>

      <GpsTransfersPanel />

      <GpsTabbedTable
        title="Disponibilidad de unidades"
        description="Qué hay listo para entregar y qué está comprometido."
        tabs={availabilityTabs}
        isLoading={isLoadingGpsUnits}
        onApprove={handleApprove}
        onReject={setUnitToReject}
        branches={allBranches ?? []}
        onBranchChange={handleBranchChange}
        savingBranchUnitId={savingBranchUnitId}
        isReviewing={isActingOnGpsUnit}
      />

      <GpsTabbedTable
        title="Unidades por estado"
        description="El mismo parque, abierto por cada etapa del ciclo de vida."
        tabs={statusTabs}
        isLoading={isLoadingGpsUnits}
        hideStatusColumn
        onApprove={handleApprove}
        onReject={setUnitToReject}
        branches={allBranches ?? []}
        onBranchChange={handleBranchChange}
        savingBranchUnitId={savingBranchUnitId}
        isReviewing={isActingOnGpsUnit}
      />

      <ConfirmDialog
        open={unitToReject !== null}
        onOpenChange={(open) => !open && setUnitToReject(null)}
        title="¿Rechazar esta unidad?"
        description={
          <>
            Se va a <strong>eliminar</strong> la unidad {unitToReject?.imei} de
            Moto Candela y quedará disponible en Arranca, sin sucursal. No se
            puede deshacer.
          </>
        }
        confirmLabel="Rechazar y eliminar"
        destructive
        isLoading={isRejectingGpsUnit}
        onConfirm={handleReject}
      />
    </div>
  );
}
