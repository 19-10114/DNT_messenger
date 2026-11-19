'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowLeftRight,
  Ban,
  ExternalLink,
  FileText,
  MapPin,
  Paperclip,
  Pencil,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';

import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { Button } from '@/components/ui/button.component';
import { ConfirmDialog } from '@/components/ui/confirmDialog.component';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';
import { useToast } from '@/components/ui/use-toast';
import { APPROVALS, APPROVAL_EDIT } from '@/constants/routes';
import {
  useApproval,
  useCloseApproval,
  useReopenApproval,
  useUploadApprovalDocument,
} from '@/hooks/approvals';
import { cn } from '@/lib/utils';
import { ApprovalReceipt } from '@/services/approvals/types';
import { useRoles, useSuperuser } from '@/stores/auth/auth.store';
import { ApprovalModelRows } from './approvalModelRows.component';
import { ApprovalMoveDialog } from './approvalMoveDialog.component';
import { ApprovalProgress } from './approvalProgress.component';
import { ApprovalStatusBadge } from './approvalStatusBadge.component';
import {
  APPROVAL_REOPEN_ROLES,
  formatApprovalDate,
  formatApprovalDateTime,
  formatApprovalProduct,
  getApprovalErrorMessage,
  getApprovalErrorStatus,
} from './approvals.utils';

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-2">
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-lg font-semibold tabular-nums text-gray-900">
        {value}
      </dd>
    </div>
  );
}

/**
 * Detalle de una aprobación de Empire: avance, modelos, motos recibidas (de
 * cualquier sucursal), documento y acciones (editar, cerrar, reabrir).
 *
 * Las motos no se marcan acá: cuentan solas al registrarse la compra con el
 * número de aprobación, y anular la compra las descuenta.
 */
export function ApprovalDetail({ approvalId }: { approvalId: number }) {
  const { toast } = useToast();
  const roles = useRoles();
  const isSuperuser = useSuperuser();
  const canReopen =
    isSuperuser === true ||
    APPROVAL_REOPEN_ROLES.some((role) => roles.includes(role));

  const {
    approval,
    isLoadingApproval,
    isFetchingApproval,
    isErrorApproval,
    approvalError,
    refetchApproval,
  } = useApproval(approvalId);
  const { closeApproval, isClosingApproval } = useCloseApproval();
  const { reopenApproval, isReopeningApproval } = useReopenApproval();
  const { uploadApprovalDocument, isUploadingApprovalDocument } =
    useUploadApprovalDocument();

  const [isCloseOpen, setIsCloseOpen] = useState(false);
  const [closeReason, setCloseReason] = useState('');
  const [isReopenOpen, setIsReopenOpen] = useState(false);
  const [isMoveOpen, setIsMoveOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const receiptColumns: GenericTableColumn<ApprovalReceipt>[] = useMemo(
    () => [
      {
        key: 'plate',
        header: 'Placa',
        className: 'whitespace-nowrap font-semibold text-gray-900',
        render: (receipt) => (
          <span className="flex items-center gap-1.5">
            <span className={cn(receipt.undoneAt && 'line-through')}>
              {receipt.plate || 'Sin placa'}
            </span>
            {receipt.undoneAt && (
              <span
                className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[11px] font-medium text-gray-600"
                title={`Anulada el ${formatApprovalDateTime(receipt.undoneAt)}: se anuló la compra y no cuenta.`}
              >
                Anulada
              </span>
            )}
          </span>
        ),
      },
      {
        key: 'product',
        header: 'Modelo',
        className: 'whitespace-nowrap',
        render: (receipt) => formatApprovalProduct(receipt.product),
      },
      { key: 'color', header: 'Color' },
      {
        key: 'chassisSerial',
        header: 'Chasis',
        className: 'font-mono text-xs',
      },
      { key: 'motorSerial', header: 'Motor', className: 'font-mono text-xs' },
      {
        key: 'branch',
        header: 'Recibida en',
        className: 'whitespace-nowrap',
        render: (receipt) => receipt.branch?.name || '-',
      },
      {
        key: 'receivedAt',
        header: 'Fecha',
        className: 'whitespace-nowrap tabular-nums',
        render: (receipt) => formatApprovalDateTime(receipt.receivedAt) || '-',
      },
      {
        key: 'receivedBy',
        header: 'Registrada por',
        render: (receipt) => receipt.receivedBy?.name || '-',
      },
    ],
    []
  );

  if (isLoadingApproval) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-40 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-100" />
      </div>
    );
  }

  if (isErrorApproval || !approval) {
    const isNotFound =
      getApprovalErrorStatus(approvalError) === 404 || !approvalError;
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        <p>
          {isNotFound
            ? 'No se encontró esta aprobación.'
            : 'No se pudo cargar la aprobación.'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={APPROVALS}>Volver a aprobaciones</Link>
          </Button>
          {!isNotFound && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchApproval()}
            >
              Reintentar
            </Button>
          )}
        </div>
      </div>
    );
  }

  const isOpen =
    approval.status === 'pending' || approval.status === 'in_progress';
  const isClosed = approval.status === 'closed';
  const receipts = approval.receipts ?? [];
  const activeReceipts = receipts.filter((receipt) => !receipt.undoneAt);
  const percentage = Math.round((approval.progress || 0) * 100);

  const handleClose = async () => {
    try {
      await closeApproval({ id: approval.id, reason: closeReason.trim() });
      setIsCloseOpen(false);
      setCloseReason('');
      toast({ title: `Aprobación ${approval.number} cerrada` });
    } catch (error) {
      toast({
        title: 'No se pudo cerrar la aprobación',
        description: getApprovalErrorMessage(error, 'Intente de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  const handleReopen = async () => {
    try {
      await reopenApproval(approval.id);
      setIsReopenOpen(false);
      toast({ title: `Aprobación ${approval.number} reabierta` });
    } catch (error) {
      toast({
        title: 'No se pudo reabrir la aprobación',
        description: getApprovalErrorMessage(error, 'Intente de nuevo.'),
        variant: 'destructive',
      });
    }
  };

  const handleUpload = async (file: File | undefined) => {
    if (!file) return;
    try {
      await uploadApprovalDocument({ id: approval.id, file });
      toast({ title: 'Documento guardado' });
    } catch (error) {
      toast({
        title: 'No se pudo subir el documento',
        description: getApprovalErrorMessage(
          error,
          'Use un PDF o una foto de hasta 20 MB.'
        ),
        variant: 'destructive',
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={APPROVALS}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a aprobaciones
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchApproval()}
          disabled={isFetchingApproval}
        >
          <RefreshCw
            className={cn('mr-2 h-4 w-4', isFetchingApproval && 'animate-spin')}
          />
          Actualizar
        </Button>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="font-mono text-2xl font-semibold tracking-tight text-gray-900">
                {approval.number}
              </h2>
              <ApprovalStatusBadge status={approval.status} />
            </div>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
              <span>
                Aprobada el {formatApprovalDate(approval.approvalDate)}
              </span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-4 w-4" aria-hidden />
                Pedida por {approval.branch?.name || 'sin sucursal'}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isClosed && (
              <Button variant="outline" size="sm" asChild>
                <Link href={APPROVAL_EDIT(approval.id)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Editar
                </Link>
              </Button>
            )}
            {isOpen && approval.remainingQuantity > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMoveOpen(true)}
                title="Empire entregó en otra sucursal"
              >
                <ArrowLeftRight className="mr-2 h-4 w-4" />
                Mover motos
              </Button>
            )}
            {isOpen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseOpen(true)}
              >
                <Ban className="mr-2 h-4 w-4" />
                Cerrar aprobación
              </Button>
            )}
            {isClosed && canReopen && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsReopenOpen(true)}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reabrir
              </Button>
            )}
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-1.5 flex items-baseline justify-between text-sm">
            <span className="font-medium text-gray-700">
              {approval.receivedQuantity} de {approval.requestedQuantity} motos
              recibidas
            </span>
            <span className="tabular-nums text-gray-500">{percentage}%</span>
          </div>
          <ApprovalProgress
            received={approval.receivedQuantity}
            requested={approval.requestedQuantity}
            status={approval.status}
            size="lg"
          />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Aprobadas" value={approval.requestedQuantity} />
          <Stat label="Recibidas" value={approval.receivedQuantity} />
          <Stat label="Faltan" value={approval.remainingQuantity} />
          <Stat label="Modelos" value={approval.lines.length} />
        </dl>

        <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="mb-1 text-xs text-gray-500">Documento de Empire</dt>
            <dd className="flex flex-wrap items-center gap-2">
              {approval.hasDocument && approval.documentUrl ? (
                <a
                  href={approval.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  <FileText className="h-4 w-4" />
                  {approval.documentName}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : approval.hasDocument ? (
                <span className="text-gray-700">{approval.documentName}</span>
              ) : (
                <span className="text-gray-400">Sin documento</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={(e) => handleUpload(e.target.files?.[0])}
              />
              <Button
                variant="ghost"
                size="sm"
                disabled={isUploadingApprovalDocument}
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="mr-1 h-4 w-4" />
                {isUploadingApprovalDocument
                  ? 'Subiendo...'
                  : approval.hasDocument
                    ? 'Reemplazar'
                    : 'Subir'}
              </Button>
            </dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-gray-500">Registrada por</dt>
            <dd className="text-gray-900">
              {approval.createdBy?.name || '-'}{' '}
              <span className="text-gray-500">
                · {formatApprovalDateTime(approval.createdAt)}
              </span>
            </dd>
          </div>
          {approval.completedAt && (
            <div>
              <dt className="mb-1 text-xs text-gray-500">Completada</dt>
              <dd className="tabular-nums text-gray-900">
                {formatApprovalDateTime(approval.completedAt)}
              </dd>
            </div>
          )}
          <div className="sm:col-span-2">
            <dt className="mb-1 text-xs text-gray-500">Observaciones</dt>
            <dd className="whitespace-pre-line text-gray-900">
              {approval.notes || (
                <span className="text-gray-400">Sin observaciones</span>
              )}
            </dd>
          </div>
        </dl>

        {isClosed && (
          <div className="mt-5 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
            <Ban
              className="mt-0.5 h-4 w-4 shrink-0 text-gray-500"
              aria-hidden
            />
            <div>
              <p className="font-medium">
                Cerrada por {approval.closedBy?.name || 'alguien'}
                {approval.closedAt &&
                  ` el ${formatApprovalDateTime(approval.closedAt)}`}
                .
              </p>
              <p className="mt-0.5 text-gray-600">
                Motivo: {approval.closeReason || 'sin motivo'}. Las motos
                recibidas siguen contadas; lo que faltaba ya no se espera ni se
                puede registrar con este número.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Modelos aprobados</h3>
          <p className="text-xs text-gray-500">
            Por sucursal: recibidas / aprobadas. Si Empire entrega en otra
            sucursal, use &quot;Mover motos&quot;.
          </p>
        </header>
        <div className="px-4">
          <ApprovalModelRows lines={approval.lines} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="font-semibold text-gray-900">Motos recibidas</h3>
            <span className="text-xs text-gray-500">
              {activeReceipts.length}{' '}
              {activeReceipts.length === 1 ? 'moto' : 'motos'}
              {receipts.length > activeReceipts.length &&
                ` · ${receipts.length - activeReceipts.length} anuladas`}
            </span>
          </div>
          {(approval.receivedByBranch?.length ?? 0) > 0 && (
            <div className="flex flex-wrap gap-2">
              {approval.receivedByBranch?.map((entry) => (
                <span
                  key={entry.branch.id}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-700"
                >
                  {entry.branch.name}:{' '}
                  <strong className="tabular-nums">
                    {entry.receivedQuantity}
                  </strong>
                </span>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500">
            Cuentan solas al registrar la compra con este número. Anular la
            compra la descuenta.
          </p>
        </header>
        <div className="p-4">
          <GenericTable<ApprovalReceipt>
            columns={receiptColumns}
            data={receipts}
            getRowKey={(receipt) => receipt.id}
            density="compact"
            emptyMessage="Todavía no llegó ninguna moto de esta aprobación."
          />
        </div>
      </section>

      <Dialog
        open={isCloseOpen}
        onOpenChange={(open) => !open && setIsCloseOpen(false)}
      >
        <DialogContent width="460px">
          <DialogHeader>
            <DialogTitle>Cerrar aprobación {approval.number}</DialogTitle>
            <DialogDescription>
              Úselo cuando Empire no enviará lo que falta. Las{' '}
              {approval.receivedQuantity} motos recibidas siguen contadas; las{' '}
              {approval.remainingQuantity} que faltan dejan de figurar como
              pendientes y ya no se podrán registrar con este número.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <Label htmlFor="closeReason">Motivo</Label>
            <Textarea
              id="closeReason"
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              rows={3}
              placeholder="Ej.: Empire canceló el resto del pedido"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCloseOpen(false)}>
              Cancelar
            </Button>
            <Button
              disabled={!closeReason.trim() || isClosingApproval}
              onClick={handleClose}
            >
              {isClosingApproval ? 'Cerrando...' : 'Cerrar aprobación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ApprovalMoveDialog
        approval={approval}
        open={isMoveOpen}
        onOpenChange={setIsMoveOpen}
      />

      <ConfirmDialog
        open={isReopenOpen}
        title={`Reabrir aprobación ${approval.number}`}
        description="Lo que falta vuelve a figurar como pendiente y se pueden registrar motos con este número otra vez."
        confirmLabel="Reabrir"
        isLoading={isReopeningApproval}
        onConfirm={handleReopen}
        onOpenChange={(open) => !open && setIsReopenOpen(false)}
      />
    </div>
  );
}
