'use client';

import { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Badge } from '@/components/ui/badge.component';
import { Button } from '@/components/ui/button.component';
import { ActivityTimeline } from '@/components/activity/activityTimeline.component';
import { useToast } from '@/components/ui/use-toast';
import {
  useApproveExpense,
  useCancelExpense,
  useExpense,
  useRejectExpense,
} from '@/hooks/expenses';
import { cn, usdFormatCurrency } from '@/lib/utils';
import { Expense } from '@/services/expenses/types/Expense.type';
import {
  useIsStaff,
  useRoles,
  useSuperuser,
  useUser,
} from '@/stores/auth/auth.store';
import { ReasonDialog } from './reasonDialog.component';
import {
  DEDUCTION_LINE_TYPES,
  PAYMENT_METHOD_LABELS,
  RATE_TYPE_LABELS,
  computedLineLabel,
  STATUS_BADGE_CLASSES,
  STATUS_LABELS,
  canApproveExpenses,
  canCancelExpenses,
  canEditExpense,
  getExpenseErrorMessage,
  formatExpenseAmount,
  formatExpenseDate,
  userDisplayName,
  formatExpenseDateTime,
} from './expense.utils';

interface ExpenseDetailModalProps {
  expenseId: number | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Abre la edición (en `ExpenseFormModal`). Sin este callback el botón
   * Editar no se muestra; quien lo pasa cierra este modal antes.
   */
  onEdit?: (expense: Expense) => void;
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 py-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="col-span-2 break-words">{children}</span>
    </div>
  );
}

/**
 * Las líneas del gasto con su resumen. Con IVA o retenciones (Fase 3) el pie
 * va de la factura al neto: total factura, lo retenido y lo pagado.
 */
function LinesTable({ expense }: { expense: Expense }) {
  const isBs = expense.currency === 'BS';
  const invoice = expense.invoice;
  const deductions = invoice?.otherDeductions ?? 0;
  const hasTaxes = !!invoice && (invoice.iva > 0 || invoice.retainedTotal > 0);
  const money = (amount: number) =>
    formatExpenseAmount(amount, expense.currency);
  return (
    <div>
      <h4 className="mb-2 text-sm font-semibold">Detalle</h4>
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left font-medium">Categoría</th>
              <th className="px-3 py-2 text-left font-medium">Concepto</th>
              <th className="px-3 py-2 text-right font-medium">Monto</th>
              {isBs && (
                <th className="px-3 py-2 text-right font-medium">USD</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y">
            {expense.lines.map((line) => {
              const isDeduction = DEDUCTION_LINE_TYPES.includes(line.lineType);
              const isComputed =
                line.lineType !== 'cargo' && line.lineType !== 'descuento';
              const sign = isDeduction ? '−' : '';
              return (
                <tr
                  key={line.id}
                  className={cn(isDeduction && 'text-amber-800')}
                >
                  <td className="px-3 py-2">
                    {line.category.name}
                    <span className="block text-xs text-muted-foreground">
                      {isComputed
                        ? `${computedLineLabel(line)}${
                            line.baseAmount !== null
                              ? ` de ${money(line.baseAmount)}`
                              : ''
                          }`
                        : isDeduction
                          ? 'Descuento'
                          : `${line.category.accountCode}${
                              line.ivaExempt ? ' · exento de IVA' : ''
                            }`}
                    </span>
                  </td>
                  <td className="px-3 py-2">{line.concept || '-'}</td>
                  <td className="px-3 py-2 text-right">
                    {sign}
                    {formatExpenseAmount(line.amount, expense.currency)}
                  </td>
                  {isBs && (
                    <td className="px-3 py-2 text-right text-muted-foreground">
                      {sign}
                      {usdFormatCurrency(line.amountUsd)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t bg-muted/30 font-semibold">
            {hasTaxes && invoice && (
              <>
                <tr className="font-normal text-muted-foreground">
                  <td className="px-3 py-1" colSpan={2}>
                    Base imponible + IVA = total factura
                  </td>
                  <td className="px-3 py-1 text-right">
                    {money(invoice.base)} + {money(invoice.iva)} ={' '}
                    {money(invoice.total)}
                  </td>
                  {isBs && <td />}
                </tr>
                {invoice.retainedTotal > 0 && (
                  <tr className="font-normal text-amber-800">
                    <td className="px-3 py-1" colSpan={2}>
                      Retenido (se paga al SENIAT)
                    </td>
                    <td className="px-3 py-1 text-right">
                      −{money(invoice.retainedTotal)}
                    </td>
                    {isBs && <td />}
                  </tr>
                )}
              </>
            )}
            {deductions > 0 && (
              <tr className="font-normal text-muted-foreground">
                <td className="px-3 py-1" colSpan={2}>
                  {hasTaxes ? 'Otros descuentos' : 'Cargos − descuentos'}
                </td>
                <td className="px-3 py-1 text-right">
                  {hasTaxes
                    ? `−${money(deductions)}`
                    : `${money(invoice?.base ?? 0)} − ${money(deductions)}`}
                </td>
                {isBs && <td />}
              </tr>
            )}
            <tr>
              <td className="px-3 py-2" colSpan={2}>
                Total pagado
              </td>
              <td className="px-3 py-2 text-right">
                {formatExpenseAmount(expense.amount, expense.currency)}
              </td>
              {isBs && (
                <td className="px-3 py-2 text-right">
                  {usdFormatCurrency(expense.amountUsd)}
                </td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/**
 * Ficha de un gasto con sus líneas y sus comprobantes. Se pide al abrir (las
 * URLs de los comprobantes vencen a los 5 minutos). Desde aquí, según estado
 * y rol: aprobar / rechazar (admin) un pendiente; editar o anular uno
 * registrado. Los botones van al final de la ficha, después del historial.
 */
export function ExpenseDetailModal({
  expenseId,
  open,
  onOpenChange,
  onEdit,
}: ExpenseDetailModalProps) {
  const { expense, isLoading, isError } = useExpense(expenseId, open);
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const user = useUser();
  const { toast } = useToast();
  // Anular y rechazar piden motivo en `ReasonDialog`, un Dialog de la MISMA
  // copia de Radix que este modal, así que anidarlo funciona. Aprobar es de
  // un clic, sin confirmación: no usar `ConfirmDialog` aquí --
  // es un AlertDialog de otra copia de Radix y, anidado, el modal tomaba el
  // clic en confirmar como un clic afuera, se cerraba, y la acción corría
  // sobre un gasto ya descargado (pantalla pegada con error).
  const [dialog, setDialog] = useState<'cancel' | 'reject' | null>(null);
  const approveMutation = useApproveExpense();
  const rejectMutation = useRejectExpense();
  const cancelMutation = useCancelExpense();

  const isAdmin = canApproveExpenses(roles, isSuperuser, isStaff);
  const isPending = expense?.status === 'pending_approval';
  const isRegistered = expense?.status === 'registered';
  const canCancel =
    isRegistered && canCancelExpenses(roles, isSuperuser, isStaff);
  const canEdit =
    !!onEdit && !!expense && canEditExpense(expense, user?.id, isAdmin);
  const canDecide = isPending && isAdmin;

  /**
   * Corre una acción que cambia el estado del gasto. Si sale bien, avisa y
   * CIERRA el modal: el gasto ya no pertenece a esta lista (un pendiente
   * aprobado pasa a Gastos, uno rechazado deja de contar). Si
   * falla, avisa y relanza para que quien llama (un diálogo de motivo) quede
   * abierto y se pueda reintentar.
   */
  const decide = async (
    action: () => Promise<unknown>,
    done: { title: string; description?: string }
  ) => {
    try {
      await action();
      toast(done);
      onOpenChange(false);
    } catch (error) {
      toast({
        title: 'No se pudo completar la acción',
        description: getExpenseErrorMessage(error, 'Inténtalo de nuevo.'),
        variant: 'destructive',
      });
      throw error;
    }
  };

  // El id se toma al hacer clic: la lista de atrás se refresca mientras la
  // petición corre y `expense` puede quedar sin cargar.
  const approve = () => {
    if (!expense) return;
    const { id, displayCode, amount, currency } = expense;
    decide(() => approveMutation.mutateAsync(id), {
      title: `Gasto ${displayCode} aprobado`,
      description: `${formatExpenseAmount(amount, currency)} ya cuentan en Gastos${
        expense.paymentMethod === 'efectivo_usd' && !expense.excludedFromCash
          ? ' y se descontaron de la caja'
          : ''
      }.`,
    }).catch(() => undefined);
  };
  const isBusy =
    approveMutation.isLoading ||
    rejectMutation.isLoading ||
    cancelMutation.isLoading;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Gasto {expense?.displayCode ?? `#${expenseId}`}
              {expense && (
                <Badge
                  variant="outline"
                  className={cn('ml-2', STATUS_BADGE_CLASSES[expense.status])}
                >
                  {STATUS_LABELS[expense.status]}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {isLoading && <p className="text-sm">Cargando...</p>}
          {isError && (
            <p className="text-sm text-destructive">
              No se pudo cargar el gasto.
            </p>
          )}

          {expense && (
            <div className="space-y-4">
              {isPending && (
                <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  Pre-gasto: no cuenta en la caja ni en los reportes hasta que
                  un admin lo apruebe.
                </p>
              )}
              <div className="divide-y">
                <Row label="Sucursal">{expense.branch.name}</Row>
                <Row label="Fecha">
                  {formatExpenseDate(expense.expenseDate)}
                </Row>
                <Row label="Concepto">{expense.concept}</Row>
                {expense.supplier && (
                  <Row label="Proveedor">
                    {expense.supplier.name}
                    <span className="block text-xs text-muted-foreground">
                      RIF {expense.supplier.rif}
                    </span>
                  </Row>
                )}
                {(expense.invoiceNumber || expense.controlNumber) && (
                  <Row label="Factura">
                    {expense.invoiceNumber || '-'}
                    {expense.controlNumber && (
                      <span className="block text-xs text-muted-foreground">
                        Control {expense.controlNumber}
                      </span>
                    )}
                  </Row>
                )}
                {expense.beneficiary && (
                  <Row label="Beneficiario">{expense.beneficiary}</Row>
                )}
                <Row label="Total pagado">
                  {formatExpenseAmount(expense.amount, expense.currency)}
                  {expense.currency === 'BS' && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      = {usdFormatCurrency(expense.amountUsd)} a {expense.rate}{' '}
                      Bs/USD
                      {expense.rateType &&
                        ` (${RATE_TYPE_LABELS[expense.rateType]})`}
                    </span>
                  )}
                </Row>
                <Row label="Tipo de pago">
                  {PAYMENT_METHOD_LABELS[expense.paymentMethod]}
                </Row>
                {expense.reference && (
                  <Row label="Referencia">{expense.reference}</Row>
                )}
                {expense.phoneNumber && (
                  <Row label="Teléfono">{expense.phoneNumber}</Row>
                )}
                {(expense.originBank || expense.targetBank) && (
                  <Row label="Banco">
                    {expense.originBank || '-'}
                    {expense.targetBank && ` → ${expense.targetBank}`}
                  </Row>
                )}
                {(expense.originAccount || expense.targetAccount) && (
                  <Row label="Cuenta">
                    {expense.originAccount || '-'}
                    {expense.targetAccount && ` → ${expense.targetAccount}`}
                  </Row>
                )}
                {expense.notes && (
                  <Row label="Observaciones">{expense.notes}</Row>
                )}
                {expense.excludedFromCash && (
                  <Row label="Caja">
                    <span className="text-amber-700">
                      No descuenta la caja de la sucursal (decisión de un
                      administrador).
                    </span>
                  </Row>
                )}
                <Row label="Registrado por">
                  {userDisplayName(expense.createdBy)}
                </Row>
                {/* Cuándo se cargó el registro, distinto de la fecha del gasto. */}
                <Row label="Fecha de registro">
                  {formatExpenseDateTime(expense.createdAt)}
                </Row>
                {new Date(expense.lastUpdated).getTime() -
                  new Date(expense.createdAt).getTime() >
                  60_000 && (
                  <Row label="Última modificación">
                    {formatExpenseDateTime(expense.lastUpdated)}
                  </Row>
                )}
                {expense.approvedBy && isRegistered && (
                  <Row label="Aprobado por">
                    {userDisplayName(expense.approvedBy)}
                    {expense.approvedAt &&
                      ` · ${formatExpenseDateTime(expense.approvedAt)}`}
                  </Row>
                )}
                {expense.status === 'rejected' && (
                  <Row label="Rechazado por">
                    {userDisplayName(expense.rejectedBy)}
                    {expense.rejectedAt &&
                      ` · ${formatExpenseDateTime(expense.rejectedAt)}`}
                    <span className="block text-muted-foreground">
                      Motivo: {expense.rejectionReason}
                    </span>
                  </Row>
                )}
                {expense.status === 'cancelled' && (
                  <Row label="Anulado por">
                    {userDisplayName(expense.cancelledBy)}
                    {expense.cancelledAt &&
                      ` · ${formatExpenseDateTime(expense.cancelledAt)}`}
                    <span className="block text-muted-foreground">
                      Motivo: {expense.cancelReason}
                    </span>
                  </Row>
                )}
              </div>

              <LinesTable expense={expense} />

              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  {expense.receipts.length > 1
                    ? `Comprobantes (${expense.receipts.length})`
                    : 'Comprobante'}
                </h4>
                {expense.receipts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Sin comprobante.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {expense.receipts.map((receipt, index) =>
                      !receipt.url ? (
                        <p
                          key={receipt.id}
                          className="text-sm text-muted-foreground"
                        >
                          Comprobante {index + 1} no disponible.
                        </p>
                      ) : receipt.mime === 'application/pdf' ? (
                        <a
                          key={receipt.id}
                          href={receipt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex h-32 w-32 flex-col items-center justify-center gap-2 rounded border text-sm text-primary hover:bg-muted/40"
                        >
                          <FileText className="h-8 w-8" />
                          <span className="inline-flex items-center gap-1 underline">
                            Abrir PDF <ExternalLink className="h-3 w-3" />
                          </span>
                        </a>
                      ) : (
                        <a
                          key={receipt.id}
                          href={receipt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Abrir en una pestaña nueva"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={receipt.url}
                            alt={`Comprobante ${index + 1} del gasto`}
                            className={
                              expense.receipts.length === 1
                                ? 'max-h-96 rounded border object-contain'
                                : 'h-32 w-32 rounded border object-cover'
                            }
                          />
                        </a>
                      )
                    )}
                  </div>
                )}
              </div>

              {/* Quién hizo cada paso (solicitó, aprobó, editó…); solo super admin */}
              <ActivityTimeline
                targetModel="expense"
                targetId={expense.id}
                variant="collapsible"
              />
            </div>
          )}

          {expense && (canEdit || canCancel || canDecide) && (
            // Al final de la ficha, después del historial: no fijo encima
            // del contenido.
            <DialogFooter className="mt-2 flex-wrap gap-2 border-t pt-4">
              {canEdit && (
                <Button
                  variant="outline"
                  onClick={() => onEdit(expense)}
                  disabled={isBusy}
                >
                  Editar
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={() => setDialog('cancel')}
                  disabled={isBusy}
                >
                  Anular
                </Button>
              )}
              {canDecide && (
                <>
                  <Button
                    variant="destructive"
                    onClick={() => setDialog('reject')}
                    disabled={isBusy}
                  >
                    Rechazar
                  </Button>
                  <Button onClick={approve} disabled={isBusy}>
                    {approveMutation.isLoading ? 'Aprobando...' : 'Aprobar'}
                  </Button>
                </>
              )}
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <ReasonDialog
        open={dialog === 'cancel'}
        onOpenChange={(next) => !next && setDialog(null)}
        title="Anular gasto"
        description="La anulación es definitiva. El gasto deja de contar en el efectivo y en los reportes, pero queda registrado con el motivo."
        confirmLabel="Anular gasto"
        busyLabel="Anulando..."
        placeholder="Motivo de la anulación"
        onConfirm={(reason) =>
          decide(
            () => cancelMutation.mutateAsync({ id: expense!.id, reason }),
            { title: `Gasto ${expense?.displayCode ?? ''} anulado` }
          )
        }
      />

      <ReasonDialog
        open={dialog === 'reject'}
        onOpenChange={(next) => !next && setDialog(null)}
        title="Rechazar gasto"
        description="El rechazo es definitivo: el gasto no contará nunca. Quien lo registró verá el motivo y puede registrar uno nuevo."
        confirmLabel="Rechazar gasto"
        busyLabel="Rechazando..."
        placeholder="Motivo del rechazo"
        onConfirm={(reason) =>
          decide(
            () => rejectMutation.mutateAsync({ id: expense!.id, reason }),
            {
              title: `Gasto ${expense?.displayCode ?? ''} rechazado`,
              description: 'Quien lo registró verá el motivo en Pre Gastos.',
            }
          )
        }
      />
    </>
  );
}
