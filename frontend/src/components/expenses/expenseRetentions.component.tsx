'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useExpenseTaxOptions } from '@/hooks/expenses';
import { cn, formatCurrencyBolivares, usdFormatCurrency } from '@/lib/utils';
import {
  ExpenseFormValues,
  ExpenseInvoiceTotals,
  computeInvoice,
} from '@/schemas/expense.schema';
import { ExpenseCurrency } from '@/services/expenses/types/Expense.type';
import { ModalSelectContent } from './modalSelectContent.component';

interface ExpenseTaxControlsProps {
  currency: ExpenseCurrency;
  /** Nombre del proveedor elegido como beneficiario; sin él no hay retenciones. */
  supplierName?: string;
}

/**
 * El IVA y las retenciones del gasto (Fase 3), dentro del `Form` de
 * `ExpenseForm`:
 * - «Agregar IVA» suma el IVA sobre las líneas no exentas, a la tasa elegida.
 * - Con un proveedor como beneficiario, sus retenciones de IVA (75 % / 100 %
 *   del IVA) y de ISLR (% de la base) se proponen solas y se restan del pago.
 * Los montos los recalcula el backend al guardar; aquí se muestran mientras se
 * escribe (`computeInvoice`).
 */
export function ExpenseTaxControls({
  currency,
  supplierName,
}: ExpenseTaxControlsProps) {
  const { control } = useFormContext<ExpenseFormValues>();
  const { ivaRates } = useExpenseTaxOptions();
  const values = useWatch({ control }) as ExpenseFormValues;
  const invoice = computeInvoice(values.lines ?? [], values);
  const format = (amount: number) =>
    currency === 'BS'
      ? formatCurrencyBolivares(amount)
      : usdFormatCurrency(amount);

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <div className="flex flex-wrap items-center gap-3">
        <FormField
          control={control}
          name="applyIva"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value ?? false}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormLabel className="font-medium">Agregar IVA</FormLabel>
            </FormItem>
          )}
        />
        {values.applyIva && (
          <FormField
            control={control}
            name="ivaRate"
            render={({ field }) => (
              <FormItem className="w-28 space-y-0">
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <ModalSelectContent>
                    {ivaRates.map((rate) => (
                      <SelectItem key={rate} value={String(rate)}>
                        {rate} %
                      </SelectItem>
                    ))}
                  </ModalSelectContent>
                </Select>
              </FormItem>
            )}
          />
        )}
        {values.applyIva && (
          <span className="text-sm text-muted-foreground">
            sobre {format(invoice.taxable)} → +{format(invoice.iva)}
          </span>
        )}
      </div>

      {supplierName ? (
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Retenciones de {supplierName} (se restan del pago)
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <FormField
              control={control}
              name="retainIva"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      disabled={!values.applyIva}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel
                    className={cn(!values.applyIva && 'text-muted-foreground')}
                  >
                    Retención de IVA
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="ivaRetentionRate"
              render={({ field }) => (
                <FormItem className="w-24 space-y-0">
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!values.applyIva || !values.retainIva}
                  >
                    <FormControl>
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <ModalSelectContent>
                      <SelectItem value="75">75 %</SelectItem>
                      <SelectItem value="100">100 %</SelectItem>
                    </ModalSelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <span className="text-sm text-muted-foreground">
              {!values.applyIva
                ? 'Marca «Agregar IVA» para retenerlo'
                : values.retainIva
                  ? `del IVA ${format(invoice.iva)} → −${format(invoice.retainedIva)}`
                  : 'No se retiene'}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <FormField
              control={control}
              name="retainIslr"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value ?? false}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel>Retención de ISLR</FormLabel>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="islrRate"
              render={({ field }) => (
                <FormItem className="w-24 space-y-0">
                  <FormControl>
                    <div className="relative">
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.01"
                        min="0"
                        max="100"
                        className="h-8 pr-6 text-right"
                        disabled={!values.retainIslr}
                        {...field}
                      />
                      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        %
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <span className="text-sm text-muted-foreground">
              {values.retainIslr
                ? `de la base ${format(invoice.base)} → −${format(invoice.retainedIslr)}`
                : 'No se retiene'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Para retener IVA o ISLR, elige un proveedor como beneficiario.
        </p>
      )}
    </div>
  );
}

/** El resumen de la factura al pie del detalle: de la base al neto pagado. */
export function ExpenseInvoiceSummary({
  invoice,
  currency,
  rate,
}: {
  invoice: ExpenseInvoiceTotals;
  currency: ExpenseCurrency;
  rate: string | undefined;
}) {
  const isBs = currency === 'BS';
  const rateValue = Number(rate);
  const format = (amount: number) =>
    isBs ? formatCurrencyBolivares(amount) : usdFormatCurrency(amount);
  const retained = invoice.retainedIva + invoice.retainedIslr;
  const hasTaxes = invoice.iva > 0 || retained > 0;
  const net = invoice.net > 0 ? invoice.net : 0;
  const netUsd = isBs ? (rateValue > 0 ? net / rateValue : undefined) : net;

  return (
    <div className="flex flex-col items-end gap-0.5 rounded-md bg-muted/40 px-3 py-2 text-sm">
      {hasTaxes && (
        <>
          <span className="text-muted-foreground">
            Base imponible {format(invoice.base)}
          </span>
          {invoice.iva > 0 && (
            <span className="text-muted-foreground">
              IVA +{format(invoice.iva)}
            </span>
          )}
          <span className="font-medium">
            Total factura {format(invoice.total)}
          </span>
          {invoice.retainedIva > 0 && (
            <span className="text-amber-700">
              Retención IVA −{format(invoice.retainedIva)}
            </span>
          )}
          {invoice.retainedIslr > 0 && (
            <span className="text-amber-700">
              Retención ISLR −{format(invoice.retainedIslr)}
            </span>
          )}
        </>
      )}
      {!hasTaxes && invoice.deductions > 0 && (
        <span className="text-muted-foreground">
          Cargos {format(invoice.base)}
        </span>
      )}
      {invoice.deductions > 0 && (
        <span className="text-amber-700">
          Descuentos −{format(invoice.deductions)}
        </span>
      )}
      <span className="font-semibold">
        {hasTaxes ? 'Neto a pagar' : 'Total a pagar'} {format(net)}
        {isBs && netUsd !== undefined && net > 0 && (
          <span className="ml-2 font-normal text-muted-foreground">
            ≈ {usdFormatCurrency(netUsd)}
          </span>
        )}
      </span>
      {retained > 0 && (
        <span className="text-xs text-muted-foreground">
          Lo retenido ({format(retained)}) se le paga al SENIAT, no al
          proveedor. La caja descuenta solo el neto.
        </span>
      )}
    </div>
  );
}
