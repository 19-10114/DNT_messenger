'use client';

import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { Minus, Plus, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form.component';
import { Input } from '@/components/ui/input.component';
import { MoneyInput } from '@/components/ui/moneyInput.component';
import { Button } from '@/components/ui/button.component';
import { cn, usdFormatCurrency } from '@/lib/utils';
import {
  ExpenseFormValues,
  ExpenseLineFormValues,
  computeInvoice,
} from '@/schemas/expense.schema';
import { ExpenseCurrency } from '@/services/expenses/types/Expense.type';
import { ExpenseCategorySelect } from './expenseCategorySelect.component';
import { ExpenseInvoiceSummary } from './expenseRetentions.component';

interface ExpenseLinesEditorProps {
  /** Moneda del gasto: los montos de las filas se escriben en ella. */
  currency: ExpenseCurrency;
  /** Tasa Bs/USD, para mostrar el equivalente en USD cuando es en Bs. */
  rate: string | undefined;
  /** El bloque de IVA y retenciones, entre las líneas y el resumen. */
  taxControls?: React.ReactNode;
}

export const EMPTY_CHARGE: ExpenseLineFormValues = {
  category: '',
  concept: '',
  lineType: 'cargo',
  amount: '',
  ivaExempt: false,
};

const EMPTY_DEDUCTION: ExpenseLineFormValues = {
  ...EMPTY_CHARGE,
  lineType: 'descuento',
};

/** Columnas de una fila en escritorio: categoría, concepto, monto, quitar. */
const ROW_GRID =
  'md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_9rem_2.25rem] md:items-start';
/** Con IVA, una columna más: exento. */
const ROW_GRID_IVA =
  'md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_9rem_4rem_2.25rem] md:items-start';

/**
 * Detalle del gasto: una o más líneas, cada una con su categoría, concepto
 * opcional y monto, más descuentos opcionales (retenciones, cuotas de
 * préstamo) que se restan del pago. El monto a pagar es Σ cargos − Σ
 * descuentos. Empieza con una fila, así un gasto simple se ve como antes.
 *
 * Vive dentro del `Form` de `ExpenseForm` (usa su contexto). En móvil cada fila
 * se apila como una tarjeta.
 */
export function ExpenseLinesEditor({
  currency,
  rate,
  taxControls,
}: ExpenseLinesEditorProps) {
  const { control, formState } = useFormContext<ExpenseFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'lines' });
  const lines = useWatch({ control, name: 'lines' }) ?? [];
  const values = useWatch({ control }) as ExpenseFormValues;
  const applyIva = !!values.applyIva;
  const grid = applyIva ? ROW_GRID_IVA : ROW_GRID;

  const isBs = currency === 'BS';
  const rateValue = Number(rate);
  const toUsd = (amount: number) =>
    isBs ? (rateValue > 0 ? amount / rateValue : undefined) : amount;

  const rows = fields.map((field, index) => ({
    field,
    index,
    lineType: lines[index]?.lineType ?? field.lineType,
  }));
  const charges = rows.filter((row) => row.lineType === 'cargo');
  const deductions = rows.filter((row) => row.lineType === 'descuento');

  const invoice = computeInvoice(lines, values);

  // El error de la lista entera (sin cargos, descuentos ≥ total) viene del
  // superRefine con path ['lines'].
  const listError =
    (formState.errors.lines as { message?: string } | undefined)?.message ??
    formState.errors.lines?.root?.message;

  const renderRow = (row: (typeof rows)[number]) => {
    const isDeduction = row.lineType === 'descuento';
    // La única fila de cargo no se quita: un gasto tiene al menos una.
    const canRemove = isDeduction || charges.length > 1;
    const amount = Number(lines[row.index]?.amount) || 0;
    const usd = toUsd(amount);
    return (
      <div
        key={row.field.id}
        className={cn(
          'grid grid-cols-1 gap-2 rounded-md border p-3 md:border-0 md:p-0',
          grid,
          isDeduction && 'border-amber-200 bg-amber-50/40 md:bg-transparent'
        )}
      >
        <FormField
          control={control}
          name={`lines.${row.index}.category`}
          render={({ field }) => (
            <FormItem>
              <ExpenseCategorySelect
                value={field.value}
                onChange={field.onChange}
                only={isDeduction ? 'deduction' : 'expense'}
                placeholder={
                  isDeduction ? 'Tipo de descuento' : 'Selecciona una categoría'
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`lines.${row.index}.concept`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="Concepto (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`lines.${row.index}.amount`}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="relative">
                  {isDeduction && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-amber-700">
                      −
                    </span>
                  )}
                  {/* Con separador de miles al escribir (SAL-161); el
                      formulario recibe el número plano. */}
                  <MoneyInput
                    locale={currency}
                    placeholder={isBs ? 'Monto Bs' : 'Monto USD'}
                    className={cn('text-right', isDeduction && 'pl-6')}
                    name={field.name}
                    ref={field.ref}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                  />
                </div>
              </FormControl>
              {isBs && amount > 0 && (
                <p className="text-right text-xs text-muted-foreground">
                  {usd !== undefined
                    ? `≈ ${usdFormatCurrency(usd)}`
                    : 'Sin tasa'}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        {applyIva &&
          (isDeduction ? (
            <span className="hidden md:block" />
          ) : (
            <FormField
              control={control}
              name={`lines.${row.index}.ivaExempt`}
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 md:mt-2.5 md:justify-center">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                      aria-label="Exento de IVA"
                    />
                  </FormControl>
                  <span className="text-sm md:hidden">Exento de IVA</span>
                </FormItem>
              )}
            />
          ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="justify-self-end md:mt-1 md:h-8 md:w-8 md:p-0"
          onClick={() => remove(row.index)}
          disabled={!canRemove}
          aria-label="Quitar línea"
        >
          <X className="h-4 w-4" />
          <span className="md:hidden">Quitar</span>
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'hidden gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid',
          grid
        )}
      >
        <span>Categoría</span>
        <span>Concepto</span>
        <span className="text-right">Monto {isBs ? 'Bs' : 'USD'}</span>
        {applyIva && <span className="text-center">Exento</span>}
        <span />
      </div>

      <div className="space-y-2">{charges.map(renderRow)}</div>

      {deductions.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Descuentos (se restan del pago)
          </p>
          {deductions.map(renderRow)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_CHARGE })}
        >
          <Plus className="mr-1 h-4 w-4" /> Agregar categoría
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append({ ...EMPTY_DEDUCTION })}
        >
          <Minus className="mr-1 h-4 w-4" /> Agregar descuento
        </Button>
      </div>

      {listError && <p className="text-sm text-destructive">{listError}</p>}

      {taxControls}

      <ExpenseInvoiceSummary
        invoice={invoice}
        currency={currency}
        rate={rate}
      />
    </div>
  );
}
