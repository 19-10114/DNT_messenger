'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Button } from '@/components/ui/button.component';
import { ClientFormSchema } from '@/schemas/client.schema';
import { useClients } from '@/hooks/useClients';
import { useToast } from '@/components/ui/use-toast';
import { ClientData } from '@/services/clients/types/Client.type';
import { Home, Phone } from 'lucide-react';
import { useMappedConstants } from '@/hooks/useMappedConstants';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';

type FormValues = z.infer<typeof ClientFormSchema>;

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | undefined;
  initialCountryId?: string;
  onClientCreated?: (client: ClientData) => void;
  /** When provided, the modal operates in "update" mode */
  existingClient?: ClientData | null;
  /** When true, address fields are shown and required */
  isBikeOrder?: boolean;
}

export function ClientFormModal({
  isOpen,
  onClose,
  token,
  initialCountryId,
  onClientCreated,
  existingClient,
  isBikeOrder = false,
}: ClientFormModalProps): JSX.Element {
  const { toast } = useToast();
  const isUpdateMode = !!existingClient;

  const {
    createClient,
    isCreatingClient,
    createClientError,
    createClientSuccess,
    createClientData,
    updateClient,
    isUpdatingClient,
    updateClientError,
    updateClientSuccess,
    updateClientData,
  } = useClients(token);

  const { origins } = useMappedConstants();

  const isSubmitting = isCreatingClient || isUpdatingClient;

  const getDefaultValues = useCallback((): FormValues => {
    if (existingClient) {
      return {
        first_name: existingClient.firstName || '',
        last_name: existingClient.lastName || '',
        country_id: existingClient.countryId || '',
        phone_number: existingClient.phoneNumber || '',
        email: existingClient.email || '',
        address: existingClient.address || '',
        city: existingClient.city || '',
        residence_type: existingClient.residenceType || '',
        street: existingClient.street || '',
        residence: existingClient.residence || '',
        district: existingClient.district || '',
        state: existingClient.state || '',
        postal_code: existingClient.postalCode || '',
        local_phone_number: existingClient.localPhoneNumber || '',
        origin: existingClient.origin || '',
      };
    }
    return {
      first_name: '',
      last_name: '',
      country_id: initialCountryId || '',
      phone_number: '',
      email: '',
      address: '',
      city: '',
      residence_type: '',
      street: '',
      residence: '',
      district: '',
      state: '',
      postal_code: '',
      local_phone_number: '',
      origin: '',
    };
  }, [existingClient, initialCountryId]);

  const form = useForm<FormValues>({
    resolver: zodResolver(ClientFormSchema),
    defaultValues: getDefaultValues(),
  });

  // Reset form when modal opens or existingClient changes
  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues());
    }
  }, [isOpen, existingClient, form, getDefaultValues]);

  useEffect(() => {
    if (initialCountryId && !existingClient) {
      form.setValue('country_id', initialCountryId);
    }
  }, [initialCountryId, existingClient, form]);

  const handleClose = useCallback(() => {
    form.reset(getDefaultValues());
    onClose();
  }, [form, getDefaultValues, onClose]);

  // Ref to prevent re-entry on success handlers
  const hasHandledCreateSuccess = useRef(false);
  const hasHandledUpdateSuccess = useRef(false);

  // Reset flags when modal opens
  useEffect(() => {
    if (isOpen) {
      hasHandledCreateSuccess.current = false;
      hasHandledUpdateSuccess.current = false;
    }
  }, [isOpen]);

  // Handle create success
  useEffect(() => {
    if (
      createClientSuccess &&
      createClientData &&
      !isUpdateMode &&
      !hasHandledCreateSuccess.current
    ) {
      hasHandledCreateSuccess.current = true;

      toast({
        title: 'Cliente creado exitosamente',
        description: 'El cliente ha sido registrado correctamente.',
      });

      const formValues = form.getValues();
      const newClient: ClientData = {
        id: createClientData.id,
        firstName: formValues.first_name,
        lastName: formValues.last_name,
        countryId: formValues.country_id,
        phoneNumber: formValues.phone_number,
        email: formValues.email,
        address: formValues.address,
        city: formValues.city,
        createdAt: new Date().toISOString(),
        residenceType: formValues.residence_type,
        street: formValues.street,
        residence: formValues.residence,
        district: formValues.district,
        state: formValues.state,
        postalCode: formValues.postal_code,
        localPhoneNumber: formValues.local_phone_number,
        origin: formValues.origin,
      };

      onClientCreated?.(newClient);
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createClientSuccess, createClientData, isUpdateMode]);

  // Handle update success
  useEffect(() => {
    if (
      updateClientSuccess &&
      updateClientData &&
      isUpdateMode &&
      !hasHandledUpdateSuccess.current
    ) {
      hasHandledUpdateSuccess.current = true;

      toast({
        title: 'Cliente actualizado exitosamente',
        description: 'Los datos del cliente han sido actualizados.',
      });

      const formValues = form.getValues();
      const updatedClient: ClientData = {
        ...existingClient!,
        firstName: formValues.first_name,
        lastName: formValues.last_name,
        countryId: formValues.country_id,
        phoneNumber: formValues.phone_number,
        email: formValues.email,
        address: formValues.address,
        city: formValues.city,
        residenceType: formValues.residence_type,
        street: formValues.street,
        residence: formValues.residence,
        district: formValues.district,
        state: formValues.state,
        postalCode: formValues.postal_code,
        localPhoneNumber: formValues.local_phone_number,
        origin: formValues.origin,
      };

      onClientCreated?.(updatedClient);
      handleClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateClientSuccess, updateClientData, isUpdateMode]);

  // Handle errors
  useEffect(() => {
    if (createClientError) {
      toast({
        title: 'Error al crear cliente',
        description:
          'Ocurrió un error al registrar el cliente. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  }, [createClientError, toast]);

  useEffect(() => {
    if (updateClientError) {
      toast({
        title: 'Error al actualizar cliente',
        description:
          'Ocurrió un error al actualizar el cliente. Intente nuevamente.',
        variant: 'destructive',
      });
    }
  }, [updateClientError, toast]);

  const onSubmit = (data: FormValues) => {
    const submitData = {
      ...data,
      origin: data.origin === 'none' ? undefined : data.origin,
    };

    if (isUpdateMode && existingClient) {
      updateClient({ countryId: existingClient.countryId, data: submitData });
    } else {
      createClient(submitData);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        width="90%"
      >
        <DialogHeader>
          <DialogTitle>
            {isUpdateMode
              ? 'Actualizar Datos del Cliente'
              : 'Crear Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isUpdateMode
              ? 'Complete o actualice los datos del cliente.'
              : 'Complete los datos del cliente para registrarlo en el sistema.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingrese el nombre"
                        {...field}
                        disabled={isSubmitting || isUpdateMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ingrese el apellido"
                        {...field}
                        disabled={isSubmitting || isUpdateMode}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="country_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cédula de Identidad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese la cédula"
                      {...field}
                      disabled={isSubmitting || isUpdateMode}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ej: 04241234567"
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="ejemplo@correo.com"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese la dirección completa"
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
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ciudad</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ingrese la ciudad"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address Fields for Bike Orders */}
            {isBikeOrder && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-800">
                  <Home className="h-5 w-5" />
                  Datos de Dirección (Requeridos para Orden de Moto)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="residence_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Residencia *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Casa, Apartamento"
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
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Calle / Avenida *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre de la calle o avenida"
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
                    name="residence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Edificio / Residencia / Nro *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Nombre o número de casa"
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
                    name="district"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parroquia / Distrito *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Catedral"
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
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: Lara"
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
                    name="postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código Postal *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: 3001"
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
                    name="local_phone_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <Phone className="h-4 w-4 inline mr-1" />
                          Teléfono Local *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ej: 0251-1234567"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}
            <FormField
              control={form.control}
              name="origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || 'none'}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Seleccione un origen" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {origins.map((origin) => (
                        <SelectItem
                          key={origin.value}
                          value={origin.value}
                          className="hover:bg-orange-200 focus:bg-orange-200"
                        >
                          {origin.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? isUpdateMode
                    ? 'Actualizando...'
                    : 'Creando...'
                  : isUpdateMode
                    ? 'Actualizar Cliente'
                    : 'Crear Cliente'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
