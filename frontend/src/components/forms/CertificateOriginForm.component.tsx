import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  certificateOriginSchema,
  CertificateOriginSchemaType,
} from '@/schemas/certificateOrigin.schema';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form.component';

interface CertificateOriginFormProps {
  defaultValues?: Partial<CertificateOriginSchemaType>;
  onSubmit: (data: CertificateOriginSchemaType) => void;
}

export const CertificateOriginForm: React.FC<CertificateOriginFormProps> = ({
  defaultValues,
  onSubmit,
}) => {
  const form = useForm<CertificateOriginSchemaType>({
    resolver: zodResolver(certificateOriginSchema),
    defaultValues: defaultValues || {
      concesionario: '',
      rif: '',
      cedula: '',
      factura: '',
      fechaFactura: '',
      nombreRazonSocial: '',
      casaApto: '',
      avenidaCalle: '',
      distritoParroquia: '',
      codigoPostal: '',
      telefonoHabitacion: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="concesionario"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concesionario</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
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
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="cedula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cédula</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="factura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Factura</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fechaFactura"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Factura</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="DD-MM-YYYY" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nombreRazonSocial"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre o Razón Social</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <h3 className="text-sm font-medium mt-4 mb-2">Dirección</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="casaApto"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Casa / Apto</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="avenidaCalle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avenida / Calle</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="distritoParroquia"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Distrito / Parroquia</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="codigoPostal"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Código Postal</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="telefonoHabitacion"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono de Habitación</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit">Generar Vista Previa</Button>
      </form>
    </Form>
  );
};
