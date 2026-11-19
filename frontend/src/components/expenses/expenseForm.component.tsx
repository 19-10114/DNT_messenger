'use client';

import { useEffect, useRef, useState } from 'react';
import { useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';
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
import { Textarea } from '@/components/ui/textarea.component';
import { Button } from '@/components/ui/button.component';
import { Checkbox } from '@/components/ui/checkbox.component';
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { useAllBranches, useExchangeRate } from '@/hooks';
import {
  useApproveExpense,
  useCreateExpense,
  useUpdateExpense,
} from '@/hooks/expenses';
import { ExpenseFormSchema, ExpenseFormValues } from '@/schemas/expense.schema';
import {
  CASH_EXPENSE_PAYMENT_METHODS,
  CASH_PAYMENT_METHODS,
  Expense,
  ExpenseCurrency,
  ExpensePaymentMethod,
  ExpenseRateType,
  ExpenseSupplier,
  PAYMENT_METHOD_CURRENCY,
} from '@/services/expenses/types/Expense.type';
import {
  PERSON_TYPE_LABELS,
  describeRetentionProfile,
} from '@/components/suppliers/supplier.utils';
import {
  useIsStaff,
  useRoles,
  useSuperuser,
  useToken,
  useUser,
} from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  BeneficiarySelect,
  BeneficiaryValue,
} from './beneficiarySelect.component';
import {
  EMPTY_CHARGE,
  ExpenseLinesEditor,
} from './expenseLinesEditor.component';
import { ExpenseTaxControls } from './expenseRetentions.component';
import { ModalSelectContent } from './modalSelectContent.component';
import { ReceiptsUpload } from './receiptsUpload.component';
import {
  BANKS,
  PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  canApproveExpenses,
  canBookAnyBranch,
  getExpenseErrorMessage,
  parseApiDate,
  toApiDate,
} from './expense.utils';

interface ExpenseFormProps {
  /** Presente = edición. La sucursal queda fija. */
  editExpense?: Expense;
  /** Alta desde Pre Gastos: nace pendiente, también si lo registra un admin. */
  asRequest?: boolean;
  /** Se llama tras guardar con éxito (el toast ya se mostró). */
  onSaved: () => void;
  /** Botón Cancelar. */
  onCancel: () => void;
}

// El calendario viene en inglés por defecto.
registerLocale('es', es);

/**
 * Qué datos del pago muestra cada medio, como en el pago de órdenes
 * (requiresPhone / requiresBank / requiresAccount). Cuáles son obligatorios:
 * PAYMENT_METHOD_REQUIRED_FIELDS.
 */
const PAYMENT_DETAILS: Partial<
  Record<
    ExpensePaymentMethod,
    { phone?: boolean; banks?: boolean; accounts?: boolean }
  >
> = {
  pago_movil: { phone: true, banks: true },
  transferencia: { banks: true, accounts: true },
  zelle: { accounts: true },
  binance: { accounts: true },
};

/** Select de banco (la lista del pago de órdenes). */
function BankField({
  name,
  label,
}: {
  name: 'originBank' | 'targetBank';
  label: string;
}) {
  const { control } = useFormContext<ExpenseFormValues>();
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select
            value={field.value || undefined}
            onValueChange={field.onChange}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona el banco" />
              </SelectTrigger>
            </FormControl>
            <ModalSelectContent>
              {BANKS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </ModalSelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

/** Título de un bloque del formulario, a lo ancho de las dos columnas. */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-b pb-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground md:col-span-2">
      {children}
    </h3>
  );
}

/** Número con dos decimales, o vacío si no hay cómo calcularlo. */
function toMoney(value: number): string {
  return Number.isFinite(value) && value > 0 ? value.toFixed(2) : '';
}

/**
 * El IVA y las retenciones con que se guardó un gasto, leídos de sus líneas
 * calculadas (el backend no los guarda aparte).
 */
function taxDefaults(expense: Expense): Partial<ExpenseFormValues> {
  const rateOf = (type: string) =>
    expense.lines.find((line) => line.lineType === type)?.rateApplied ?? null;
  const iva = rateOf('iva');
  const retIva = rateOf('ret_iva');
  const retIslr = rateOf('ret_islr');
  return {
    supplier: expense.supplier ? String(expense.supplier.id) : '',
    invoiceNumber: expense.invoiceNumber ?? '',
    controlNumber: expense.controlNumber ?? '',
    applyIva: iva !== null,
    ivaRate: String(iva ?? 16),
    retainIva: retIva !== null,
    ivaRetentionRate: retIva === 100 ? '100' : '75',
    retainIslr: retIslr !== null,
    islrRate: retIslr !== null ? String(retIslr) : '',
  };
}

function defaultValues(
  editExpense: Expense | undefined,
  branchId: string
): Partial<ExpenseFormValues> {
  if (editExpense) {
    const isBs = editExpense.currency === 'BS';
    return {
      branch: String(editExpense.branch.id),
      // Solo las líneas que se escriben: el IVA y las retenciones se
      // recalculan al guardar.
      lines: editExpense.lines
        .filter(
          (line) => line.lineType === 'cargo' || line.lineType === 'descuento'
        )
        .map((line) => ({
          category: String(line.category.id),
          concept: line.concept,
          lineType: line.lineType as 'cargo' | 'descuento',
          amount: String(line.amount),
          ivaExempt: line.ivaExempt,
        })),
      ...taxDefaults(editExpense),
      concept: editExpense.concept,
      beneficiary: editExpense.beneficiary,
      beneficiaryUser: editExpense.beneficiaryUser
        ? String(editExpense.beneficiaryUser.id)
        : '',
      excludedFromCash: editExpense.excludedFromCash,
      currency: editExpense.currency,
      rate: String(editExpense.rate),
      // Un gasto sin tipo de tasa (anterior al campo) conserva su tasa como
      // personalizada.
      rateType: editExpense.rateType || (isBs ? 'personalizada' : 'dolar_bcv'),
      paymentMethod: editExpense.paymentMethod,
      reference: editExpense.reference,
      phoneNumber: editExpense.phoneNumber,
      originBank: editExpense.originBank,
      targetBank: editExpense.targetBank,
      originAccount: editExpense.originAccount,
      targetAccount: editExpense.targetAccount,
      expenseDate: parseApiDate(editExpense.expenseDate),
      notes: editExpense.notes,
      receipts: [],
      removeReceipts: [],
    };
  }
  return {
    branch: branchId,
    lines: [{ ...EMPTY_CHARGE }],
    concept: '',
    beneficiary: '',
    beneficiaryUser: '',
    excludedFromCash: false,
    currency: 'USD',
    rate: '',
    rateType: 'dolar_bcv',
    paymentMethod: 'efectivo_usd',
    reference: '',
    phoneNumber: '',
    originBank: '',
    targetBank: '',
    originAccount: '',
    targetAccount: '',
    expenseDate: new Date(),
    notes: '',
    receipts: [],
    removeReceipts: [],
    supplier: '',
    invoiceNumber: '',
    controlNumber: '',
    applyIva: false,
    ivaRate: '16',
    retainIva: false,
    ivaRetentionRate: '75',
    retainIslr: false,
    islrRate: '',
  };
}

/**
 * Registro (o edición) de un gasto de sucursal, en cuatro bloques: datos
 * generales; forma de pago (tipo, moneda y tasa, ANTES del detalle, porque las
 * líneas se escriben en esa moneda); detalle (una o más líneas con su
 * categoría, y descuentos); y datos del pago (referencia, beneficiario,
 * bancos, comprobante). El monto a pagar es el neto de las líneas y lo calcula
 * el backend.
 *
 * El pago funciona como en el pago de órdenes: el tipo de pago fija la moneda
 * (salvo la transferencia, que la elige) y pide sus datos. En Bs las líneas se
 * escriben en Bs y se elige la tasa como en la orden. Solo el efectivo en USD
 * descuenta el efectivo de la sucursal.
 *
 * Desde Pre Gastos (`asRequest`) el gasto nace pendiente, lo registre quien lo
 * registre; desde Gastos solo un admin registra, y queda aprobado. Quien no es
 * admin siempre queda pendiente. Al editar un pendiente, un admin puede
 * guardar y aprobar a la vez.
 * Vive dentro de `ExpenseFormModal`: no navega, avisa por `onSaved` / `onCancel`.
 */
export function ExpenseForm({
  editExpense,
  asRequest = false,
  onSaved,
  onCancel,
}: ExpenseFormProps) {
  const { toast } = useToast();
  const token = useToken() ?? '';
  const user = useUser();
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const currentBranchId = useCurrentBranchId();
  const { data: branches = [] } = useAllBranches();
  const isEditing = !!editExpense;

  const anyBranch = canBookAnyBranch(roles, isSuperuser, isStaff);
  // Quien aprueba gastos (admin o finanzas, no "administrator"): registra
  // directo, aprueba al guardar y puede excluir un gasto de la caja. Misma
  // regla que el backend.
  const isAdmin = canApproveExpenses(roles, isSuperuser, isStaff);
  // La sucursal activa del selector global; "Todas" (0) no es una sucursal
  // válida para un gasto, así que cae a la del usuario.
  const initialBranch =
    currentBranchId && currentBranchId > 0
      ? String(currentBranchId)
      : user?.branch?.id
        ? String(user.branch.id)
        : '';

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: defaultValues(editExpense, initialBranch),
  });
  // El proveedor elegido, para mostrar su ficha fiscal y proponer sus
  // retenciones. En edición, el que tenía el gasto.
  const [supplierInfo, setSupplierInfo] = useState<ExpenseSupplier | undefined>(
    editExpense?.supplier ?? undefined
  );

  /**
   * Beneficiario elegido. Un proveedor propone su perfil: retención de IVA
   * (y entonces el IVA, que es de donde sale) y de ISLR. Sin proveedor no hay
   * retenciones.
   */
  const changeBeneficiary = ({
    userId,
    name,
    supplierId,
    supplier,
  }: BeneficiaryValue) => {
    form.setValue('beneficiaryUser', userId);
    form.setValue('beneficiary', name);
    form.setValue('supplier', supplierId ?? '');
    setSupplierInfo(supplierId ? supplier : undefined);
    const validate = { shouldValidate: form.formState.isSubmitted };
    if (supplierId && supplier) {
      const ivaRetention = supplier.ivaRetentionRate;
      form.setValue('retainIva', ivaRetention > 0, validate);
      form.setValue('ivaRetentionRate', ivaRetention === 100 ? '100' : '75');
      if (ivaRetention > 0) form.setValue('applyIva', true, validate);
      form.setValue(
        'retainIslr',
        supplier.islrRetentionRate !== null,
        validate
      );
      form.setValue(
        'islrRate',
        supplier.islrRetentionRate !== null
          ? String(supplier.islrRetentionRate)
          : '',
        validate
      );
    } else {
      form.setValue('retainIva', false, validate);
      form.setValue('retainIslr', false, validate);
    }
  };

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(editExpense?.id ?? 0);
  const approveMutation = useApproveExpense();
  const isSaving =
    createMutation.isLoading ||
    updateMutation.isLoading ||
    approveMutation.isLoading;
  // "Guardar y aprobar" (admin sobre un pendiente) pasa por el mismo submit.
  const approveAfterSave = useRef(false);
  const isPendingEdit = isEditing && editExpense?.status === 'pending_approval';

  const expenseDate = form.watch('expenseDate');
  const paymentMethod = form.watch('paymentMethod');
  const currency = form.watch('currency');
  const rateType = form.watch('rateType');
  // Comprobantes guardados que el usuario quitó (se borran al guardar).
  const removeReceipts = form.watch('removeReceipts');
  const details = PAYMENT_DETAILS[paymentMethod] ?? {};
  const currencyIsFixed = !!PAYMENT_METHOD_CURRENCY[paymentMethod];

  // Las tasas de la fecha del gasto, las mismas opciones que en la orden.
  const {
    rate: bcvRate,
    eurRate,
    usdtRate,
  } = useExchangeRate(token, expenseDate);
  const presetRates: Record<
    Exclude<ExpenseRateType, 'personalizada'>,
    number
  > = { dolar_bcv: bcvRate, euro_bcv: eurRate, usdt: usdtRate };

  // Las líneas se escriben en la moneda del gasto; en Bs, la tasa solo cambia
  // su equivalente en USD (lo muestra el editor de líneas).
  const applyRate = (rateValue: string) => {
    form.setValue('rate', rateValue, {
      shouldValidate: form.formState.isSubmitted,
    });
  };

  // Una tasa predefinida sigue a la fecha del gasto. En edición se conserva la
  // tasa con la que se registró hasta que el usuario elija otra.
  const [syncRate, setSyncRate] = useState(!isEditing);
  useEffect(() => {
    if (!syncRate || currency !== 'BS') return;
    if (!rateType || rateType === 'personalizada') return;
    const value = presetRates[rateType];
    if (value > 0) applyRate(String(value));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncRate, currency, rateType, bcvRate, eurRate, usdtRate]);

  /**
   * Al cambiar de moneda los montos de las líneas se convierten con la tasa
   * elegida (o la predefinida del día). Sin tasa se dejan como están.
   */
  const changeCurrency = (next: ExpenseCurrency) => {
    const values = form.getValues();
    if (values.currency === next) return;
    form.setValue('currency', next, {
      shouldValidate: form.formState.isSubmitted,
    });
    const preset =
      values.rateType && values.rateType !== 'personalizada'
        ? presetRates[values.rateType]
        : 0;
    const rateValue = Number(values.rate) > 0 ? Number(values.rate) : preset;
    if (!(rateValue > 0)) return;
    values.lines.forEach((line, index) => {
      const amount = Number(line.amount);
      if (!(amount > 0)) return;
      form.setValue(
        `lines.${index}.amount`,
        toMoney(next === 'BS' ? amount * rateValue : amount / rateValue)
      );
    });
  };

  const isCash = CASH_PAYMENT_METHODS.includes(paymentMethod);
  const isUsdCash = CASH_EXPENSE_PAYMENT_METHODS.includes(paymentMethod);
  const excludedFromCash = form.watch('excludedFromCash') ?? false;
  const reducesBranchCash = isUsdCash && !excludedFromCash;
  // Solo un administrador decide que un efectivo USD no salió de la caja.
  const canExcludeFromCash = isAdmin && isUsdCash;

  const onSubmit = async (values: ExpenseFormValues) => {
    const isBs = values.currency === 'BS';
    const shown = PAYMENT_DETAILS[values.paymentMethod] ?? {};
    // Solo los datos que ese medio muestra: al cambiar de medio no quedan
    // restos del anterior.
    const detail = (visible: boolean | undefined, value: string | undefined) =>
      visible ? (value ?? '').trim() : '';
    const common = {
      lines: values.lines.map((line) => ({
        category: Number(line.category),
        concept: line.concept?.trim() ?? '',
        lineType: line.lineType,
        amount: Number(line.amount),
        ivaExempt: line.lineType === 'cargo' ? !!line.ivaExempt : false,
      })),
      supplier: values.supplier ? Number(values.supplier) : null,
      invoiceNumber: values.invoiceNumber?.trim() ?? '',
      controlNumber: values.controlNumber?.trim() ?? '',
      // Siempre explícitos: 0 = sin IVA / sin retención. Sin proveedor no se
      // mandan las retenciones (el backend no retiene sin proveedor).
      ivaRate: values.applyIva ? Number(values.ivaRate) : 0,
      retentionIvaRate: values.supplier
        ? values.applyIva && values.retainIva
          ? Number(values.ivaRetentionRate)
          : 0
        : undefined,
      retentionIslrRate: values.supplier
        ? values.retainIslr
          ? Number(values.islrRate)
          : 0
        : undefined,
      concept: values.concept.trim(),
      beneficiary: values.beneficiary?.trim() ?? '',
      beneficiaryUser: values.beneficiaryUser
        ? Number(values.beneficiaryUser)
        : null,
      currency: values.currency,
      // En USD la tasa solo se guarda como registro: si no se envía, el
      // backend toma la del día.
      rate: isBs ? Number(values.rate) : undefined,
      rateType: isBs ? values.rateType : undefined,
      paymentMethod: values.paymentMethod,
      reference: values.reference?.trim() ?? '',
      phoneNumber: detail(shown.phone, values.phoneNumber),
      originBank: detail(shown.banks, values.originBank),
      targetBank: detail(shown.banks, values.targetBank),
      originAccount: detail(shown.accounts, values.originAccount),
      targetAccount: detail(shown.accounts, values.targetAccount),
      expenseDate: toApiDate(values.expenseDate),
      notes: values.notes ?? '',
      // Solo lo envía un administrador y solo en efectivo USD; si no, el
      // backend conserva el valor (y en otros medios lo pone en falso).
      excludedFromCash:
        isAdmin && CASH_EXPENSE_PAYMENT_METHODS.includes(values.paymentMethod)
          ? (values.excludedFromCash ?? false)
          : undefined,
    };

    try {
      const receipt = values.receipts.length
        ? { receipts: values.receipts }
        : {};
      if (isEditing && editExpense) {
        await updateMutation.mutateAsync({
          ...common,
          ...receipt,
          ...(values.removeReceipts.length
            ? { removeReceipts: values.removeReceipts }
            : {}),
        });
        if (approveAfterSave.current) {
          await approveMutation.mutateAsync(editExpense.id);
          toast({ title: 'Gasto guardado y aprobado' });
        } else {
          toast({ title: 'Gasto actualizado' });
        }
      } else {
        const created = await createMutation.mutateAsync({
          ...common,
          ...receipt,
          branch: Number(values.branch),
          asRequest,
        });
        toast({
          title:
            created.status === 'pending_approval'
              ? 'Pre-gasto registrado'
              : 'Gasto registrado',
          description:
            created.status === 'pending_approval'
              ? 'No cuenta en la caja ni en los reportes hasta que un admin lo apruebe.'
              : undefined,
        });
      }
      onSaved();
    } catch (error) {
      approveAfterSave.current = false;
      toast({
        title: 'No se pudo guardar el gasto',
        description: getExpenseErrorMessage(
          error,
          'Ocurrió un error al guardar el gasto.'
        ),
        variant: 'destructive',
      });
    }
  };

  const branchName =
    branches.find((branch) => String(branch.id) === form.watch('branch'))
      ?.name ??
    editExpense?.branch.name ??
    user?.branch?.name;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <SectionTitle>Datos generales</SectionTitle>

        {/* Solo quien registra en cualquier sucursal la ve. El resto registra
            en la suya (la activa), sin elegirla. */}
        {anyBranch ? (
          <FormField
            control={form.control}
            name="branch"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sucursal</FormLabel>
                {isEditing ? (
                  <Input value={branchName ?? ''} disabled readOnly />
                ) : (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona la sucursal" />
                      </SelectTrigger>
                    </FormControl>
                    <ModalSelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.name}
                        </SelectItem>
                      ))}
                    </ModalSelectContent>
                  </Select>
                )}
                <FormDescription>
                  Solo los administradores ven y eligen la sucursal; el resto
                  registra en la suya.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : (
          !initialBranch &&
          !isEditing && (
            <p className="text-sm text-destructive md:col-span-2">
              Tu usuario no tiene una sucursal asignada: no puedes registrar
              gastos.
            </p>
          )
        )}

        <FormField
          control={form.control}
          name="expenseDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fecha del gasto</FormLabel>
              <FormControl>
                {/* Mismo alto y borde que Input/SelectTrigger, para alinear
                    con Sucursal. */}
                <DatePicker
                  selected={field.value}
                  onChange={(date: Date) => field.onChange(date)}
                  maxDate={new Date()}
                  dateFormat="dd/MM/yyyy"
                  locale="es"
                  // El modal enfoca el primer campo al abrirse; sin esto el
                  // calendario se desplegaría solo cuando la Sucursal es fija.
                  preventOpenOnFocus
                  wrapperClassName="block w-full"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="concept"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Concepto general</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Nómina 2.ª quincena de septiembre"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="beneficiary"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Beneficiario (opcional)</FormLabel>
              <BeneficiarySelect
                value={{
                  userId: form.watch('beneficiaryUser') ?? '',
                  name: field.value ?? '',
                  supplierId: form.watch('supplier') ?? '',
                }}
                onChange={changeBeneficiary}
              />
              {supplierInfo ? (
                <FormDescription>
                  RIF {supplierInfo.rif} ·{' '}
                  {PERSON_TYPE_LABELS[supplierInfo.personType]} ·{' '}
                  {describeRetentionProfile(supplierInfo)}
                </FormDescription>
              ) : (
                <FormDescription>
                  Un proveedor (con sus retenciones), un usuario de Moto Candela
                  o un beneficiario guardado. Si escribes un nombre nuevo, queda
                  guardado para próximos gastos.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {supplierInfo && (
          <>
            <FormField
              control={form.control}
              name="invoiceNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de factura</FormLabel>
                  <FormControl>
                    <Input placeholder="00012345" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="controlNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>N° de control</FormLabel>
                  <FormControl>
                    <Input placeholder="00-0012345" {...field} />
                  </FormControl>
                  <FormDescription>
                    Factura y control son obligatorios si hay retención.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Tipo de pago, moneda y tasa van ANTES del detalle: las líneas se
            escriben en la moneda del pago, así que hay que elegirla primero.
            Antes estaban debajo y todo se escribía en dólares sin querer. */}
        <SectionTitle>Forma de pago</SectionTitle>

        <FormField
          control={form.control}
          name="paymentMethod"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de pago</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) => {
                  const method = value as ExpensePaymentMethod;
                  field.onChange(method);
                  const fixed = PAYMENT_METHOD_CURRENCY[method];
                  if (fixed) changeCurrency(fixed);
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el tipo de pago" />
                  </SelectTrigger>
                </FormControl>
                <ModalSelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(
                    ([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    )
                  )}
                </ModalSelectContent>
              </Select>
              <FormDescription>
                {reducesBranchCash
                  ? 'Descuenta del efectivo de la sucursal.'
                  : isUsdCash
                    ? 'Marcado para no descontar la caja de la sucursal.'
                    : isCash
                      ? 'Efectivo en Bs: se registra, pero no descuenta el efectivo de la sucursal.'
                      : 'No afecta el efectivo de la sucursal.'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Moneda</FormLabel>
              <Select
                value={field.value}
                onValueChange={(value) =>
                  changeCurrency(value as ExpenseCurrency)
                }
                disabled={currencyIsFixed}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <ModalSelectContent>
                  <SelectItem value="USD">Dólares (USD)</SelectItem>
                  <SelectItem value="BS">Bolívares (BS)</SelectItem>
                </ModalSelectContent>
              </Select>
              {!currencyIsFixed && (
                <FormDescription>
                  La transferencia puede ser en dólares o en bolívares.
                </FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {currency === 'BS' && (
          <FormField
            control={form.control}
            name="rate"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Tasa cambiaria (Bs.)</FormLabel>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <Select
                    value={rateType}
                    onValueChange={(value) => {
                      const next = value as ExpenseRateType;
                      form.setValue('rateType', next);
                      setSyncRate(true);
                      if (next === 'personalizada') return;
                      if (presetRates[next] > 0) {
                        applyRate(String(presetRates[next]));
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un tipo de tasa" />
                    </SelectTrigger>
                    <ModalSelectContent>
                      {(['dolar_bcv', 'euro_bcv', 'usdt'] as const).map(
                        (type) => (
                          <SelectItem key={type} value={type}>
                            {RATE_TYPE_LABELS[type]} -{' '}
                            {presetRates[type] > 0
                              ? presetRates[type].toFixed(2)
                              : 'sin tasa'}
                          </SelectItem>
                        )
                      )}
                      <SelectItem value="personalizada">
                        {RATE_TYPE_LABELS.personalizada}
                      </SelectItem>
                    </ModalSelectContent>
                  </Select>
                  {rateType === 'personalizada' && (
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="0.0001"
                        min="0"
                        placeholder="Ingresa la tasa"
                        {...field}
                        onChange={(event) => applyRate(event.target.value)}
                      />
                    </FormControl>
                  )}
                </div>
                <FormDescription>
                  Tasa de la fecha del gasto con la que se convierte a dólares.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <SectionTitle>Detalle del gasto</SectionTitle>
        <div className="md:col-span-2 space-y-2">
          <p className="text-sm text-muted-foreground">
            Los montos van en{' '}
            <strong>{currency === 'BS' ? 'bolívares' : 'dólares'}</strong>
            {currency === 'BS' ? ', a la tasa elegida arriba' : ''}. Para
            registrarlos en otra moneda, cambia el tipo de pago.
          </p>
          <ExpenseLinesEditor
            currency={currency}
            rate={form.watch('rate')}
            taxControls={
              <ExpenseTaxControls
                currency={currency}
                supplierName={supplierInfo?.name}
              />
            }
          />
        </div>

        <SectionTitle>Datos del pago</SectionTitle>

        {canExcludeFromCash && (
          <FormField
            control={form.control}
            name="excludedFromCash"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-amber-300 bg-amber-50 p-3 md:col-span-2">
                <FormControl>
                  <Checkbox
                    checked={field.value ?? false}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>No descontar de la caja de la sucursal</FormLabel>
                  <FormDescription>
                    Para un gasto en efectivo que no salió de la caja de esta
                    sucursal (por ejemplo, lo pagó la oficina). Sigue contando
                    como gasto en los reportes. Solo admin.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="reference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Referencia{isCash ? ' (opcional)' : ''}</FormLabel>
              <FormControl>
                <Input placeholder="Nro. de transferencia" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {details.phone && (
          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número de teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="0414-1234567" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {details.banks && (
          <>
            <BankField name="originBank" label="Banco de origen" />
            <BankField name="targetBank" label="Banco de destino (opcional)" />
          </>
        )}

        {details.accounts && (
          <>
            <FormField
              control={form.control}
              name="originAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta de origen</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de cuenta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAccount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuenta de destino (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de cuenta destino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="receipts"
          render={({ field, fieldState }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Comprobantes (opcional, hasta 5)</FormLabel>
              <ReceiptsUpload
                value={field.value}
                onChange={field.onChange}
                invalid={!!fieldState.error}
                existing={(editExpense?.receipts ?? []).filter(
                  (receipt) => !removeReceipts.includes(receipt.id)
                )}
                onRemoveExisting={(id) =>
                  form.setValue('removeReceipts', [...removeReceipts, id], {
                    shouldDirty: true,
                  })
                }
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Observaciones (opcional)</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-wrap gap-3 md:col-span-2">
          <Button
            type="submit"
            disabled={isSaving}
            onClick={() => {
              approveAfterSave.current = false;
            }}
          >
            {isSaving
              ? 'Guardando...'
              : isEditing
                ? 'Guardar cambios'
                : asRequest || !isAdmin
                  ? 'Registrar pre-gasto'
                  : 'Registrar gasto'}
          </Button>
          {isAdmin && isPendingEdit && (
            <Button
              type="submit"
              variant="secondary"
              disabled={isSaving}
              onClick={() => {
                approveAfterSave.current = true;
              }}
            >
              Guardar y aprobar
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSaving}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </Form>
  );
}
