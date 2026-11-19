import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceSchema, InvoiceSchemaType } from '@/schemas/invoice.schema';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form.component';
import { Trash } from 'lucide-react';
import { formatCurrencyBolivares } from '@/lib/utils';

export interface MotoDetails {
  color?: string;
  plate?: string;
  chassisSerial?: string;
  engineSerial?: string;
}

interface InvoiceFormProps {
  defaultValues?: Partial<InvoiceSchemaType>;
  onSubmit: (data: InvoiceSchemaType) => void;
  isMoto?: boolean;
  motoInitialData?: MotoDetails;
  onIgtfChange?: (checked: boolean) => void;
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  defaultValues,
  onSubmit,
  isMoto = false,
  motoInitialData,
  onIgtfChange,
}) => {
  const form = useForm<InvoiceSchemaType>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: defaultValues || {
      items: [{ quantity: 1, description: '', unitPrice: 0, totalPrice: 0 }],
      ivaRate: 16,
      igtfRate: 3,
      applyIgtf: false,
      ivaAmount: 0,
      igtfAmount: 0,
      subtotal: 0,
      totalToPay: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Moto specific states
  const [motoData, setMotoData] = useState<MotoDetails>({
    color: motoInitialData?.color || '',
    plate: motoInitialData?.plate || '',
    chassisSerial: motoInitialData?.chassisSerial || '',
    engineSerial: motoInitialData?.engineSerial || '',
  });

  // Listen to defaultValues changes coming from the backend (React Query)
  // When the user toggles IGTF and the backend sends new totals, we update the React hook form values
  useEffect(() => {
    if (defaultValues) {
      if (defaultValues.subtotal !== undefined)
        form.setValue('subtotal', defaultValues.subtotal);
      if (defaultValues.ivaAmount !== undefined)
        form.setValue('ivaAmount', defaultValues.ivaAmount);
      if (defaultValues.igtfAmount !== undefined)
        form.setValue('igtfAmount', defaultValues.igtfAmount);
      if (defaultValues.totalToPay !== undefined)
        form.setValue('totalToPay', defaultValues.totalToPay);
    }
  }, [defaultValues, form]);

  // Update description when moto data changes
  useEffect(() => {
    if (isMoto) {
      const currentDescription = form.getValues('items.0.description') || '';
      // Intentar mantener el nombre base del producto si ya existe,
      // asumiendo que la descripción inicial (defaultValues) era solo el nombre.
      // O podemos reconstruirlo completamente.
      // Estrategia: Tomar la parte antes de "COLOR:" si existe, o usar defaultValues.items[0].description

      const baseDesc = defaultValues?.items?.[0]?.description || 'MOTO';

      const parts = [baseDesc];
      if (motoData.color) parts.push(`COLOR: ${motoData.color}`);
      if (motoData.plate) parts.push(`PLACA: ${motoData.plate}`);
      if (motoData.chassisSerial)
        parts.push(`SERIAL CHASIS: ${motoData.chassisSerial}`);
      if (motoData.engineSerial)
        parts.push(`SERIAL MOTOR: ${motoData.engineSerial}`);

      const newDesc = parts.join('\n'); // Listados verticalmente

      // Evitar loop infinito si no cambia
      if (form.getValues('items.0.description') !== newDesc) {
        form.setValue('items.0.description', newDesc);
      }
    }
  }, [motoData, isMoto, defaultValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Encabezado */}
        <Card>
          <CardHeader>
            <CardTitle>Datos de Emisión</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="emissionPlace"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormLabel>Lugar de Emisión</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="day"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Día</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="DD" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mes</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="MM" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="YYYY" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Cliente */}
        <Card className="hidden">
          <CardHeader>
            <CardTitle>Datos del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre / Razón Social</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>C.I. / RIF</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Domicilio fiscal</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Detalles Extra */}
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <FormField
              control={form.control}
              name="deliveryOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Orden de Entrega / Guía de despacho</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condiciones de Pago</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      className="uppercase"
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase())
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* DATOS DE LA MOTO (Si aplica) */}
        {isMoto && (
          <Card className="hidden">
            <CardHeader>
              <CardTitle>Detalles de la Moto</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <FormItem>
                <FormLabel>Color</FormLabel>
                <FormControl>
                  <Input
                    value={motoData.color}
                    onChange={(e) =>
                      setMotoData((prev) => ({
                        ...prev,
                        color: e.target.value.toUpperCase(),
                      }))
                    }
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Placa</FormLabel>
                <FormControl>
                  <Input
                    value={motoData.plate}
                    onChange={(e) =>
                      setMotoData((prev) => ({
                        ...prev,
                        plate: e.target.value.toUpperCase(),
                      }))
                    }
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Serial Chasis</FormLabel>
                <FormControl>
                  <Input
                    value={motoData.chassisSerial}
                    onChange={(e) =>
                      setMotoData((prev) => ({
                        ...prev,
                        chassisSerial: e.target.value.toUpperCase(),
                      }))
                    }
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
              <FormItem>
                <FormLabel>Serial Motor</FormLabel>
                <FormControl>
                  <Input
                    value={motoData.engineSerial}
                    onChange={(e) =>
                      setMotoData((prev) => ({
                        ...prev,
                        engineSerial: e.target.value.toUpperCase(),
                      }))
                    }
                    className="uppercase"
                  />
                </FormControl>
              </FormItem>
            </CardContent>
          </Card>
        )}

        {/* Items */}
        <Card className="hidden">
          <CardHeader>
            <CardTitle>Ítems</CardTitle>
          </CardHeader>
          <CardContent>
            {fields.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-end mb-4">
                <FormField
                  control={form.control}
                  name={`items.${index}.quantity`}
                  render={({ field }) => (
                    <FormItem className="w-20">
                      <FormLabel>Cant.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            // Auto calc total
                            const qty = Number(e.target.value);
                            const price = form.getValues(
                              `items.${index}.unitPrice`
                            );
                            form.setValue(
                              `items.${index}.totalPrice`,
                              qty * price
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.description`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="uppercase"
                          readOnly={isMoto} // Si es moto, se autogenera
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.unitPrice`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel>Precio Unit.</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            const price = Number(e.target.value);
                            const qty = form.getValues(
                              `items.${index}.quantity`
                            );
                            form.setValue(
                              `items.${index}.totalPrice`,
                              qty * price
                            );
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`items.${index}.totalPrice`}
                  render={({ field }) => (
                    <FormItem className="w-32">
                      <FormLabel>Total</FormLabel>
                      <FormControl>
                        <Input type="number" readOnly {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                {!isMoto && (
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      remove(index);
                    }}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {!isMoto && (
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  append({
                    quantity: 1,
                    description: '',
                    unitPrice: 0,
                    totalPrice: 0,
                  })
                }
              >
                Agregar Ítem
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Impuestos y Totales */}
        <Card className="hidden">
          <CardHeader>
            <CardTitle>Impuestos y Totales</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="ivaRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IVA (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="applyIgtf"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          if (onIgtfChange) onIgtfChange(checked === true);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Aplicar IGTF (3%)</FormLabel>
                      <FormDescription>
                        Impuesto a Grandes Transacciones Financieras
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch('applyIgtf') && (
                <FormField
                  control={form.control}
                  name="igtfRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasa IGTF (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-2 bg-gray-50 p-4 rounded-md">
              <div className="flex justify-between">
                <span className="font-semibold">Sub-Total:</span>
                <span>
                  {formatCurrencyBolivares(form.watch('subtotal') || 0)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>IVA:</span>
                <span>
                  {formatCurrencyBolivares(form.watch('ivaAmount') || 0)}
                </span>
              </div>
              {form.watch('applyIgtf') && (
                <div className="flex justify-between">
                  <span>IGTF:</span>
                  <span>
                    {formatCurrencyBolivares(form.watch('igtfAmount') || 0)}
                  </span>
                </div>
              )}
              <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
                <span>Total a Pagar:</span>
                <span>
                  {formatCurrencyBolivares(form.watch('totalToPay') || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* IGTF Toggle and Totals Summary */}
        <div className="space-y-4 border rounded-lg p-4 bg-white">
          <FormField
            control={form.control}
            name="applyIgtf"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      if (onIgtfChange) {
                        onIgtfChange(checked === true);
                      }
                    }}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>Aplicar IGTF (3%)</FormLabel>
                  <FormDescription>
                    Impuesto a Grandes Transacciones Financieras
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <div className="space-y-2 bg-gray-50 p-4 rounded-md">
            <div className="flex justify-between">
              <span className="font-semibold">Sub-Total:</span>
              <span>
                {formatCurrencyBolivares(form.watch('subtotal') || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>IVA (16%):</span>
              <span>
                {formatCurrencyBolivares(form.watch('ivaAmount') || 0)}
              </span>
            </div>
            {form.watch('applyIgtf') && (
              <div className="flex justify-between">
                <span>IGTF (3%):</span>
                <span>
                  {formatCurrencyBolivares(form.watch('igtfAmount') || 0)}
                </span>
              </div>
            )}
            <div className="border-t pt-2 mt-2 flex justify-between text-lg font-bold">
              <span>Total a Pagar:</span>
              <span>
                {formatCurrencyBolivares(form.watch('totalToPay') || 0)}
              </span>
            </div>
          </div>
        </div>

        <Button type="submit">Generar Vista Previa</Button>
      </form>
    </Form>
  );
};
