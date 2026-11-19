'use client';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Button } from '@/components/ui/button.component';
import { BranchFormSchema as formSchema } from '@/schemas/branch.schema';
import React, { useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { BranchService } from '@/services/branches/branch.service';
import { useToken } from '@/stores/auth/auth.store';
import { BranchData, BranchItem } from '@/services/branches/types/Branch.type';

type FormValues = z.infer<typeof formSchema>;

interface BranchFormProps {
  branchToEdit?: BranchItem;
  onSuccess?: () => void;
}

const branchService = new BranchService();

export function BranchForm({ branchToEdit, onSuccess }: BranchFormProps) {
  const toast = useToast();
  const router = useRouter();
  const token = useToken();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: branchToEdit?.name || '',
      type: branchToEdit?.type || '',
      code: branchToEdit?.code || '',
    },
  });

  // Actualizar el formulario cuando se proporciona una sucursal para editar
  useEffect(() => {
    if (branchToEdit) {
      form.reset({
        name: branchToEdit.name,
        type: branchToEdit.type,
        code: branchToEdit.code || '',
      });
    }
  }, [branchToEdit, form]);

  const onSubmit = async (values: FormValues) => {
    if (!token) return;

    try {
      const branchData: BranchData = {
        name: values.name,
        type: values.type,
        code: (values.code ?? '').trim().toUpperCase(),
      };

      let response;

      if (branchToEdit) {
        // Si estamos editando, usamos el método updateBranch
        response = await branchService.updateBranch(
          token,
          branchToEdit.id,
          branchData
        );
      } else {
        // Si estamos creando, usamos el método createBranch
        response = await branchService.createBranch(token, branchData);
      }

      if ('errors' in response) {
        toast.toast({
          title: 'Error',
          description: `No se pudo ${branchToEdit ? 'actualizar' : 'crear'} la sucursal`,
          variant: 'destructive',
        });
        return;
      }

      toast.toast({
        title: 'Éxito',
        description: `Sucursal ${branchToEdit ? 'actualizada' : 'creada'} correctamente`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/branches/management');
      }
    } catch (error) {
      toast.toast({
        title: 'Error',
        description: `Ocurrió un error al ${branchToEdit ? 'actualizar' : 'crear'} la sucursal`,
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4 w-full max-w-sm mx-auto"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la sucursal</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  type="text"
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder="Nombre de la sucursal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de sucursal</FormLabel>
              <FormControl>
                <Input
                  id="type"
                  type="text"
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder="Tipo de sucursal"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código (opcional)</FormLabel>
              <FormControl>
                <Input
                  id="code"
                  type="text"
                  autoComplete="off"
                  maxLength={4}
                  placeholder="Ej: GRN"
                  className="uppercase"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                De 2 a 4 letras o números. Identifica la sucursal en los
                documentos, por ejemplo el gasto GRN-123.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">
          {branchToEdit ? 'Actualizar' : 'Crear'}
        </Button>
      </form>
    </Form>
  );
}
