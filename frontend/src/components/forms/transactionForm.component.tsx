'use client';

import * as z from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command.component';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover.component';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransactionFormSchema as formSchema } from '@/schemas/transaction.schema';
import React, { useState, useEffect, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { useToast } from '../ui/use-toast';
import {
  useAuthService,
  useToken,
  useSuperuser,
  useUserRole,
  useRoles,
} from '@/stores/auth/auth.store';
import 'react-datepicker/dist/react-datepicker.css';
import * as routes from '@/constants/routes';
import {
  TransactionDataPayload,
  TransactionDataResult,
} from '@/services/transactions/types/GetAllTransactions';
import { useQuery } from '@tanstack/react-query';
import DatePicker from 'react-datepicker';
import { useTransactions } from '@/hooks/useTransactions';
import { BranchService } from '@/services/branches/branch.service';
import { useBranchInventory } from '@/hooks/useBranchInventory';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useAllBikes, useAllParts } from '@/hooks/products';
import ProductUtils from '@/utils/productUtils';
import { useAllBranches } from '@/hooks/useAllBranches';
import { BIKES_COLORS } from '@/constants/products';
import { applyQueryConfig } from '@/config/queryOptimization.config';

/**
 * El selector de Producto trae solo una primera página: nadie hace scroll de
 * 10.000 items. Lo que no entra acá se encuentra con el buscador, que filtra
 * en el backend (ver `productSearch`).
 */
const PRODUCT_SELECTOR_PAGE_SIZE = '100';

/** Espera antes de mandar al backend lo que se escribe en el buscador. */
const PRODUCT_SEARCH_DEBOUNCE_MS = 400;

/**
 * Arranca sólo recibe motos con GPS instalado. Es string porque así guarda el
 * formulario el `target_branch`. No se ofrece como destino de motos: las motos le
 * llegan solo por el módulo de Solicitudes Arranca. Solo aparece al editar
 * una transacción que ya iba a Arranca, para no perder el valor guardado.
 */
const ARRANCA_BRANCH_ID = '43';

type FormValues = z.infer<typeof formSchema>;
const branchService = new BranchService();

interface TransactionFormProps {
  transactionToEdit?: TransactionDataResult;
  isEditing?: boolean;
}

// Transaction type options
const TRANSACTION_CATEGORIES = [
  { id: 'motorcycle', name: 'Moto' },
  { id: 'spare_parts', name: 'Repuestos' },
];

// Transaction types
const TYPES = [
  { id: 'sale', name: 'Venta por sucursal' },
  { id: 'payment', name: 'Pago' },
  { id: 'purchase', name: 'Compra' },
  // Compra Empire - Solo para concesionarios y administradores
  // Usamos 'empire_purchase' como identificador interno, pero enviamos 'purchase' al backend
  { id: 'empire_purchase', name: 'Compra Empire' },
];

export function TransactionForm({
  transactionToEdit,
  isEditing = false,
}: TransactionFormProps = {}) {
  const { TRANSACTIONS } = routes;
  const authService = useAuthService();
  const currentBranchId = useCurrentBranchId();
  const toast = useToast();
  const token = useToken();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentDate = new Date();
  const isSuperuser = useSuperuser();
  const userRole = useUserRole();
  const roles = useRoles();
  const isAdmin = roles.includes('admin');

  const categoryFromUrl = searchParams.get('category') ?? '';
  const [transactionType, setTransactionType] = useState<string>();
  const [transactionCategory, setTransactionCategory] =
    useState<string>(categoryFromUrl);
  // Producto elegido en el selector. Se guarda el objeto completo porque la
  // lista cargada cambia con cada búsqueda y puede dejar de contenerlo.
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');
  const [branches, setBranches] = useState<any[]>([]);
  // Estado para controlar el popover del selector de productos
  const [productSelectorOpen, setProductSelectorOpen] = useState(false);
  // Texto del buscador del selector de productos (se manda al backend)
  const [productSearch, setProductSearch] = useState('');
  const [debouncedProductSearch] = useDebounce(
    productSearch,
    PRODUCT_SEARCH_DEBOUNCE_MS
  );

  // Estado para almacenar múltiples transacciones
  const [pendingTransactions, setPendingTransactions] = useState<
    TransactionDataPayload[]
  >([]);

  const {
    createTransaction,
    isCreatingTransaction,
    createTransactionError,
    createBatchTransactions,
    isCreatingBatchTransactions,
    createBatchTransactionsError,
    updateTransaction,
    isUpdatingTransaction,
  } = useTransactions(token);

  const {
    data: currentUser,
    isLoading: isLoadingUser,
    isError: isErrorUser,
  } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => authService.getCurrentUser(token ?? ''),
    ...applyQueryConfig('USERS'),
  });

  /**
   * De dónde salen los productos del selector. Cada combinación
   * categoría × tipo usa una sola consulta y las demás quedan apagadas: antes
   * se pedían el catálogo de motos y el de repuestos aunque se estuviera
   * cargando una transacción de la otra categoría.
   */
  const isEmpirePurchase = transactionType === 'empire_purchase';
  const isMotorcycleCategory = transactionCategory === 'motorcycle';
  const isSparePartsCategory = transactionCategory === 'spare_parts';

  const needsAllBikes = isMotorcycleCategory && isEmpirePurchase;
  const needsAllParts = isSparePartsCategory && isEmpirePurchase;
  const needsBikeInventory = isMotorcycleCategory && !isEmpirePurchase;
  const needsPartInventory = isSparePartsCategory && !isEmpirePurchase;

  const { bikeInventory, partInventory } = useBranchInventory(
    { pageSize: PRODUCT_SELECTOR_PAGE_SIZE },
    {
      enabled: {
        bikeInventory: needsBikeInventory,
        partInventory: needsPartInventory,
        // El formulario solo usa los dos inventarios de arriba
        purchasedProducts: false,
        soldProducts: false,
        financialProducts: false,
        generalBikeInventory: false,
      },
    }
  );

  const allBikes = useAllBikes(
    {
      pageSize: PRODUCT_SELECTOR_PAGE_SIZE,
      search: debouncedProductSearch,
    },
    { enabled: needsAllBikes }
  );
  const allParts = useAllParts(
    {
      pageSize: PRODUCT_SELECTOR_PAGE_SIZE,
      search: debouncedProductSearch,
    },
    { enabled: needsAllParts }
  );

  const { data: allBranches = [] } = useAllBranches();

  /**
   * `useBranchInventory` guarda sus parámetros en estado interno, así que la
   * búsqueda se le pasa por `setSearch` en vez de por argumento.
   */
  useEffect(() => {
    if (needsBikeInventory) {
      bikeInventory.setSearch(debouncedProductSearch);
    }
    if (needsPartInventory) {
      partInventory.setSearch(debouncedProductSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedProductSearch, needsBikeInventory, needsPartInventory]);

  // Productos que se muestran en el selector según categoría y tipo
  const products: any[] = useMemo(() => {
    if (needsAllBikes) return allBikes.data?.results || [];
    if (needsAllParts) return allParts.data?.results || [];
    if (needsBikeInventory) return bikeInventory.data?.results || [];
    if (needsPartInventory) return partInventory.data?.results || [];
    return [];
  }, [
    needsAllBikes,
    needsAllParts,
    needsBikeInventory,
    needsPartInventory,
    allBikes.data,
    allParts.data,
    bikeInventory.data,
    partInventory.data,
  ]);

  // `isFetching` y no `isLoading`: con la consulta apagada `isLoading` queda
  // en `true` para siempre (React Query v4)
  const isLoadingProducts =
    (needsAllBikes && allBikes.isFetching) ||
    (needsAllParts && allParts.isFetching) ||
    (needsBikeInventory && bikeInventory.isFetching) ||
    (needsPartInventory && partInventory.isFetching);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount:
        isEditing && transactionToEdit
          ? transactionToEdit.amount.toString()
          : '',
      type: '',
      responsable: '',
      product: transactionToEdit?.product.id.toString() || '',
      date_delivered: currentDate,
      origin_branch: '',
      target_branch: '',
      notes:
        isEditing && transactionToEdit ? transactionToEdit.notes || '' : '',
      out_number: '',
      invoice_origin: '',
      motor_serial: '',
    },
  });

  // Limpiar el producto seleccionado cuando cambia la categoría o tipo
  // (solo si no está en modo edición): la lista pasa a ser de otro origen
  useEffect(() => {
    if (isEditing) return;

    form.setValue('product', '');
    setSelectedProduct(null);
    setSelectedProductName('');
    setProductSearch('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionCategory, transactionType, isEditing]);

  useEffect(() => {
    const fetchBranches = async () => {
      if (token) {
        try {
          const branchIdParam = currentBranchId?.toString() || '20';
          const branchesData = await branchService.getBranches(
            token,
            branchIdParam
          );
          setBranches(branchesData.data || []);
        } catch (error) {
          console.error('Error fetching branches:', error);
        }
      }
    };

    fetchBranches();
  }, [currentBranchId, token]);

  useEffect(() => {
    if (!selectedProduct || isEditing) return;

    if (isMotorcycleCategory) {
      ProductUtils.updateMotorcycleFields(form, selectedProduct);
    }
  }, [form, selectedProduct, isMotorcycleCategory, isEditing]);

  const targetBranch = form.watch('target_branch');

  useEffect(() => {
    if (!transactionType) return;
    if (!selectedProduct || !selectedProduct.prices) return;

    let newAmount = '';

    if (transactionType === 'empire_purchase') {
      newAmount = selectedProduct.prices.cost?.toString() || '';
    } else if (targetBranch === '36') {
      // ID for DalePlay
      newAmount = selectedProduct.prices.dpPrice?.toString() || '';
    } else if (targetBranch === '32') {
      // ID for El Panita
      newAmount = selectedProduct.prices.epPrice?.toString() || '';
    }

    if (newAmount) {
      form.setValue('amount', newAmount);
    }
  }, [form, selectedProduct, transactionType, targetBranch]);

  /**
   * Destino Arranca con motos del inventario de la sucursal: se pide el
   * inventario con `needGps=true` y el selector deja afuera las motos sin
   * IMEI. Compra Empire no entra porque no elige destino.
   */
  const needsGpsFilter =
    needsBikeInventory && targetBranch === ARRANCA_BRANCH_ID;

  useEffect(() => {
    if (!needsBikeInventory) return;
    bikeInventory.setNeedGps(needsGpsFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsGpsFilter, needsBikeInventory]);

  const selectableProducts = useMemo(
    () =>
      needsGpsFilter
        ? products.filter((product) => !!product.gpsImei?.toString().trim())
        : products,
    [needsGpsFilter, products]
  );

  // Una moto ya elegida que no tiene GPS no sirve para Arranca: se suelta
  useEffect(() => {
    if (!needsGpsFilter || isEditing || !selectedProduct) return;
    if (selectedProduct.gpsImei?.toString().trim()) return;

    form.setValue('product', '');
    setSelectedProduct(null);
    setSelectedProductName('');
  }, [needsGpsFilter, selectedProduct, isEditing, form]);

  useEffect(() => {
    if (isEditing && transactionToEdit) {
      // Establecer el tipo de transacción
      const isEmpirePurchase =
        transactionToEdit.type === 'purchase' &&
        transactionToEdit.originBranch?.id === 11;

      const typeToSet = isEmpirePurchase
        ? 'empire_purchase'
        : transactionToEdit.type;
      setTransactionType(typeToSet);

      // Determinar la categoría de transacción basada en el producto
      const category =
        transactionToEdit.product.category === 1 ? 'motorcycle' : 'spare_parts';
      setTransactionCategory(category);

      // Establecer valores del formulario
      form.setValue('amount', transactionToEdit.amount.toString());
      form.setValue('type', typeToSet);
      form.setValue('order_id', transactionToEdit.orderId || '');
      form.setValue('invoice_number', transactionToEdit.invoiceNumber || '');
      form.setValue(
        'reception_date',
        transactionToEdit.receptionDate
          ? new Date(transactionToEdit.receptionDate)
          : new Date()
      );
      form.setValue('notes', transactionToEdit.notes || '');

      if (isEmpirePurchase && transactionToEdit.invoiceOrigin) {
        form.setValue(
          'invoice_origin',
          typeof transactionToEdit.invoiceOrigin === 'object'
            ? transactionToEdit.invoiceOrigin.name
            : transactionToEdit.invoiceOrigin
        );
      }

      // Campos específicos según la categoría
      if (category === 'motorcycle') {
        form.setValue('plate', transactionToEdit.plate || '');
        form.setValue('color', transactionToEdit.color || '');
        form.setValue('serial_number', transactionToEdit.serialNumber || '');
        form.setValue('motor_serial', transactionToEdit.motorSerial || '');
        form.setValue('in_number', transactionToEdit.inNumber || '');
        form.setValue(
          'out_number',
          (transactionToEdit as any).out_number ||
            (transactionToEdit as any).outNumber ||
            ''
        );
        form.setValue('year', transactionToEdit.year || '');
      } else if (category === 'spare_parts') {
        form.setValue(
          'quantity',
          transactionToEdit.quantity?.toString() || '1'
        );
      }

      // Establecer sucursales
      if (transactionToEdit.originBranch) {
        form.setValue(
          'origin_branch',
          transactionToEdit.originBranch.id.toString()
        );
      }
      if (transactionToEdit.targetBranch) {
        form.setValue(
          'target_branch',
          transactionToEdit.targetBranch.id.toString()
        );
      }

      // Establecer producto
      if (transactionToEdit.product) {
        form.setValue('product', transactionToEdit.product.id.toString());
        setSelectedProductName(transactionToEdit.product.name);
      }
    } else if (currentBranchId) {
      form.setValue('origin_branch', currentBranchId?.toString());
    }
  }, [currentBranchId, form, isEditing, transactionToEdit]);

  /**
   * Crea un objeto de payload de transacción a partir de los valores del formulario
   */
  const createTransactionPayload = (
    formValues: any
  ): TransactionDataPayload => {
    // Determinar origin_branch y target_branch según el tipo de transacción
    // Si estamos editando, preservar el origin_branch original
    let originBranch =
      isEditing && transactionToEdit
        ? formValues.origin_branch ||
          transactionToEdit.originBranch?.id.toString() ||
          ''
        : currentBranchId?.toString() || formValues.origin_branch || '';
    let targetBranch = formValues.target_branch || '';

    // Si es Compra Empire y NO estamos editando, cambiar origin_branch a '11' (Empire) y target_branch al ID de la sucursal actual
    if (transactionType === 'empire_purchase' && !isEditing) {
      originBranch = '11'; // ID fijo para Empire
      targetBranch = currentBranchId?.toString() || '';

      // Validación crítica: Verificar que origin_branch y target_branch no sean iguales
      if (originBranch === targetBranch) {
        throw new Error(
          'Error de configuración: La sucursal de origen y destino no pueden ser iguales en una Compra Empire'
        );
      }
    }

    // Crear el payload base
    const payload: TransactionDataPayload = {
      amount: formValues.amount,
      type: (transactionType === 'empire_purchase'
        ? 'purchase'
        : transactionType || 'payment') as TransactionDataPayload['type'],
      order_id: formValues.order_id || '',
      plate: '',
      color: '',
      serial_number: '',
      motor_serial: '',
      in_number: '',
      out_number: '',
      year: '',
      invoice_number: formValues.invoice_number || '',
      invoice_origin: formValues.invoice_origin || '',
      reception_date:
        formValues.reception_date?.toISOString() || currentDate.toISOString(),
      tax: '',
      quantity: '',
      product: formValues.product
        ? ProductUtils.getBaseId(formValues.product)
        : formValues.product || '',
      origin_branch: originBranch,
      target_branch: targetBranch,
      user: currentUser?.id.toString() || '',
      responsible: currentUser?.id.toString() || '',
      notes: formValues.notes || '',
    };

    // Añadir campos específicos según la categoría de transacción
    if (transactionCategory === 'motorcycle') {
      payload.plate = formValues.plate || '';
      payload.color = formValues.color || '';
      payload.serial_number = formValues.serial_number || '';
      payload.motor_serial = formValues.motor_serial || '';
      payload.in_number = formValues.in_number || '';
      payload.out_number = formValues.out_number || '';
      payload.year = formValues.year || '';
      payload.tax = '0';
      payload.quantity = '1';
    } else if (transactionCategory === 'spare_parts') {
      payload.serial_number = '';
      payload.year = '';
      payload.tax = '0';
      payload.quantity = formValues.quantity || '';
    }

    return payload;
  };

  // Función para añadir una transacción a la lista pendiente
  const addTransaction = async () => {
    if (!token) return;

    // Validar que las sucursales de tipo 'aliado' solo puedan realizar ventas
    if (userRole === 'aliado' && transactionType !== 'sale') {
      toast.toast({
        title: 'Error',
        description:
          'Las sucursales de tipo aliado solo pueden realizar ventas',
        variant: 'destructive',
      });
      return;
    }

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

      // Crear el payload usando la función auxiliar
      const payload = createTransactionPayload(formValues);

      // Añadir el nombre del producto para la interfaz (no se enviará al backend)
      const payloadWithProductName = {
        ...payload,
        productName: selectedProductName,
      };

      setPendingTransactions([...pendingTransactions, payloadWithProductName]);

      // Mostrar mensaje de éxito
      toast.toast({
        title: 'Transacción añadida',
        description: 'La transacción ha sido añadida a la lista pendiente',
      });

      // Resetear el formulario para la siguiente transacción.
      // Se conservan order_id (Número de aprobación) e invoice_number (Número
      // de factura) para no reescribirlos en transacciones consecutivas.
      // El resto se limpia con '' (nunca undefined) para mantener los inputs
      // controlados y evitar valores fantasma que no se envían al backend.
      form.reset({
        amount: '',
        type: '',
        responsable: '',
        order_id: formValues.order_id || '',
        invoice_number: formValues.invoice_number || '',
        invoice_origin: '',
        notes: '',
        product: '',
        plate: '',
        color: '',
        serial_number: '',
        motor_serial: '',
        in_number: '',
        out_number: '',
        year: '',
        quantity: '',
        date_delivered: currentDate,
        origin_branch: currentBranchId?.toString() || '',
        target_branch: '',
      });
      setTransactionType(undefined);
      setTransactionCategory('');
      setSelectedProduct(null);
      setSelectedProductName('');
      setProductSearch('');
    } catch (err) {
      toast.toast({
        title: 'Error de configuración',
        description:
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al añadir la transacción',
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
    // Validar que las sucursales de tipo 'aliado' solo puedan realizar ventas
    if (userRole === 'aliado' && transactionType !== 'sale') {
      toast.toast({
        title: 'Error',
        description:
          'Las sucursales de tipo aliado solo pueden realizar ventas',
        variant: 'destructive',
      });
      return;
    }

    if (!token) return;

    try {
      const formValues = form.getValues();

      // Crear el payload usando la función auxiliar
      const payload = createTransactionPayload(formValues);

      // Asegurar que se use el valor correcto de amount desde values
      payload.amount = values.amount;

      // Si la validación interna lanzó error (p.ej., sucursal origen = destino en Compra Empire), se capturará aquí
      if (
        transactionType === 'empire_purchase' &&
        payload.origin_branch === payload.target_branch
      ) {
        toast.toast({
          title: 'Error de configuración',
          description:
            'La sucursal de origen y destino no pueden ser iguales en una Compra Empire',
          variant: 'destructive',
        });
        return;
      }

      // Si estamos editando, añadir el ID de la transacción al payload
      if (isEditing && transactionToEdit) {
        payload.id = transactionToEdit.id.toString();

        // Usar la mutación de actualización
        updateTransaction(payload, {
          onSuccess: () => {
            toast.toast({
              title: 'Éxito',
              description: 'Transacción actualizada correctamente',
            });
            router.push(TRANSACTIONS);
          },
          onError: (error) => {
            toast.toast({
              title: 'Error',
              description: 'Ocurrió un error al actualizar la transacción',
              variant: 'destructive',
            });
          },
        });
      } else {
        // Si hay transacciones pendientes, añadir esta también y enviar todas
        if (pendingTransactions.length > 0) {
          await addTransaction();
          await submitAllTransactions();
        } else {
          // Comportamiento para crear una nueva transacción
          createTransaction(payload, {
            onSuccess: () => {
              toast.toast({
                title: 'Éxito',
                description: 'Transacción creada correctamente',
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
        }
      }
    } catch (err) {
      toast.toast({
        title: 'Error',
        description:
          err instanceof Error
            ? err.message
            : 'Ocurrió un error al crear la transacción',
        variant: 'destructive',
      });
    }
  };

  if (
    isLoadingUser ||
    isCreatingTransaction ||
    isCreatingBatchTransactions ||
    isUpdatingTransaction
  )
    return <div>Cargando...</div>;

  if (isErrorUser) return <div>Error</div>;

  return (
    <div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4 p-4 rounded"
        >
          {/* Transaction Category Selection */}
          <div className="mb-4">
            <FormLabel>Categoría de Transacción</FormLabel>
            <select
              className="px-3 py-2 border rounded-md w-full"
              value={transactionCategory}
              onChange={(e) => setTransactionCategory(e.target.value)}
              aria-label="transactionCategory"
              disabled={!!categoryFromUrl && !isAdmin}
            >
              <option value="" disabled>
                Seleccione la categoría de transacción
              </option>
              {TRANSACTION_CATEGORIES.map((category, index) => (
                <option key={`${category.id}_${index}`} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Transaction Type Selection */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Tipo de transacción</FormLabel>
                <FormControl>
                  <div className="flex flex-col">
                    <select
                      id="type"
                      {...field}
                      className="px-3 py-2 border rounded-md"
                      value={transactionType || ''}
                      onChange={(e) => setTransactionType(e.target.value)}
                    >
                      <option value="" disabled>
                        Seleccione el tipo de transacción
                      </option>
                      {TYPES.filter(
                        (type) =>
                          // Filtrar 'payment' para categorías específicas
                          !(
                            type.id === 'payment' &&
                            (transactionCategory === 'motorcycle' ||
                              transactionCategory === 'spare_parts')
                          ) &&
                          // Mostrar 'empire_purchase' solo para administradores o concesionarios
                          !(
                            type.id === 'empire_purchase' &&
                            !(isSuperuser || userRole === 'concesionario')
                          ) &&
                          // Las sucursales de tipo 'aliado' solo pueden realizar ventas
                          !(userRole === 'aliado' && type.id !== 'sale')
                      ).map((type, index) => (
                        <option key={`${type.id}_${index}`} value={type.id}>
                          {type.name}
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

          {/* Common Fields for All Transaction Types */}
          <FormField
            control={form.control}
            name="order_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de aprobación</FormLabel>
                <FormControl>
                  <Input
                    id="order_id"
                    type="text"
                    placeholder="13222345"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="invoice_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de Factura</FormLabel>
                <FormControl>
                  <Input
                    id="invoice_number"
                    type="text"
                    placeholder="111651322"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {transactionType === 'empire_purchase' && (
            <FormField
              control={form.control}
              name="invoice_origin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen de factura</FormLabel>
                  <FormControl>
                    <div className="flex flex-col">
                      <select
                        id="invoice_origin"
                        {...field}
                        className="px-3 py-2 border rounded-md"
                        value={field.value || ''}
                      >
                        <option value="" disabled>
                          Seleccione el origen de factura
                        </option>
                        {allBranches.map((branch: any) => (
                          <option key={branch.id} value={branch.name}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="reception_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {transactionType === 'sale'
                    ? 'Fecha de venta'
                    : 'Fecha de Recepción'}
                </FormLabel>
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
                <FormLabel>Observaciones</FormLabel>
                <FormControl>
                  <textarea
                    id="notes"
                    className="px-3 py-2 border rounded-md w-full"
                    placeholder="Añadir observaciones sobre la transacción"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/*
            Target Branch Selection - Ocultar cuando es Compra Empire.
            Va antes de Producto: con destino Arranca cambia qué motos se listan.
          */}
          {transactionType !== 'empire_purchase' && (
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
                              currentBranchId?.toString() &&
                            (!isMotorcycleCategory ||
                              branch.id.toString() !== ARRANCA_BRANCH_ID ||
                              field.value?.toString() === ARRANCA_BRANCH_ID)
                        )
                        .map((branch, index) => (
                          <option
                            key={`${branch.id}_${index}`}
                            value={branch.id}
                          >
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

          {/* Product Selection */}
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <FormControl>
                  {isEditing && transactionToEdit ? (
                    <>
                      <Input
                        id="product"
                        value={ProductUtils.getName(
                          transactionToEdit.product as any,
                          transactionToEdit.product.category === 1
                        )}
                        disabled
                        className="px-3 py-2 border rounded-md w-full bg-gray-100"
                      />
                      <input type="hidden" {...field} />
                    </>
                  ) : (
                    <Popover
                      open={productSelectorOpen}
                      onOpenChange={setProductSelectorOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={productSelectorOpen}
                          className="w-full justify-between"
                          disabled={!transactionCategory}
                        >
                          <span className="truncate">
                            {field.value
                              ? selectedProductName || 'Producto seleccionado'
                              : !transactionCategory
                                ? 'Seleccione primero una categoría de transacción'
                                : 'Seleccione un producto...'}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-full p-0"
                        style={{ width: 'var(--radix-popover-trigger-width)' }}
                      >
                        {/*
                          `shouldFilter={false}`: el filtrado lo hace el backend
                          con `productSearch`. Si además filtrara cmdk sobre el
                          texto visible, escondería resultados que el backend sí
                          encontró (p. ej. por un campo que no se muestra).
                        */}
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Buscar producto..."
                            value={productSearch}
                            onValueChange={setProductSearch}
                          />
                          <CommandEmpty>
                            {isLoadingProducts
                              ? 'Buscando productos...'
                              : 'No se encontró ningún producto.'}
                          </CommandEmpty>
                          <CommandGroup className="max-h-64 overflow-auto">
                            {selectableProducts.map((product, index) => {
                              const productId = ProductUtils.getId(product);
                              const isMotorcycle =
                                transactionCategory === 'motorcycle';
                              const displayText = ProductUtils.getName(
                                product,
                                isMotorcycle
                              );

                              return (
                                <CommandItem
                                  key={`${productId}_${index}`}
                                  value={`${productId}_${index}`}
                                  onSelect={() => {
                                    field.onChange(productId);
                                    setSelectedProduct(product);
                                    setSelectedProductName(displayText);
                                    setProductSelectorOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      'mr-2 h-4 w-4',
                                      field.value === productId
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    )}
                                  />
                                  {displayText}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Commented out product selection dropdown
          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Producto</FormLabel>
                <FormControl>
                  <select
                    id="product"
                    {...field}
                    className="px-3 py-2 border rounded-md w-full"
                  >
                    <option value="" disabled>
                      Seleccione un producto
                    </option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          */}

          {/* Branch Selection Fields - Added for all transaction categories */}
          {/* Commented out as requested - the user ID is still being set in the useEffect hook
          <FormField
            control={form.control}
            name="origin_branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sucursal de origen</FormLabel>
                <FormControl>
                  <select
                    id="origin_branch"
                    {...field}
                    className="px-3 py-2 border rounded-md w-full"
                    disabled
                  >
                    <option value="" disabled>
                      Seleccione sucursal de origen
                    </option>
                    {branches.map((branch) => (
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
          */}

          {/* Additional fields based on transaction category */}
          {transactionCategory === 'motorcycle' && (
            <>
              <FormField
                control={form.control}
                name="plate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa</FormLabel>
                    <FormControl>
                      <Input
                        id="plate"
                        type="text"
                        placeholder="Placa"
                        {...field}
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
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <select
                        id="color"
                        {...field}
                        value={field.value || ''}
                        className="px-3 py-2 border rounded-md w-full"
                      >
                        <option value="" disabled>
                          Seleccione el color
                        </option>
                        {BIKES_COLORS.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serial_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial del chasis</FormLabel>
                    <FormControl>
                      <Input
                        id="serial_number"
                        type="text"
                        placeholder="Serial del chasis"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motor_serial"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Serial del motor</FormLabel>
                    <FormControl>
                      <Input
                        id="motor_serial"
                        type="text"
                        placeholder="Serial del motor"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="in_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de entrada</FormLabel>
                    <FormControl>
                      <Input
                        id="in_number"
                        type="text"
                        placeholder="Número de entrada"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {transactionType === 'sale' && (
                <FormField
                  control={form.control}
                  name="out_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de salida</FormLabel>
                      <FormControl>
                        <Input
                          id="out_number"
                          type="number"
                          placeholder="Número de salida"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Año</FormLabel>
                    <FormControl>
                      <Input
                        id="year"
                        type="text"
                        placeholder="Año"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {transactionCategory === 'spare_parts' && (
            <>
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cantidad</FormLabel>
                    <FormControl>
                      <Input
                        id="quantity"
                        type="text"
                        placeholder="Cantidad"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-4 mt-6">
            {!isEditing && (
              <Button
                type="button"
                onClick={addTransaction}
                className="bg-blue-500 hover:bg-blue-600"
              >
                Añadir Transacción
              </Button>
            )}

            <Button
              type="submit"
              className="bg-green-500 hover:bg-green-600 w-full"
              disabled={
                isCreatingTransaction ||
                isCreatingBatchTransactions ||
                isUpdatingTransaction
              }
            >
              {isEditing
                ? 'Actualizar Transacción'
                : pendingTransactions.length > 0
                  ? 'Enviar Todas'
                  : 'Crear Transacción'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Lista de transacciones pendientes - Solo mostrar si no estamos en modo edición */}
      {!isEditing && pendingTransactions.length > 0 && (
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

// {transactionCategory === 'motorcycle' && (
//             <>
//               <FormField
//                 control={form.control}
//                 name="plate"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Placa</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="plate"
//                         type="text"
//                         placeholder="Placa"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="color"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Color</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="color"
//                         type="text"
//                         placeholder="Color"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="serial_number"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Serial del chasis</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="serial_number"
//                         type="text"
//                         placeholder="Serial del chasis"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="in_number"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Número de entrada</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="in_number"
//                         type="text"
//                         placeholder="Número de entrada"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="year"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Año</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="year"
//                         type="text"
//                         placeholder="Año"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </>
//           )}

//           {transactionCategory === 'spare_parts' && (
//             <>
//               <FormField
//                 control={form.control}
//                 name="serial_number"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Número de serie</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="serial_number"
//                         type="text"
//                         placeholder="Número de serie"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="year"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Año</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="year"
//                         type="text"
//                         placeholder="Año"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="tax"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Impuesto</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="tax"
//                         type="text"
//                         placeholder="Impuesto"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />

//               <FormField
//                 control={form.control}
//                 name="quantity"
//                 render={({ field }) => (
//                   <FormItem>
//                     <FormLabel>Cantidad</FormLabel>
//                     <FormControl>
//                       <Input
//                         id="quantity"
//                         type="text"
//                         placeholder="Cantidad"
//                         {...field}
//                       />
//                     </FormControl>
//                     <FormMessage />
//                   </FormItem>
//                 )}
//               />
//             </>
//           )}

//           {/* Botones de acción */}
//           <div className="flex space-x-4 mt-6">
//             <Button
//               type="button"
//               onClick={addTransaction}
//               className="bg-blue-500 hover:bg-blue-600"
//             >
//               Añadir Transacción
//             </Button>

//             <Button
//               type="submit"
//               className="bg-green-500 hover:bg-green-600"
//               disabled={isCreatingTransaction || isCreatingBatchTransactions}
//             >
//               {pendingTransactions.length > 0
//                 ? 'Enviar Todas'
//                 : 'Crear Transacción'}
//             </Button>
//           </div>
//         </form>
//       </Form>

//       {/* Lista de transacciones pendientes */}
//       {pendingTransactions.length > 0 && (
//         <div className="mt-8 p-4 border rounded-md">
//           <h3 className="text-lg font-semibold mb-4">
//             Transacciones Pendientes ({pendingTransactions.length})
//           </h3>
//           <div className="space-y-4">
//             {pendingTransactions.map((transaction, index) => (
//               <div
//                 key={index}
//                 className="p-3 bg-gray-100 rounded-md flex justify-between items-center"
//               >
//                 <div>
//                   <p>
//                     <strong>Tipo:</strong> {transaction.type}
//                   </p>
//                   <p>
//                     <strong>Monto:</strong> {transaction.amount}
//                   </p>
//                   {transaction.plate && (
//                     <p>
//                       <strong>Placa:</strong> {transaction.plate}
//                     </p>
//                   )}
//                   {transaction.product && (
//                     <p>
//                       <strong>Producto:</strong>{' '}
//                       {transaction.productName || transaction.product}
//                     </p>
//                   )}
//                 </div>
//                 <Button
//                   type="button"
//                   onClick={() => removeTransaction(index)}
//                   className="bg-red-500 hover:bg-red-600 text-white"
//                   size="sm"
//                 >
//                   Eliminar
//                 </Button>
//               </div>
//             ))}
//           </div>
//           <div className="mt-4">
//             <Button
//               type="button"
//               onClick={submitAllTransactions}
//               className="bg-green-500 hover:bg-green-600 w-full"
//               disabled={isCreatingBatchTransactions}
//             >
//               Enviar Todas las Transacciones
//             </Button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }
