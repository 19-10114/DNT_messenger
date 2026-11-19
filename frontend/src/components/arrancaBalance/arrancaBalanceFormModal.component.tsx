'use client';

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Input } from '@/components/ui/input.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { Textarea } from '@/components/ui/textarea.component';
import { useAllBranches } from '@/hooks';
import {
  ArrancaBalanceFormValues,
  ArrancaBalanceSchema,
} from '@/schemas/arrancaBalance.schema';
import {
  ARRANCA_BALANCE_DIRECTIONS,
  ArrancaBalance,
  ArrancaBalancePayload,
} from '@/services/arrancaBalance/types';
import { BranchItem } from '@/services/branches/types/Branch.type';
import { ARRANCA_BALANCE_DIRECTION_LABELS } from './arrancaBalance.utils';

interface ArrancaBalanceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Con un movimiento, el modal edita; sin él, crea uno nuevo. */
  arrancaBalance?: ArrancaBalance | null;
  /** Sucursal activa; al crear se propone esa (salvo `0`, todas). */
  defaultBranchId?: number;
  isSubmitting?: boolean;
  onSubmit: (payload: ArrancaBalancePayload) => Promise<void>;
}

function getDefaultValues(
  arrancaBalance?: ArrancaBalance | null,
  defaultBranchId?: number
): Partial<ArrancaBalanceFormValues> {
  if (!arrancaBalance) {
    return {
      amount: '',
      concept: '',
      direction: undefined,
      branch: defaultBranchId ? String(defaultBranchId) : '',
      observations: '',
    };
  }
  return {
    amount: String(arrancaBalance.amount),
    concept: arrancaBalance.concept,
    direction: arrancaBalance.direction,
    branch: arrancaBalance.branch ? String(arrancaBalance.branch.id) : '',
    observations: arrancaBalance.observations ?? '',
  };
}

/**
 * Alta y edición de un movimiento con Arranca.
 *
 * No hay campo de estado: todo movimiento nace pendiente y lo aprueba o
 * rechaza Arranca. Tampoco de responsable: el backend lo fija con quien guarda.
 * Guardar replica el movimiento en Arranca en el acto; si Arranca no responde,
 * no se guarda nada.
 */
export function ArrancaBalanceFormModal({
  isOpen,
  onClose,
  arrancaBalance,
  defaultBranchId,
  isSubmitting = false,
  onSubmit,
}: ArrancaBalanceFormModalProps) {
  const { data: branches } = useAllBranches();

  const form = useForm<ArrancaBalanceFormValues>({
    resolver: zodResolver(ArrancaBalanceSchema),
    defaultValues: getDefaultValues(arrancaBalance, defaultBranchId),
  });

  // El modal se reutiliza entre filas: cada apertura parte de los datos de la fila elegida.
  useEffect(() => {
    if (isOpen) form.reset(getDefaultValues(arrancaBalance, defaultBranchId));
  }, [isOpen, arrancaBalance, defaultBranchId, form]);

  const handleSubmit = async (values: ArrancaBalanceFormValues) => {
    await onSubmit({
      ...values,
      amount: Number(values.amount),
      branch: Number(values.branch),
    });
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isSubmitting) onClose();
      }}
    >
      <DialogContent
        className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto"
        width="90%"
      >
        <DialogHeader>
          <DialogTitle>
            {arrancaBalance
              ? `Editar movimiento #${arrancaBalance.id}`
              : 'Nuevo movimiento con Arranca'}
          </DialogTitle>
          <DialogDescription>
            {arrancaBalance
              ? 'Los cambios se replican en Arranca y quedás como responsable.'
              : 'Se crea pendiente en Moto Candela y en Arranca; Arranca lo aprueba o lo rechaza.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto (USD)</FormLabel>
                    <FormControl>
                      <Input
                        inputMode="decimal"
                        placeholder="0.00"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Seleccione una sucursal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(branches ?? []).map((branch: BranchItem) => (
                          <SelectItem key={branch.id} value={String(branch.id)}>
                            {branch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sentido</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="¿Quién le paga a quién?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ARRANCA_BALANCE_DIRECTIONS.map((direction) => (
                        <SelectItem key={direction} value={direction}>
                          {ARRANCA_BALANCE_DIRECTION_LABELS[direction]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="concept"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Concepto</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Pago de motos financiadas"
                      maxLength={255}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observaciones</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Opcional"
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? 'Guardando...'
                  : arrancaBalance
                    ? 'Guardar cambios'
                    : 'Crear movimiento'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
