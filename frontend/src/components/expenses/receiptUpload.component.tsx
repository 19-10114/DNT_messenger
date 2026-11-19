'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/button.component';
import { cn } from '@/lib/utils';
import { RECEIPT_MIME_TYPES } from '@/schemas/expense.schema';

interface ReceiptUploadProps {
  value?: File;
  onChange: (file: File | undefined) => void;
  /** Comprobante ya guardado (edición): se muestra mientras no se reemplace. */
  currentLabel?: string;
  invalid?: boolean;
}

/**
 * Comprobante del gasto: foto (desde la cámara del celular) o PDF. En móvil
 * `capture` abre la cámara directo, que es el caso más común: la foto de un
 * recibo o de un mensaje de WhatsApp.
 */
export function ReceiptUpload({
  value,
  onChange,
  currentLabel,
  invalid,
}: ReceiptUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();

  useEffect(() => {
    if (!value || !value.type.startsWith('image/')) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const open = () => inputRef.current?.click();

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={RECEIPT_MIME_TYPES.join(',')}
        capture="environment"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onChange(file);
          event.target.value = '';
        }}
      />

      {value ? (
        <div className="flex items-center gap-3 rounded-md border p-3">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Vista previa del comprobante"
              className="h-16 w-16 rounded object-cover"
            />
          ) : (
            <FileText className="h-10 w-10 text-muted-foreground" />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{value.name}</p>
            <p className="text-xs text-muted-foreground">
              {(value.size / 1024).toFixed(0)} KB
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onChange(undefined)}
            aria-label="Quitar comprobante"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={open}
          className={cn(
            'flex w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-muted-foreground transition-colors hover:bg-muted/40',
            invalid ? 'border-destructive' : 'border-gray-300'
          )}
        >
          <Camera className="h-6 w-6" />
          <span className="text-sm font-medium">
            {currentLabel
              ? 'Reemplazar comprobante'
              : 'Tomar foto o subir archivo'}
          </span>
          <span className="text-xs">JPG, PNG, WEBP o PDF · máx. 20 MB</span>
          {currentLabel && (
            <span className="text-xs text-gray-500">
              Actual: {currentLabel}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
