'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { MoneyInput } from '@/components/ui/moneyInput.component';
import { Textarea } from '@/components/ui/textarea.component';
import { useToast } from '@/components/ui/use-toast';
import { ReceiptUpload } from '@/components/expenses/receiptUpload.component';
import { useBranchCash } from '@/hooks/useTransactions';
import { useCreateCashWithdrawal } from '@/hooks/cashWithdrawals';
import { cn, usdFormatCurrency } from '@/lib/utils';
import {
  CASH_WITHDRAWAL_DESTINATIONS,
  CashWithdrawalFormValues,
  CashWithdrawalSchema,
} from '@/schemas/cashWithdrawal.schema';
import { useToken } from '@/stores/auth/auth.store';
import {
  DESTINATION_LABELS,
  getCashWithdrawalErrorMessage,
} from './cashWithdrawal.utils';

interface CashWithdrawalFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: number;
  branchName?: string;
}

const DEFAULT_VALUES: CashWithdrawalFormValues = {
  destination: 'deposito_banco',
  concept: '',
  deliveredTo: '',
  reference: '',
  amountUsd: '',
  notes: '',
  receipt: undefined,
};

/**
 * Registrar una salida de efectivo: USD que sale de la caja de la sucursal
 * (depósito, entrega a un socio...). No es un gasto ni pasa por aprobación:
 * baja el efectivo de la sede al guardarse y aparece en "Movimientos en
 * efectivo". El formulario se monta al abrir, así cada salida empieza en
 * blanco.
 */
export function CashWithdrawalFormModal({
  open,
  onOpenChange,
  branchId,
  branchName,
}: CashWithdrawalFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-xl flex-col gap-0 overflow-hidden p-0"
        // Solo desplaza el cuerpo: DialogContent pone `overflowY: auto` en
        // línea y, sin esto, el modal también hacía scroll (doble barra).
        style={{ width: '75%', maxHeight: '90vh', overflowY: 'hidden' }}
      >
        <DialogHeader className="border-b px-6 pb-4 pt-6">
          <DialogTitle>Salida de efectivo</DialogTitle>
          <DialogDescription>
            Efectivo en USD que sale de la caja
            {branchName ? ` de ${branchName}` : ' de la sucursal'}. No es un
            gasto: solo descuenta el efectivo de la sede.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <CashWithdrawalForm
            branchId={branchId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CashWithdrawalForm({
  branchId,
  onDone,
}: {
  branchId: number;
  onDone: () => void;
}) {
  const token = useToken();
  const { toast } = useToast();
  const { data: branchCash } = useBranchCash(token, String(branchId));
  const available: number | undefined =
    typeof branchCash?.cash === 'number' ? branchCash.cash : undefined;
  const createMutation = useCreateCashWithdrawal();

  const form = useForm<CashWithdrawalFormValues>({
    resolver: zodResolver(CashWithdrawalSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const destination = useWatch({ control: form.control, name: 'destination' });
  const amount = Number(useWatch({ control: form.control, name: 'amountUsd' }));

  const onSubmit = async (values: CashWithdrawalFormValues) => {
    if (available !== undefined && values.amountUsd && amount > available) {
      form.setError('amountUsd', {
        message: `La sucursal tiene ${usdFormatCurrency(available)} en efectivo`,
      });
      return;
    }
    try {
      const withdrawal = await createMutation.mutateAsync({
        branch: branchId,
        destination: values.destination,
        concept: values.concept || undefined,
        deliveredTo: values.deliveredTo,
        reference: values.reference || undefined,
        amountUsd: values.amountUsd,
        notes: values.notes || undefined,
        receipt: values.receipt,
      });
      toast({
        title: `Salida ${withdrawal.displayCode} registrada`,
        description: `${usdFormatCurrency(withdrawal.amountUsd)} descontados del efectivo de la sucursal.`,
      });
      onDone();
    } catch (error) {
      toast({
        title: 'No se pudo registrar la salida',
        description: getCashWithdrawalErrorMessage(
          error,
          'Inténtalo de nuevo.'
        ),
        variant: 'destructive',
      });
    }
  };

  const isOther = destination === 'otro';

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div className="rounded-md bg-muted/40 px-3 py-2 text-sm">
            Efectivo disponible:{' '}
            <span className="font-semibold">
              {available !== undefined
                ? usdFormatCurrency(available)
                : 'Cargando...'}
            </span>
          </div>

          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Destino</FormLabel>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CASH_WITHDRAWAL_DESTINATIONS.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant="outline"
                      aria-pressed={field.value === value}
                      className={cn(
                        'justify-start',
                        field.value === value &&
                          'border-primary bg-primary/10 text-primary hover:bg-primary/15'
                      )}
                      onClick={() => field.onChange(value)}
                    >
                      {DESTINATION_LABELS[value]}
                    </Button>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="amountUsd"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto USD</FormLabel>
                  <FormControl>
                    <MoneyInput
                      locale="USD"
                      placeholder="0.00"
                      className="text-right"
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deliveredTo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entregado a</FormLabel>
                  <FormControl>
                    <Input placeholder="Quién recibe el efectivo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="concept"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isOther ? 'Motivo' : 'Motivo (opcional)'}
                </FormLabel>
                <FormControl>
                  <Input placeholder="Para qué es el efectivo" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>N° de depósito o referencia (opcional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="receipt"
            render={({ field, fieldState }) => (
              <FormItem>
                <FormLabel>Comprobante (opcional)</FormLabel>
                <ReceiptUpload
                  value={field.value}
                  onChange={field.onChange}
                  invalid={!!fieldState.error}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observaciones (opcional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <DialogFooter className="gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isLoading}>
            {createMutation.isLoading
              ? 'Registrando...'
              : amount > 0
                ? `Registrar salida de ${usdFormatCurrency(amount)}`
                : 'Registrar salida'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
