'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
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
  FormDescription,
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
import { useToast } from '@/components/ui/use-toast';
import { useSavedBeneficiaries } from '@/hooks/expenses';
import { useSaveSupplier } from '@/hooks/suppliers';
import {
  SupplierFormSchema,
  SupplierFormValues,
} from '@/schemas/supplier.schema';
import {
  Supplier,
  SupplierIvaRetentionRate,
  SupplierPersonType,
} from '@/services/suppliers/types/Supplier.type';
import {
  ISLR_CONCEPTS,
  IVA_RETENTION_LABELS,
  PERSON_TYPE_LABELS,
  getSupplierErrorMessage,
  normalizeRif,
} from './supplier.utils';

interface SupplierFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = edición. */
  supplier?: Supplier;
  /** Nombre con el que empieza un alta (lo escrito en el selector del gasto). */
  initialName?: string;
  /** Tras guardar, con el proveedor que devolvió el backend. */
  onSaved?: (supplier: Supplier) => void;
}

const OTHER_CONCEPT = '__otro__';

function defaultValues(
  supplier: Supplier | undefined,
  initialName: string
): SupplierFormValues {
  return {
    name: supplier?.name ?? initialName,
    rif: supplier?.rif ?? '',
    personType: supplier?.personType ?? 'juridica',
    ivaRetentionRate: String(supplier?.ivaRetentionRate ?? 75) as
      | '0'
      | '75'
      | '100',
    retainIslr: supplier ? supplier.islrRetentionRate !== null : true,
    islrRate:
      supplier?.islrRetentionRate !== null &&
      supplier?.islrRetentionRate !== undefined
        ? String(supplier.islrRetentionRate)
        : supplier
          ? ''
          : '2',
    islrConcept: supplier?.islrConcept ?? (supplier ? '' : 'Servicios'),
    phone: supplier?.phone ?? '',
    email: supplier?.email ?? '',
    notes: supplier?.notes ?? '',
  };
}

/**
 * Alta o edición de un proveedor y su perfil de retención: el % de IVA y de
 * ISLR que el formulario de gastos propone al elegirlo. Cambiar el perfil no
 * toca los gastos ya registrados (guardan los % que usaron).
 */
export function SupplierFormModal({
  open,
  onOpenChange,
  supplier,
  initialName = '',
  onSaved,
}: SupplierFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? `Editar ${supplier.name}` : 'Nuevo proveedor'}
          </DialogTitle>
          <DialogDescription>
            El perfil de retención se propone al registrar un gasto con este
            proveedor; en cada gasto se puede ajustar.
          </DialogDescription>
        </DialogHeader>
        {open && (
          <SupplierForm
            supplier={supplier}
            initialName={initialName}
            onDone={(saved) => {
              onSaved?.(saved);
              onOpenChange(false);
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SupplierForm({
  supplier,
  initialName,
  onDone,
  onCancel,
}: {
  supplier?: Supplier;
  initialName: string;
  onDone: (supplier: Supplier) => void;
  onCancel: () => void;
}) {
  const { toast } = useToast();
  const saveMutation = useSaveSupplier();
  const [pickSaved, setPickSaved] = useState(false);
  const { savedBeneficiaries } = useSavedBeneficiaries('', pickSaved);
  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(SupplierFormSchema),
    defaultValues: defaultValues(supplier, initialName),
  });
  const personType = form.watch('personType');
  const retainIslr = form.watch('retainIslr');
  const islrConcept = form.watch('islrConcept') ?? '';
  const preset = ISLR_CONCEPTS.find((row) => row.concept === islrConcept);
  const [customConcept, setCustomConcept] = useState(!!islrConcept && !preset);

  const choosePreset = (concept: string, type: SupplierPersonType) => {
    const row = ISLR_CONCEPTS.find((item) => item.concept === concept);
    if (!row) return;
    form.setValue('islrConcept', row.concept);
    form.setValue('islrRate', String(row[type]), {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  const onSubmit = async (values: SupplierFormValues) => {
    try {
      const saved = await saveMutation.mutateAsync({
        id: supplier?.id,
        payload: {
          name: values.name.trim(),
          rif: normalizeRif(values.rif) ?? values.rif,
          personType: values.personType,
          ivaRetentionRate: Number(
            values.ivaRetentionRate
          ) as SupplierIvaRetentionRate,
          islrRetentionRate: values.retainIslr ? Number(values.islrRate) : null,
          islrConcept: values.retainIslr ? (values.islrConcept ?? '') : '',
          phone: values.phone ?? '',
          email: values.email ?? '',
          notes: values.notes ?? '',
        },
      });
      toast({ title: supplier ? 'Proveedor actualizado' : 'Proveedor creado' });
      onDone(saved);
    } catch (error) {
      toast({
        title: 'No se pudo guardar el proveedor',
        description: getSupplierErrorMessage(error, 'Inténtalo de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Nombre o razón social</FormLabel>
              {pickSaved ? (
                <Select
                  onValueChange={(name) => {
                    field.onChange(name);
                    setPickSaved(false);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un beneficiario guardado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="max-h-72">
                    {savedBeneficiaries.map((saved) => (
                      <SelectItem key={saved.id} value={saved.name}>
                        {saved.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <FormControl>
                  <Input placeholder="Ej.: NetUno, C.A." {...field} />
                </FormControl>
              )}
              {!supplier && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={() => setPickSaved((value) => !value)}
                >
                  <Bookmark className="h-3 w-3" />
                  {pickSaved
                    ? 'Escribir el nombre'
                    : 'Partir de un beneficiario guardado'}
                </button>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rif"
          render={({ field }) => (
            <FormItem>
              <FormLabel>RIF</FormLabel>
              <FormControl>
                <Input
                  placeholder="J-30123456-7"
                  {...field}
                  onBlur={() => {
                    const normalized = normalizeRif(field.value);
                    if (normalized) field.onChange(normalized);
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const next = value as SupplierPersonType;
                  field.onChange(next);
                  // El % de ISLR de referencia depende del tipo de persona.
                  if (preset) choosePreset(preset.concept, next);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PERSON_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
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
          name="ivaRetentionRate"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Retención de IVA</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(IVA_RETENTION_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <FormDescription>
                Sobre el IVA de la factura. Solo aplica si Moto Candela es
                agente de retención (contribuyente especial).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="retainIslr"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-3 space-y-0 md:col-span-2">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) =>
                    field.onChange(checked === true)
                  }
                />
              </FormControl>
              <FormLabel>Se le retiene ISLR</FormLabel>
            </FormItem>
          )}
        />

        {retainIslr && (
          <>
            <FormItem>
              <FormLabel>Concepto del ISLR</FormLabel>
              <Select
                value={customConcept ? OTHER_CONCEPT : islrConcept || undefined}
                onValueChange={(value) => {
                  if (value === OTHER_CONCEPT) {
                    setCustomConcept(true);
                    form.setValue('islrConcept', '');
                    return;
                  }
                  setCustomConcept(false);
                  choosePreset(value, personType);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige el concepto" />
                </SelectTrigger>
                <SelectContent>
                  {ISLR_CONCEPTS.map((row) => (
                    <SelectItem key={row.concept} value={row.concept}>
                      {row.concept} ({row[personType]} %)
                    </SelectItem>
                  ))}
                  <SelectItem value={OTHER_CONCEPT}>Otro concepto</SelectItem>
                </SelectContent>
              </Select>
              {customConcept && (
                <FormField
                  control={form.control}
                  name="islrConcept"
                  render={({ field }) => (
                    <FormControl>
                      <Input
                        className="mt-2"
                        placeholder="Describe el concepto"
                        {...field}
                      />
                    </FormControl>
                  )}
                />
              )}
            </FormItem>
            <FormField
              control={form.control}
              name="islrRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>% de ISLR</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      max="100"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Sobre la base imponible (sin IVA). Confírmalo con el
                    contador.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Teléfono (opcional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Correo (opcional)</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Notas (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap justify-end gap-2 md:col-span-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saveMutation.isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={saveMutation.isLoading}>
            {saveMutation.isLoading
              ? 'Guardando...'
              : supplier
                ? 'Guardar cambios'
                : 'Crear proveedor'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
