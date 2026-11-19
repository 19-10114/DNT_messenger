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
import { TransactionFormSchema as formSchema } from '@/schemas/transaction.schema';
import React, { useState, useEffect } from 'react';
import { useToast } from '../ui/use-toast';
import { useAuthService, useToken } from '@/stores/auth/auth.store';
import 'react-datepicker/dist/react-datepicker.css';
import * as routes from '@/constants/routes';
import { TransactionDataPayload } from '@/services/transactions/types/GetAllTransactions';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import { useTransactions } from '@/hooks/useTransactions';
import { BranchService } from '@/services/branches/branch.service';
import { useBranchInventory } from '@/hooks/useBranchInventory';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useAllBranches } from '@/hooks/useAllBranches';

type FormValues = z.infer<typeof formSchema>;
const branchService = new BranchService();

// IDs de productos conocidos para aplicar lógica de negocio específica
const PRODUCT_IDS = {
  PAYMENT: '5',
  UTILITIES: '13',
  ADVANCE: '9871',
  DALE_PLAY: '11277',
  REFUND: '14873',
  EMPIRE_PAYMENT: '11',
};

export function PaymentForm() {
  const { TRANSACTIONS } = routes;
  const currentBranchId = useCurrentBranchId();
  const authService = useAuthService();
  const toast = useToast();
  const token = useToken();
  const router = useRouter();
  const currentDate = new Date();
  const [transactionType, setTransactionType] = useState<string>();
  // Establecer categoría financiera por defecto
  const [transactionCategory, setTransactionCategory] =
    useState<string>('financial');
  // Estado para almacenar los productos según la categoría seleccionada
  const [products, setProducts] = useState<any[]>([]);
  // Estado para almacenar el producto seleccionado y mostrar su nombre
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const { data: branches = [] } = useAllBranches();

  // Estado para almacenar múltiples transacciones
  const [pendingTransactions, setPendingTransactions] = useState<
    TransactionDataPayload[]
  >([]);

  // Use the transactions hook
  const {
    createTransaction,
    isCreatingTransaction,
    createTransactionError,
    createBatchTransactions,
    isCreatingBatchTransactions,
    createBatchTransactionsError,
  } = useTransactions(token);

  // Usar el hook de inventario de sucursal
  const { financialProducts } = useBranchInventory();

  // Cargar productos financieros al iniciar el componente
  useEffect(() => {
    if (financialProducts.data) {
      const loadedProducts = financialProducts.data.map((product: any) => {
        if (product.id.toString() === PRODUCT_IDS.PAYMENT) {
          return { ...product, name: 'Pago' };
        }
        return product;
      });
      const hasRefund = loadedProducts.some(
        (p: any) => p.id.toString() === PRODUCT_IDS.REFUND
      );

      const productsList = [...loadedProducts];

      if (!hasRefund) {
        productsList.push({ id: PRODUCT_IDS.REFUND, name: 'Devolucion' });
      }

      const hasEmpirePayment = productsList.some(
        (p: any) => p.id.toString() === PRODUCT_IDS.EMPIRE_PAYMENT
      );

      if (!hasEmpirePayment) {
        productsList.push({
          id: PRODUCT_IDS.EMPIRE_PAYMENT,
          name: 'Pago Empire',
        });
      }

      setProducts(productsList);
    } else {
      setProducts([
        { id: PRODUCT_IDS.REFUND, name: 'Devolucion' },
        { id: PRODUCT_IDS.EMPIRE_PAYMENT, name: 'Pago Empire' },
      ]);
    }
  }, [financialProducts.data]);

  // Obtener el usuario actual
  const {
    data: currentUser,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => authService.getCurrentUser(token ?? ''),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: '',
      type: '',
      responsable: '',
      date_delivered: currentDate,
      origin_branch: '',
      target_branch: '',
      notes: '',
    },
  });

  // Set default origin_branch to current user ID when user data is loaded

  useEffect(() => {
    if (currentBranchId) {
      form.setValue('origin_branch', currentBranchId.toString());
    }
  }, [currentBranchId, form]);

  // Función para determinar el nombre del producto seleccionado
  const getSelectedProductInfo = (id: string) => {
    return products.find((p) => p.id.toString() === id);
  };

  // Función para añadir una transacción a la lista pendiente
  const addTransaction = async () => {
    if (!token || !transactionType) return;

    try {
      const formValues = form.getValues();
      const isValid = await form.trigger();

      if (!isValid) {
        toast.toast({
          title: 'Error',
          description: 'Por favor complete todos los campos requeridos',
          variant: 'destructive',
        });
        return;
      }

      const productInfo = getSelectedProductInfo(transactionType);

      // Lógica de ruteo de sucursales
      let originBranch = currentBranchId?.toString() || '';
      let targetBranch = formValues.target_branch || '';

      if (
        transactionType === PRODUCT_IDS.DALE_PLAY ||
        transactionType === PRODUCT_IDS.ADVANCE
      ) {
        // Pago Dale Play o Abono: Origen 11, Destino Actual
        originBranch = '11';
        targetBranch = currentBranchId?.toString() || '';
      } else if (transactionType === PRODUCT_IDS.UTILITIES) {
        // Utilidades: Origen Actual, Destino 26
        targetBranch = '26';
      } else if (transactionType === PRODUCT_IDS.REFUND) {
        // Devolución: Origen Actual, Destino 11
        targetBranch = '11';
      } else if (transactionType === PRODUCT_IDS.EMPIRE_PAYMENT) {
        // Pago Empire: Origen Actual, Destino 11
        targetBranch = '11';
      }

      const payload: TransactionDataPayload = {
        amount: formValues.amount,
        type: 'payment' as TransactionDataPayload['type'],
        order_id: '',
        plate: '',
        color: '',
        serial_number: '',
        in_number: '',
        out_number: '',
        year: '',
        invoice_number: '',
        reception_date:
          formValues.reception_date?.toISOString() || currentDate.toISOString(),
        tax: '0',
        quantity: '1',
        product:
          transactionType === PRODUCT_IDS.EMPIRE_PAYMENT
            ? PRODUCT_IDS.PAYMENT
            : transactionType,
        origin_branch: originBranch,
        target_branch: targetBranch,
        user: currentUser?.id.toString() || '',
        responsible: currentUser?.id.toString() || '',
      };

      // Añadir el nombre del producto para la interfaz
      const payloadWithProductName = {
        ...payload,
        productName: productInfo?.name || 'Producto',
      };

      setPendingTransactions([...pendingTransactions, payloadWithProductName]);

      // Mostrar mensaje de éxito
      toast.toast({
        title: 'Transacción añadida',
        description: 'La transacción ha sido añadida a la lista pendiente',
      });

      // Resetear el formulario para la siguiente transacción
      form.reset({
        amount: '',
        type: '',
        responsable: '',
        date_delivered: currentDate,
        origin_branch: currentBranchId?.toString() || '',
        target_branch: '',
        notes: '',
      });
      setTransactionType(undefined);
    } catch (err) {
      toast.toast({
        title: 'Error',
        description: 'Ocurrió un error al añadir la transacción',
        variant: 'destructive',
      });
    }
  };

  // Función para enviar todas las transacciones pendientes
  const submitAllTransactions = async () => {
    if (!token || pendingTransactions.length === 0) return;

    try {
      // Usar la mutación de lote para enviar todas las transacciones
      createBatchTransactions(pendingTransactions, {
        onSuccess: () => {
          toast.toast({
            title: 'Éxito',
            description: `${pendingTransactions.length} transacciones creadas correctamente`,
          });
          setPendingTransactions([]);
          router.push(TRANSACTIONS);
        },
        onError: (error) => {
          toast.toast({
            title: 'Error',
            description: 'Ocurrió un error al crear las transacciones',
            variant: 'destructive',
          });
        },
      });
    } catch (err) {
      toast.toast({
        title: 'Error',
        description: 'Ocurrió un error al crear las transacciones',
        variant: 'destructive',
      });
    }
  };

  // Función para eliminar una transacción pendiente
  const removeTransaction = (index: number) => {
    const updatedTransactions = [...pendingTransactions];
    updatedTransactions.splice(index, 1);
    setPendingTransactions(updatedTransactions);
  };

  const onSubmit = async (values: FormValues) => {
    if (pendingTransactions.length > 0) {
      // Si hay transacciones pendientes, añadir esta también y enviar todas
      await addTransaction();
      await submitAllTransactions();
    } else {
      // Comportamiento anterior: enviar una sola transacción
      if (!token || !transactionType) return;

      try {
        const formValues = form.getValues();

        // Lógica de ruteo de sucursales
        let originBranch = currentBranchId?.toString() || '';
        let targetBranch = formValues.target_branch || '';

        if (
          transactionType === PRODUCT_IDS.DALE_PLAY ||
          transactionType === PRODUCT_IDS.ADVANCE
        ) {
          originBranch = '11';
          targetBranch = currentBranchId?.toString() || '';
        } else if (transactionType === PRODUCT_IDS.UTILITIES) {
          targetBranch = '26';
        } else if (transactionType === PRODUCT_IDS.REFUND) {
          targetBranch = '11';
        } else if (transactionType === PRODUCT_IDS.EMPIRE_PAYMENT) {
          targetBranch = '11';
        }

        const payload: TransactionDataPayload = {
          amount: values.amount,
          type: 'payment' as TransactionDataPayload['type'],
          order_id: '',
          plate: '',
          color: '',
          serial_number: '',
          in_number: '',
          out_number: '',
          year: '',
          invoice_number: '',
          reception_date:
            formValues.reception_date?.toISOString() ||
            currentDate.toISOString(),
          tax: '0',
          quantity: '1',
          product:
            transactionType === PRODUCT_IDS.EMPIRE_PAYMENT
              ? PRODUCT_IDS.PAYMENT
              : transactionType,
          origin_branch: originBranch,
          target_branch: targetBranch,
          user: currentUser?.id.toString() || '',
          responsible: currentUser?.id.toString() || '',
          notes: formValues.notes || '',
        };

        // Use the mutation from useTransactions hook
        createTransaction(payload, {
          onSuccess: () => {
            toast.toast({
              title: 'Éxito',
              description: 'Transacción creada correctamente',
              variant: 'default',
            });
            router.push(TRANSACTIONS);
          },
          onError: (error) => {
            toast.toast({
              title: 'Error',
              description: 'Ocurrió un error al crear la transacción',
              variant: 'destructive',
            });
          },
        });
      } catch (err) {
        toast.toast({
          title: 'Error',
          description: 'Ocurrió un error al crear la transacción',
          variant: 'destructive',
        });
      }
    }
  };

  if (isLoadingUser || isCreatingTransaction || isCreatingBatchTransactions)
    return <div>Cargando...</div>;

  if (isErrorUser) return <div>Error</div>;

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4 p-4 rounded"
        >
          {/* Título del formulario */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold">Transacción Financiera</h2>
          </div>

          {/* Transaction Type Selection - Dinámico */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Tipo de transacción (Producto)</FormLabel>
                <FormControl>
                  <div className="flex flex-col">
                    <select
                      id="type"
                      {...field}
                      className="px-3 py-2 border rounded-md"
                      value={transactionType || ''}
                      onChange={(e) => {
                        setTransactionType(e.target.value);
                        field.onChange(e.target.value);
                      }}
                    >
                      <option value="" disabled>
                        Seleccione el producto financiero
                      </option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monto</FormLabel>
                <FormControl>
                  <Input id="amount" type="text" placeholder="400" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reception_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fecha de Recepción</FormLabel>
                <FormControl>
                  <DatePicker
                    selected={field.value}
                    onChange={(date: Date) => field.onChange(date)}
                    className="px-3 py-2 border rounded-md w-full"
                    dateFormat="yyyy-MM-dd"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Concepto</FormLabel>
                <FormControl>
                  <textarea
                    id="notes"
                    className="px-3 py-2 border rounded-md w-full"
                    placeholder="Añadir observaciones sobre el pago"
                    rows={1}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mostrar el campo target_branch solo si no es un ruteo automático */}
          {transactionType !== PRODUCT_IDS.UTILITIES &&
            transactionType !== PRODUCT_IDS.ADVANCE &&
            transactionType !== PRODUCT_IDS.DALE_PLAY &&
            transactionType !== PRODUCT_IDS.REFUND &&
            transactionType !== PRODUCT_IDS.EMPIRE_PAYMENT && (
              <FormField
                control={form.control}
                name="target_branch"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sucursal de destino</FormLabel>
                    <FormControl>
                      <select
                        id="target_branch"
                        {...field}
                        className="px-3 py-2 border rounded-md w-full"
                      >
                        <option value="" disabled>
                          Seleccione sucursal de destino
                        </option>
                        {branches
                          .filter(
                            (branch) =>
                              branch.id.toString() !==
                              currentBranchId?.toString()
                          )
                          .map((branch) => (
                            <option key={branch.id} value={branch.id}>
                              {branch.name}
                            </option>
                          ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

          {/* Botones de acción */}
          <div className="flex space-x-4 mt-6">
            <Button
              type="button"
              onClick={addTransaction}
              className="bg-blue-500 hover:bg-blue-600"
            >
              Añadir Transacción
            </Button>

            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600"
              disabled={isCreatingTransaction || isCreatingBatchTransactions}
            >
              {pendingTransactions.length > 0
                ? 'Enviar Todas'
                : 'Crear Transacción'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Lista de transacciones pendientes */}
      {pendingTransactions.length > 0 && (
        <div className="mt-8 p-4 border rounded-md">
          <h3 className="text-lg font-semibold mb-4">
            Transacciones Pendientes ({pendingTransactions.length})
          </h3>
          <div className="space-y-4">
            {pendingTransactions.map((transaction, index) => (
              <div
                key={index}
                className="p-3 bg-gray-100 rounded-md flex justify-between items-center"
              >
                <div>
                  <p>
                    <strong>Tipo:</strong> {transaction.type}
                  </p>
                  <p>
                    <strong>Monto:</strong> {transaction.amount}
                  </p>
                  {transaction.plate && (
                    <p>
                      <strong>Placa:</strong> {transaction.plate}
                    </p>
                  )}
                  {transaction.product && (
                    <p>
                      <strong>Producto:</strong>{' '}
                      {transaction.productName || transaction.product}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={() => removeTransaction(index)}
                  className="bg-red-500 hover:bg-red-600 text-white"
                  size="sm"
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Button
              type="button"
              onClick={submitAllTransactions}
              className="bg-green-500 hover:bg-green-600 w-full"
              disabled={isCreatingBatchTransactions}
            >
              Enviar Todas las Transacciones
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
