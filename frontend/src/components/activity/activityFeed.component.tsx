'use client';

import React, { useMemo, useState } from 'react';
import { History, RefreshCw, Search } from 'lucide-react';
import { useDebounce } from 'use-debounce';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { FilterDate } from '@/components/ui/filterDate.component';
import { PaginationComponent } from '@/components/ui/pagination.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useActivityFeed } from '@/hooks/activity';
import { useAllBranches } from '@/hooks/useAllBranches';
import {
  ActivityEvent,
  ActivitySection,
  GetActivityFeedQueryParams,
} from '@/services/activity/types';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { BranchItem } from '@/services/branches/types/Branch.type';
import { ActivityEventItem } from './activityEventItem.component';
import {
  ACTIVITY_SEARCH_DEFAULT_PLACEHOLDER,
  ACTIVITY_SEARCH_PLACEHOLDERS,
  ACTIVITY_SECTION_LABELS,
  activityDayKey,
  formatActivityDay,
} from './activity.utils';

const PAGE_SIZE = 30;
/** Radix Select no admite `''` como valor: "todos" se representa así */
const ALL = 'all';

/**
 * Feed del registro de actividad: quién hizo qué, agrupado por día.
 *
 * Se acota a la sucursal activa como el resto del dashboard; la sucursal `0`
 * (modo Super Admin del `BranchSelector`) ve todas y puede filtrar por una.
 */
export function ActivityFeed() {
  const currentBranchId = useCurrentBranchId();
  const isAllBranchesView = currentBranchId === 0;
  const { data: branches } = useAllBranches();

  const [page, setPage] = useState(1);
  const [section, setSection] = useState<string>(ALL);
  const [actor, setActor] = useState<string>(ALL);
  const [branchFilter, setBranchFilter] = useState<string>(ALL);
  const [dates, setDates] = useState<{ start?: string; finish?: string }>({});
  const [search, setSearch] = useState('');
  // Se consulta cuando se deja de escribir, no en cada tecla
  const [debouncedSearch] = useDebounce(search.trim(), 400);

  const queryParameters: GetActivityFeedQueryParams = {
    page,
    pageSize: PAGE_SIZE,
    section: section === ALL ? undefined : (section as ActivitySection),
    actor: actor === ALL ? undefined : Number(actor),
    branch: isAllBranchesView
      ? branchFilter === ALL
        ? undefined
        : Number(branchFilter)
      : currentBranchId,
    q: debouncedSearch || undefined,
    start: dates.start,
    finish: dates.finish,
  };

  const {
    activityEvents,
    activityCurrentPage,
    activityTotalPages,
    activityTotalElements,
    activityActors,
    isLoadingActivity,
    isFetchingActivity,
    isErrorActivity,
    refetchActivity,
  } = useActivityFeed(queryParameters);

  /** Cualquier cambio de filtro vuelve a la primera página */
  const withFirstPage =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setPage(1);
    };

  const eventsByDay = useMemo(() => {
    const groups: { day: string; events: ActivityEvent[] }[] = [];
    activityEvents.forEach((event) => {
      const day = activityDayKey(event.createdAt);
      const last = groups[groups.length - 1];
      if (last && last.day === day) last.events.push(event);
      else groups.push({ day, events: [event] });
    });
    return groups;
  }, [activityEvents]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:flex-wrap md:items-end">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Sección</span>
          <Select value={section} onValueChange={withFirstPage(setSection)}>
            <SelectTrigger className="w-full md:w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todas</SelectItem>
              {(Object.keys(ACTIVITY_SECTION_LABELS) as ActivitySection[]).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {ACTIVITY_SECTION_LABELS[key]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 md:min-w-[16rem] md:flex-1">
          <span className="text-xs text-muted-foreground">Buscar</span>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => withFirstPage(setSearch)(e.target.value)}
              placeholder={
                (section !== ALL &&
                  ACTIVITY_SEARCH_PLACEHOLDERS[section as ActivitySection]) ||
                ACTIVITY_SEARCH_DEFAULT_PLACEHOLDER
              }
              className="pl-9"
              aria-label="Buscar en la actividad"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Usuario</span>
          <Select value={actor} onValueChange={withFirstPage(setActor)}>
            <SelectTrigger className="w-full md:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos</SelectItem>
              {activityActors.map((option) => (
                <SelectItem key={option.id} value={String(option.id)}>
                  {option.label || `Usuario #${option.id}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isAllBranchesView && (
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Sucursal</span>
            <Select
              value={branchFilter}
              onValueChange={withFirstPage(setBranchFilter)}
            >
              <SelectTrigger className="w-full md:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todas</SelectItem>
                {(branches ?? []).map((branch: BranchItem) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <FilterDate
          onChange={(start, finish) => {
            setDates({ start, finish });
            setPage(1);
          }}
        />

        <Button
          type="button"
          variant="outline"
          className="md:ml-auto"
          onClick={() => refetchActivity()}
          disabled={isFetchingActivity}
        >
          <RefreshCw
            className={`mr-1 h-4 w-4 ${isFetchingActivity ? 'animate-spin' : ''}`}
          />
          Actualizar
        </Button>
      </div>

      <div className="rounded-xl border bg-white p-4 md:p-6">
        {isLoadingActivity || currentBranchId === undefined ? (
          <p className="py-10 text-center text-sm text-gray-500">
            Cargando actividad…
          </p>
        ) : isErrorActivity ? (
          <p className="py-10 text-center text-sm text-red-600">
            No se pudo cargar la actividad. Intenta de nuevo.
          </p>
        ) : activityEvents.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
              <History className="h-6 w-6" aria-hidden />
            </span>
            <p className="mt-3 text-sm text-gray-500">
              No hay acciones registradas con estos filtros.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <p className="text-xs text-gray-400">
              {activityTotalElements.toLocaleString()} acciones
            </p>
            {eventsByDay.map(({ day, events }) => (
              <section key={day}>
                <h3 className="mb-3 text-sm font-semibold capitalize text-gray-700">
                  {formatActivityDay(day)}
                </h3>
                <ol>
                  {events.map((event, index) => (
                    <ActivityEventItem
                      key={event.id}
                      event={event}
                      isLast={index === events.length - 1}
                    />
                  ))}
                </ol>
              </section>
            ))}
          </div>
        )}
      </div>

      {activityTotalPages > 1 && (
        <PaginationComponent
          currentPage={activityCurrentPage}
          totalPages={activityTotalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
