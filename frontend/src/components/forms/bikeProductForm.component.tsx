'use client';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { BikeProductFormSchema as formSchema } from '@/schemas/bikeProduct.schema';
import React, { useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { ProductsService } from '@/services/products/products.service';
import { useToken } from '@/stores/auth/auth.store';
import { PRODUCTS } from '@/constants/routes';
import { useProductCategories } from '@/hooks/products';
import { Category } from '@/services/products/types';

type FormValues = z.infer<typeof formSchema>;

type productDataProps = {
  sku: string;
  name: string;
  model: string;
  brand: string;
  category: string;
};

const productService = new ProductsService();

export function BikeProductForm() {
  const toast = useToast();
  const router = useRouter();
  const token = useToken();
  const categories = useProductCategories();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sku: '',
      name: '',
      model: '',
      brand: '',
      category: '',
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!token) return;

    try {
      const productData: productDataProps = {
        sku: values.sku,
        name: values.name,
        model: values.model,
        brand: values.brand,
        category: values.category,
      };

      const response = await productService.createProduct(token, productData);

      if ('errors' in response) {
        toast.toast({
          title: 'Error',
          description: 'Ocurrió un error al crear el producto',
          variant: 'destructive',
        });

        return;
      }

      toast.toast({
        title: 'Éxito',
        description: 'Producto creado correctamente',
      });

      router.push(`${PRODUCTS}/bikes`);
    } catch (err) {
      toast.toast({
        title: 'Error',
        description: 'Ocurrió un error al crear el producto',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className=" w-full space-y-4 p-4 rounded"
      >
        <FormField
          control={form.control}
          name="sku"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingresa el SKU del producto</FormLabel>
              <FormControl>
                <Input
                  id="sku"
                  type="text"
                  autoCorrect="off"
                  autoComplete="off"
                  autoCapitalize="none"
                  placeholder="2222322"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingresa el nombre del producto</FormLabel>
              <FormControl>
                <Input
                  id="name"
                  type="text"
                  autoCorrect="off"
                  autoComplete="name"
                  autoCapitalize="none"
                  placeholder="Retrovisor"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="model"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingresa el modelo</FormLabel>
              <FormControl>
                <Input
                  id="model"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="none"
                  placeholder="Retrovisor"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="brand"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ingresa la marca</FormLabel>
              <FormControl>
                <Input
                  id="brand"
                  type="text"
                  autoCorrect="off"
                  autoCapitalize="none"
                  placeholder="Empire"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Selecciona la categoría</FormLabel>
              <FormControl>
                <select
                  id="category"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  {...field}
                >
                  <option value="">Selecciona una categoría</option>
                  {categories.data?.map((category: Category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Crear
        </Button>
      </form>
    </Form>
  );
}
