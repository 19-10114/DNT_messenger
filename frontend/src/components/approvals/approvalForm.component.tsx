'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { ArrowLeft, FileText, Paperclip, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Label } from '@/components/ui/label.component';
import { Textarea } from '@/components/ui/textarea.component';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { useToast } from '@/components/ui/use-toast';
import { APPROVALS, APPROVAL_DETAIL } from '@/constants/routes';
import {
  useCreateApproval,
  useUpdateApproval,
  useUploadApprovalDocument,
} from '@/hooks/approvals';
import { useAllBranches } from '@/hooks/useAllBranches';
import { ProductsService } from '@/services/products/products.service';
import {
  Approval,
  ApprovalBranch,
  ApprovalProduct,
} from '@/services/approvals/types';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import {
  ApprovalSplitEditor,
  BranchSplit,
  splitTotal,
} from './approvalSplitEditor.component';
import {
  formatApprovalProduct,
  getApprovalErrorMessage,
  normalizeApprovalNumber,
} from './approvals.utils';

const productsService = new ProductsService();

const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png,.webp';
const DOCUMENT_MAX_BYTES = 20 * 1024 * 1024;

/** Un modelo de la aprobación: su total y cómo se reparte entre sucursales. */
interface ModelRow {
  product: ApprovalProduct;
  total: string;
  splits: BranchSplit[];
}

function today(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

/** Las líneas (sucursal, modelo) del backend, agrupadas por modelo. */
function rowsFromApproval(approval: Approval): ModelRow[] {
  const rows = new Map<number, ModelRow>();
  approval.lines.forEach((line) => {
    const row = rows.get(line.product.id) ?? {
      product: line.product,
      total: '0',
      splits: [],
    };
    row.splits.push({
      branch: line.branch,
      quantity: String(line.quantity),
      received: line.receivedQuantity,
    });
    row.total = String(Number(row.total) + line.quantity);
    rows.set(line.product.id, row);
  });
  return Array.from(rows.values());
}

/** Error de una fila, o vacío si está bien. */
function rowError(row: ModelRow): string {
  const total = Number(row.total);
  if (!Number.isInteger(total) || total <= 0) return 'Total inválido';
  for (const split of row.splits) {
    const quantity = Number(split.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0)
      return `Cantidad inválida para ${split.branch.name}`;
    if (quantity < split.received)
      return `${split.branch.name} ya recibió ${split.received}: no puede ser menor`;
  }
  const assigned = splitTotal(row.splits);
  if (assigned !== total)
    return `Repartidas ${assigned} de ${total}: use "Repartir" para cuadrarlas`;
  return '';
}

/**
 * Alta y edición de una aprobación de Empire: número, fecha, sucursal que la
 * pidió, los modelos con su total y a qué sucursales va cada uno, y,
 * opcional, el documento de Empire (PDF o foto).
 *
 * Cada modelo es una fila. Al agregarlo va entero a la sucursal que carga la
 * aprobación; "Repartir" lo divide entre sucursales. Así una aprobación de
 * una sola sucursal no cuesta clics de más y con muchas sucursales solo se
 * ven las de cada modelo.
 *
 * Con motos ya recibidas el número no se cambia (las compras lo llevan), y
 * ninguna sucursal baja de lo que recibió ni se quita.
 */
export function ApprovalForm({ approval }: { approval?: Approval }) {
  const router = useRouter();
  const token = useToken();
  const { toast } = useToast();
  const currentBranchId = useCurrentBranchId();
  const { data: branchList } = useAllBranches();
  const branches: ApprovalBranch[] = useMemo(
    () =>
      (branchList || []).map((branch) => ({
        id: branch.id,
        name: branch.name,
      })),
    [branchList]
  );
  const isEditing = !!approval;
  const hasReceipts = (approval?.receivedQuantity ?? 0) > 0;

  const [number, setNumber] = useState(approval?.number ?? '');
  const [approvalDate, setApprovalDate] = useState(
    approval?.approvalDate ?? ''
  );
  const [branchId, setBranchId] = useState<string>(
    approval
      ? String(approval.branch.id)
      : currentBranchId
        ? String(currentBranchId)
        : ''
  );
  const [notes, setNotes] = useState(approval?.notes ?? '');
  const [rows, setRows] = useState<ModelRow[]>(() =>
    approval ? rowsFromApproval(approval) : []
  );
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentError, setDocumentError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingBranch = branches.find(
    (branch) => String(branch.id) === branchId
  );

  // Cambiar la sucursal que carga lleva con ella los modelos que todavía
  // iban enteros a la anterior y no recibieron nada.
  const previousBranchId = useRef(branchId);
  useEffect(() => {
    const previous = previousBranchId.current;
    previousBranchId.current = branchId;
    if (!loadingBranch || !previous || previous === branchId) return;
    setRows((prev) =>
      prev.map((row) =>
        row.splits.length === 1 &&
        String(row.splits[0].branch.id) === previous &&
        row.splits[0].received === 0
          ? { ...row, splits: [{ ...row.splits[0], branch: loadingBranch }] }
          : row
      )
    );
  }, [branchId, loadingBranch]);

  const [modelSearch, setModelSearch] = useState('');
  const [debouncedModelSearch] = useDebounce(modelSearch, 300);
  const catalogQuery = useQuery({
    queryKey: ['approvalBikeCatalog', token, debouncedModelSearch],
    queryFn: () =>
      productsService.getAllBikes(token as string, {
        page: '1',
        pageSize: '8',
        search: debouncedModelSearch,
      }),
    enabled: !!token && debouncedModelSearch.trim().length > 1,
  });
  const catalogResults = (
    (catalogQuery.data?.data?.results ?? []) as unknown as ApprovalProduct[]
  ).filter((product) => !rows.some((row) => row.product.id === product.id));

  const { createApproval, isCreatingApproval } = useCreateApproval();
  const { updateApproval, isUpdatingApproval } = useUpdateApproval();
  const { uploadApprovalDocument, isUploadingApprovalDocument } =
    useUploadApprovalDocument();
  const isSaving =
    isCreatingApproval || isUpdatingApproval || isUploadingApprovalDocument;

  const totalBikes = rows.reduce(
    (sum, row) => sum + (Number(row.total) || 0),
    0
  );
  const branchCount = new Set(
    rows.flatMap((row) => row.splits.map((split) => split.branch.id))
  ).size;
  const rowErrors = rows.map(rowError);

  const normalizedNumber = normalizeApprovalNumber(number);
  const canSubmit =
    !!normalizedNumber &&
    !!approvalDate &&
    approvalDate <= today() &&
    !!branchId &&
    rows.length > 0 &&
    rowErrors.every((error) => !error) &&
    !documentError &&
    !isSaving;

  const updateRow = (index: number, patch: Partial<ModelRow>) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row))
    );

  // Con una sola sucursal, el total y lo repartido son lo mismo.
  const setRowTotal = (index: number, total: string) => {
    const row = rows[index];
    updateRow(index, {
      total,
      splits:
        row.splits.length === 1
          ? [{ ...row.splits[0], quantity: total }]
          : row.splits,
    });
  };

  const addRow = (product: ApprovalProduct) => {
    if (!loadingBranch) return;
    setRows((prev) => [
      ...prev,
      {
        product,
        total: '1',
        splits: [{ branch: loadingBranch, quantity: '1', received: 0 }],
      },
    ]);
    setModelSearch('');
  };

  const onDocumentChange = (file: File | null) => {
    setDocumentError('');
    if (file && file.size > DOCUMENT_MAX_BYTES) {
      setDocumentError('El documento supera los 20 MB.');
    }
    setDocumentFile(file);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitError('');
    const payload = {
      number: normalizedNumber,
      approvalDate,
      branch: Number(branchId),
      notes: notes.trim(),
      lines: rows.flatMap((row) =>
        row.splits.map((split) => ({
          product: row.product.id,
          branch: split.branch.id,
          quantity: Number(split.quantity),
        }))
      ),
    };

    let saved: Approval;
    try {
      saved = isEditing
        ? await updateApproval({ id: approval.id, payload })
        : await createApproval(payload);
    } catch (error) {
      setSubmitError(
        getApprovalErrorMessage(error, 'No se pudo guardar la aprobación.')
      );
      return;
    }

    if (documentFile) {
      try {
        await uploadApprovalDocument({ id: saved.id, file: documentFile });
      } catch (error) {
        toast({
          title: 'La aprobación se guardó, pero el documento no',
          description: getApprovalErrorMessage(
            error,
            'Puede subirlo desde el detalle.'
          ),
          variant: 'destructive',
        });
      }
    }

    const linked = saved.linkedPurchases;
    toast({
      title: isEditing
        ? `Aprobación ${saved.number} actualizada`
        : `Aprobación ${saved.number} registrada`,
      description:
        linked && linked.linked > 0
          ? `Se contaron ${linked.linked} motos que ya estaban registradas con este número.` +
            (linked.notLinked.length
              ? ` ${linked.notLinked.length} no se pudieron contar: su sucursal no está en la aprobación o ya estaba completa.`
              : '')
          : undefined,
    });
    router.push(APPROVAL_DETAIL(saved.id));
  };

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={isEditing ? APPROVAL_DETAIL(approval.id) : APPROVALS}
        className="inline-flex w-fit items-center gap-1 text-sm text-gray-500 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {isEditing ? 'Volver al detalle' : 'Volver a aprobaciones'}
      </Link>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          {isEditing
            ? `Editar aprobación ${approval.number}`
            : 'Registrar aprobación de Empire'}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Cargue lo que Empire aprobó, por modelo, y a qué sucursal va cada uno.
          El color no se indica: cualquier color del modelo cuenta.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="approvalNumber">Número de aprobación</Label>
            <Input
              id="approvalNumber"
              value={number}
              onChange={(e) => setNumber(e.target.value.toUpperCase())}
              disabled={hasReceipts}
              className="font-mono"
              placeholder="13222345"
            />
            {hasReceipts && (
              <p className="text-xs text-gray-500">
                Ya hay motos registradas con este número: no se puede cambiar.
              </p>
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="approvalDate">Fecha de la aprobación</Label>
            <Input
              id="approvalDate"
              type="date"
              max={today()}
              value={approvalDate}
              onChange={(e) => setApprovalDate(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Sucursal que la pidió</Label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Elegir sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={String(branch.id)}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Los modelos nuevos van a esta sucursal hasta que los reparta.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-100 px-4 py-3">
          <h3 className="font-semibold text-gray-900">Modelos aprobados</h3>
          <span className="text-sm tabular-nums text-gray-600">
            {totalBikes} {totalBikes === 1 ? 'moto' : 'motos'} · {branchCount}{' '}
            {branchCount === 1 ? 'sucursal' : 'sucursales'}
          </span>
        </header>
        <div className="space-y-4 p-4">
          <div className="relative">
            <Input
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
              disabled={!loadingBranch}
              placeholder={
                loadingBranch
                  ? 'Buscar modelo para agregar (nombre, modelo o SKU)...'
                  : 'Elija primero la sucursal que pidió la aprobación'
              }
            />
            {modelSearch.trim().length > 1 && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                {catalogQuery.isLoading ? (
                  <p className="px-3 py-2 text-sm text-gray-500">Buscando...</p>
                ) : catalogResults.length === 0 ? (
                  <p className="px-3 py-2 text-sm text-gray-500">
                    Sin resultados (o ya está en la lista).
                  </p>
                ) : (
                  catalogResults.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addRow(product)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                    >
                      <span>
                        <span className="font-medium text-gray-900">
                          {formatApprovalProduct(product)}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          SKU {product.sku}
                        </span>
                      </span>
                      <Plus className="h-4 w-4 text-gray-400" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {rows.length === 0 ? (
            <p className="rounded-md border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
              Agregue los modelos que aprobó Empire.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-md border border-gray-200">
              {rows.map((row, index) => {
                const received = row.splits.reduce(
                  (sum, split) => sum + split.received,
                  0
                );
                return (
                  <li
                    key={row.product.id}
                    className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start"
                  >
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <p className="font-medium text-gray-900">
                        {formatApprovalProduct(row.product)}
                        <span className="ml-2 text-xs font-normal text-gray-500">
                          SKU {row.product.sku}
                        </span>
                      </p>
                      <ApprovalSplitEditor
                        modelName={formatApprovalProduct(row.product)}
                        total={Number(row.total) || 0}
                        splits={row.splits}
                        branches={branches}
                        onChange={(splits) => updateRow(index, { splits })}
                        onUseSumAsTotal={(sum) =>
                          updateRow(index, { total: String(sum) })
                        }
                      />
                      {rowErrors[index] && (
                        <p className="text-xs text-destructive">
                          {rowErrors[index]}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`total-${row.product.id}`}
                        className="text-xs text-gray-500"
                      >
                        Total
                      </Label>
                      <Input
                        id={`total-${row.product.id}`}
                        type="number"
                        min={Math.max(received, 1)}
                        value={row.total}
                        onChange={(e) => setRowTotal(index, e.target.value)}
                        className="w-24 text-right tabular-nums"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={received > 0}
                        title={
                          received > 0
                            ? 'Ya tiene motos recibidas: no se puede quitar'
                            : 'Quitar modelo'
                        }
                        onClick={() =>
                          setRows((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      <section className="grid gap-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="approvalNotes">Observaciones</Label>
          <Textarea
            id="approvalNotes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Opcional"
          />
        </div>
        <div className="space-y-2">
          <Label>Documento de Empire (opcional)</Label>
          {approval?.hasDocument && !documentFile && (
            <p className="flex items-center gap-1.5 text-sm text-gray-700">
              <FileText className="h-4 w-4 text-gray-400" />
              {approval.documentName}
            </p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept={DOCUMENT_ACCEPT}
            className="hidden"
            onChange={(e) => onDocumentChange(e.target.files?.[0] ?? null)}
          />
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              {approval?.hasDocument || documentFile
                ? 'Reemplazar'
                : 'Adjuntar PDF o foto'}
            </Button>
            {documentFile && (
              <span className="text-sm text-gray-700">
                {documentFile.name}
                <button
                  type="button"
                  className="ml-2 text-xs text-gray-500 underline"
                  onClick={() => {
                    onDocumentChange(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                >
                  quitar
                </button>
              </span>
            )}
          </div>
          {documentError && (
            <p className="text-xs text-destructive">{documentError}</p>
          )}
          <p className="text-xs text-gray-500">
            Se guarda como {normalizedNumber || '<número>'}_
            {approvalDate || '<fecha>'}.
          </p>
        </div>
      </section>

      {submitError && (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
          <Link href={isEditing ? APPROVAL_DETAIL(approval.id) : APPROVALS}>
            Cancelar
          </Link>
        </Button>
        <Button disabled={!canSubmit} onClick={handleSubmit}>
          {isSaving
            ? 'Guardando...'
            : isEditing
              ? 'Guardar cambios'
              : 'Registrar aprobación'}
        </Button>
      </div>
    </div>
  );
}
