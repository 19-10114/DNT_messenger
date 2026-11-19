'use client';

import { useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, Eraser, Sparkles, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form.component';
import { Input } from '@/components/ui/input.component';
import {
  MonthSelect,
  monthLabel,
  shiftMonth,
} from '@/components/ui/monthSelect.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useFetchSalesTargetsConfig,
  useNonWorkingDayMutations,
  useSalesTargetsConfig,
  useSaveSalesTargets,
} from '@/hooks/salesTargets';
import {
  NonWorkingDayFormSchema,
  NonWorkingDayFormValues,
  SalesTargetsFormSchema,
  SalesTargetsFormValues,
  parseAmount,
} from '@/schemas/salesTargets.schema';
import { SalesTargetConfig } from '@/services/salesTargets/types';
import {
  formatDecimal,
  formatInt,
  formatShortDate,
  monthBounds,
  salesTargetsErrorMessage,
} from './salesTargets.utils';

const ALL_BRANCHES = 'all';

const toFormRows = (config: SalesTargetConfig) =>
  config.rows.map((row) => ({
    branchId: row.branch.id,
    targetUnits: row.targetUnits === null ? '' : String(row.targetUnits),
    targetUsd: row.targetUsd === null ? '' : String(row.targetUsd),
  }));

interface TargetsConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `YYYY-MM` con el que se abre. */
  initialMonth: string;
}

/**
 * Configuración de un mes (solo admin): la meta de cada sucursal, con la
 * sugerida según su histórico, y los días no hábiles.
 */
export function TargetsConfigModal({
  open,
  onOpenChange,
  initialMonth,
}: TargetsConfigModalProps) {
  const [month, setMonth] = useState(initialMonth);
  useEffect(() => {
    if (open) setMonth(initialMonth);
  }, [open, initialMonth]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent width="min(1000px, 95vw)" maxHeight="90vh">
        <DialogHeader>
          <DialogTitle>Configurar metas</DialogTitle>
          <DialogDescription>
            Meta mensual de motos por sucursal y días no hábiles. La meta diaria
            se reparte sola entre los días hábiles del mes.
          </DialogDescription>
        </DialogHeader>
        <label className="grid max-w-xs gap-1 text-xs font-medium text-gray-500">
          Mes
          <MonthSelect
            value={month}
            onValueChange={setMonth}
            futureMonths={3}
          />
        </label>
        <Tabs defaultValue="targets">
          <TabsList>
            <TabsTrigger value="targets">Metas</TabsTrigger>
            <TabsTrigger value="days">Días no hábiles</TabsTrigger>
          </TabsList>
          <TabsContent value="targets">
            <TargetsTab
              month={month}
              open={open}
              onSaved={() => onOpenChange(false)}
            />
          </TabsContent>
          <TabsContent value="days">
            <NonWorkingDaysTab month={month} open={open} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function TargetsTab({
  month,
  open,
  onSaved,
}: {
  month: string;
  open: boolean;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const { targetsConfig, isLoadingTargetsConfig, isErrorTargetsConfig } =
    useSalesTargetsConfig(month, open);
  const { saveSalesTargets, isSavingSalesTargets } = useSaveSalesTargets(month);
  const fetchConfig = useFetchSalesTargetsConfig();
  const [growth, setGrowth] = useState('0');
  const [isCopying, setIsCopying] = useState(false);

  const form = useForm<SalesTargetsFormValues>({
    resolver: zodResolver(SalesTargetsFormSchema),
    defaultValues: { rows: [] },
  });
  const { fields } = useFieldArray({ control: form.control, name: 'rows' });
  const rows = useWatch({ control: form.control, name: 'rows' });

  useEffect(() => {
    if (targetsConfig) form.reset({ rows: toFormRows(targetsConfig) });
  }, [targetsConfig, form]);

  const total = (rows ?? []).reduce(
    (sum, row) => sum + (Number(row.targetUnits) || 0),
    0
  );

  /** Rellena solo las metas vacías; nunca pisa lo ya escrito. */
  const fillEmpty = (value: (branchId: number) => number | null) => {
    let filled = 0;
    form.getValues('rows').forEach((row, index) => {
      if (row.targetUnits.trim() !== '') return;
      const units = value(row.branchId);
      if (units && units > 0) {
        form.setValue(`rows.${index}.targetUnits`, String(units), {
          shouldDirty: true,
        });
        filled += 1;
      }
    });
    return filled;
  };

  const copyPrevious = async () => {
    setIsCopying(true);
    try {
      const previous = await fetchConfig(shiftMonth(month, -1));
      const byBranch = new Map(
        previous.rows.map((row) => [row.branch.id, row.targetUnits])
      );
      const filled = fillEmpty((branchId) => byBranch.get(branchId) ?? null);
      toast({
        title: filled
          ? `Se copiaron ${filled} metas de ${monthLabel(shiftMonth(month, -1))}`
          : 'No había metas que copiar en las sucursales vacías',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo leer el mes anterior',
        description: salesTargetsErrorMessage(error, 'Intenta de nuevo.'),
      });
    } finally {
      setIsCopying(false);
    }
  };

  /** Vacía todas las metas del formulario. Nada se borra hasta guardar. */
  const clearAll = () => {
    const filled = form
      .getValues('rows')
      .filter((row) => row.targetUnits !== '' || row.targetUsd !== '').length;
    form.getValues('rows').forEach((_, index) => {
      form.setValue(`rows.${index}.targetUnits`, '', { shouldDirty: true });
      form.setValue(`rows.${index}.targetUsd`, '', { shouldDirty: true });
    });
    toast({
      title: filled
        ? `Se vaciaron ${filled} metas`
        : 'No había metas que limpiar',
      description: filled
        ? 'Pulsa "Guardar metas" para dejar esas sucursales sin meta.'
        : undefined,
    });
  };

  const applySuggested = () => {
    const factor = 1 + (Number(growth.replace(',', '.')) || 0) / 100;
    const suggested = new Map(
      (targetsConfig?.rows ?? []).map((row) => [
        row.branch.id,
        row.suggestedUnits,
      ])
    );
    const filled = fillEmpty((branchId) => {
      const value = suggested.get(branchId);
      return value ? Math.round(value * factor) : null;
    });
    toast({
      title: filled
        ? `Se aplicaron ${filled} metas sugeridas`
        : 'No había sugerencias para las sucursales vacías',
    });
  };

  const onSubmit = async (values: SalesTargetsFormValues) => {
    try {
      await saveSalesTargets(
        values.rows.map((row) => ({
          branchId: row.branchId,
          targetUnits: row.targetUnits === '' ? null : Number(row.targetUnits),
          targetUsd: parseAmount(row.targetUsd),
        }))
      );
      toast({ title: `Metas de ${monthLabel(month)} guardadas` });
      onSaved();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudieron guardar las metas',
        description: salesTargetsErrorMessage(error, 'Intenta de nuevo.'),
      });
    }
  };

  if (isErrorTargetsConfig) {
    return (
      <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo cargar la configuración del mes.
      </p>
    );
  }
  if (isLoadingTargetsConfig || !targetsConfig) {
    return <div className="h-64 animate-pulse rounded-lg bg-gray-50" />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={copyPrevious}
            disabled={isCopying}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copiar del mes anterior
          </Button>
          <div className="flex items-end gap-2">
            <label className="grid gap-1 text-xs font-medium text-gray-500">
              Crecimiento %
              <Input
                value={growth}
                onChange={(event) => setGrowth(event.target.value)}
                inputMode="decimal"
                className="w-20"
              />
            </label>
            <Button type="button" variant="outline" onClick={applySuggested}>
              <Sparkles className="mr-2 h-4 w-4" />
              Aplicar sugeridas
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={clearAll}>
            <Eraser className="mr-2 h-4 w-4" />
            Limpiar metas
          </Button>
          <span className="text-xs text-gray-500 lg:ml-auto">
            Solo se rellenan las metas vacías. Vacío al guardar = sin meta.
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2 text-left">Sucursal</th>
                <th className="px-3 py-2 text-right">Sugerida</th>
                <th className="px-3 py-2 text-left">Meta (motos)</th>
                <th className="px-3 py-2 text-left">Meta USD (opcional)</th>
                <th className="px-3 py-2 text-right">Por día</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field, index) => {
                const config = targetsConfig.rows[index];
                const units = Number(rows?.[index]?.targetUnits) || 0;
                return (
                  <tr key={field.id} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium text-gray-900">
                      {config?.branch.name}
                    </td>
                    <td className="px-3 py-2 text-right text-gray-400 tabular-nums">
                      {formatInt(config?.suggestedUnits)}
                    </td>
                    <td className="px-3 py-1.5">
                      <FormField
                        control={form.control}
                        name={`rows.${index}.targetUnits`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...input}
                                inputMode="numeric"
                                className="h-8 w-28"
                                aria-label={`Meta de ${config?.branch.name}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-3 py-1.5">
                      <FormField
                        control={form.control}
                        name={`rows.${index}.targetUsd`}
                        render={({ field: input }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                {...input}
                                inputMode="decimal"
                                className="h-8 w-36"
                                aria-label={`Meta en USD de ${config?.branch.name}`}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500 tabular-nums">
                      {units && config?.workingDays
                        ? formatDecimal(units / config.workingDays)
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 bg-gray-50 font-semibold">
                <td className="px-3 py-2">Total</td>
                <td />
                <td className="px-3 py-2 tabular-nums">{formatInt(total)}</td>
                <td />
                <td className="px-3 py-2 text-right tabular-nums">
                  {total && targetsConfig.workingDays
                    ? formatDecimal(total / targetsConfig.workingDays)
                    : '—'}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="text-xs text-gray-500">
          {monthLabel(month)} tiene {targetsConfig.workingDays} días hábiles
          (lunes a sábado, sin feriados). La sugerida es el promedio de los
          últimos 3 meses con al menos 10 motos.
        </p>
        <DialogFooter>
          <Button type="submit" disabled={isSavingSalesTargets}>
            {isSavingSalesTargets ? 'Guardando…' : 'Guardar metas'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function NonWorkingDaysTab({ month, open }: { month: string; open: boolean }) {
  const { toast } = useToast();
  const { targetsConfig, nonWorkingDays, isLoadingNonWorkingDays } =
    useSalesTargetsConfig(month, open);
  const {
    createNonWorkingDay,
    isCreatingNonWorkingDay,
    deleteNonWorkingDay,
    isDeletingNonWorkingDay,
  } = useNonWorkingDayMutations();
  const { first, last } = monthBounds(month);

  const form = useForm<NonWorkingDayFormValues>({
    resolver: zodResolver(NonWorkingDayFormSchema),
    defaultValues: { date: '', scope: ALL_BRANCHES, reason: '' },
  });

  const onSubmit = async (values: NonWorkingDayFormValues) => {
    try {
      await createNonWorkingDay({
        date: values.date,
        branchId: values.scope === ALL_BRANCHES ? null : Number(values.scope),
        reason: values.reason,
      });
      form.reset({ date: '', scope: values.scope, reason: '' });
      toast({ title: 'Día no hábil añadido' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo añadir el día',
        description: salesTargetsErrorMessage(error, 'Intenta de nuevo.'),
      });
    }
  };

  const remove = async (id: number) => {
    try {
      await deleteNonWorkingDay(id);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'No se pudo eliminar el día',
        description: salesTargetsErrorMessage(error, 'Intenta de nuevo.'),
      });
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-3 rounded-lg border border-gray-200 p-3 md:flex-row md:items-start"
        >
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <span className="text-xs font-medium text-gray-500">Fecha</span>
                <FormControl>
                  <Input
                    type="date"
                    min={first}
                    max={last}
                    className="w-40"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="scope"
            render={({ field }) => (
              <FormItem>
                <span className="text-xs font-medium text-gray-500">
                  Sucursal
                </span>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-52">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={ALL_BRANCHES}>
                      Todas las sucursales
                    </SelectItem>
                    {targetsConfig?.rows.map((row) => (
                      <SelectItem
                        key={row.branch.id}
                        value={String(row.branch.id)}
                      >
                        {row.branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem className="flex-1">
                <span className="text-xs font-medium text-gray-500">
                  Motivo
                </span>
                <FormControl>
                  <Input placeholder="Feriado, inventario…" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="md:mt-5"
            disabled={isCreatingNonWorkingDay}
          >
            Añadir
          </Button>
        </form>
      </Form>

      {isLoadingNonWorkingDays ? (
        <div className="h-24 animate-pulse rounded-lg bg-gray-50" />
      ) : nonWorkingDays.length === 0 ? (
        <p className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-500">
          {monthLabel(month)} no tiene días no hábiles. Todos los lunes a
          sábados cuentan.
        </p>
      ) : (
        <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
          {nonWorkingDays.map((day) => (
            <li
              key={day.id}
              className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
            >
              <span className="w-24 font-medium tabular-nums">
                {formatShortDate(day.date)}
              </span>
              <span className="w-44 text-gray-600">
                {day.branchName ?? 'Todas las sucursales'}
              </span>
              <span className="flex-1 text-gray-500">{day.reason || '—'}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(day.id)}
                disabled={isDeletingNonWorkingDay}
                aria-label={`Eliminar ${formatShortDate(day.date)}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
