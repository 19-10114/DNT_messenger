'use client';

import { useEffect, useMemo, useRef } from 'react';
import { Camera, FileText, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { cn } from '@/lib/utils';
import {
  MAX_EXPENSE_RECEIPTS,
  RECEIPT_MIME_TYPES,
} from '@/schemas/expense.schema';
import { ExpenseReceipt } from '@/services/expenses/types/Expense.type';

interface ReceiptsUploadProps {
  /** Archivos nuevos, aún sin subir. */
  value: File[];
  onChange: (files: File[]) => void;
  /** Comprobantes ya guardados que se conservan (edición). */
  existing?: ExpenseReceipt[];
  /** Quitar uno guardado: se borra del gasto al guardar. */
  onRemoveExisting?: (id: number) => void;
  invalid?: boolean;
}

function Thumbnail({
  src,
  isPdf,
  label,
  onRemove,
}: {
  src?: string;
  isPdf: boolean;
  label: string;
  onRemove: () => void;
}) {
  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-md border bg-muted/30">
      {isPdf || !src ? (
        <div className="flex h-full flex-col items-center justify-center gap-1 p-1 text-muted-foreground">
          <FileText className="h-8 w-8" />
          <span className="w-full truncate text-center text-[10px]">
            {label}
          </span>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={label} className="h-full w-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Quitar ${label}`}
        className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-black/80"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/**
 * Comprobantes del gasto: hasta `MAX_EXPENSE_RECEIPTS` fotos o PDF (el
 * recibo y los mensajes de WhatsApp que lo acompañan). "Tomar foto" abre la
 * cámara del celular (`capture`), una a la vez; "Subir archivos" deja elegir
 * varios de la galería o del equipo. Se ven como miniaturas, cada una con su X.
 */
export function ReceiptsUpload({
  value,
  onChange,
  existing = [],
  onRemoveExisting,
  invalid,
}: ReceiptsUploadProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const filesRef = useRef<HTMLInputElement>(null);
  const total = existing.length + value.length;
  const remaining = MAX_EXPENSE_RECEIPTS - total;

  const previews = useMemo(
    () =>
      value.map((file) =>
        file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      ),
    [value]
  );
  useEffect(
    () => () => previews.forEach((url) => url && URL.revokeObjectURL(url)),
    [previews]
  );

  const add = (list: FileList | null) => {
    if (!list || remaining <= 0) return;
    onChange([...value, ...Array.from(list).slice(0, remaining)]);
  };

  const input = (ref: React.RefObject<HTMLInputElement>, camera: boolean) => (
    <input
      ref={ref}
      type="file"
      accept={RECEIPT_MIME_TYPES.join(',')}
      capture={camera ? 'environment' : undefined}
      multiple={!camera}
      className="hidden"
      onChange={(event) => {
        add(event.target.files);
        event.target.value = '';
      }}
    />
  );

  return (
    <div
      className={cn(
        'space-y-3 rounded-lg border border-dashed p-3',
        invalid ? 'border-destructive' : 'border-gray-300'
      )}
    >
      {input(cameraRef, true)}
      {input(filesRef, false)}

      {total > 0 && (
        <div className="flex flex-wrap gap-2">
          {existing.map((receipt, index) => (
            <Thumbnail
              key={`saved-${receipt.id}`}
              src={receipt.url ?? undefined}
              isPdf={receipt.mime === 'application/pdf'}
              label={`Comprobante ${index + 1}`}
              onRemove={() => onRemoveExisting?.(receipt.id)}
            />
          ))}
          {value.map((file, index) => (
            <Thumbnail
              key={`new-${index}-${file.name}`}
              src={previews[index]}
              isPdf={!file.type.startsWith('image/')}
              label={file.name}
              onRemove={() => onChange(value.filter((_, i) => i !== index))}
            />
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={remaining <= 0}
        >
          <Camera className="mr-2 h-4 w-4" />
          Tomar foto
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => filesRef.current?.click()}
          disabled={remaining <= 0}
        >
          <Upload className="mr-2 h-4 w-4" />
          Subir archivos
        </Button>
        <span className="text-xs text-muted-foreground">
          {total}/{MAX_EXPENSE_RECEIPTS} · JPG, PNG, WEBP o PDF · máx. 20 MB c/u
        </span>
      </div>
    </div>
  );
}
