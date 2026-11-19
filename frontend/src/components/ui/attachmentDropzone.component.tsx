'use client';

import React from 'react';
import { Film, ImagePlus, Paperclip, X } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface AttachmentDropzoneHandle {
  /** Añade archivos desde fuera (p. ej. los pegados en un textarea) */
  addFiles: (incoming: File[]) => void;
}

interface AttachmentDropzoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  /** Tipos MIME aceptados (`image/png`, `video/mp4`…) */
  accept: string[];
  maxFiles: number;
  /** Bytes por archivo */
  maxFileSize: number;
  /** Bytes entre todos los archivos */
  maxTotalSize?: number;
  disabled?: boolean;
  /** `compact` = solo miniaturas y un botón "Adjuntar", para cajas de respuesta */
  variant?: 'default' | 'compact';
  /** Texto de ayuda bajo la zona (límites, "pega con Ctrl+V") */
  hint?: string;
  className?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * Archivos de un evento de pegado (capturas copiadas al portapapeles). Las
 * capturas llegan como `image.png`; se renombran para distinguirlas.
 */
export function getClipboardFiles(event: React.ClipboardEvent): File[] {
  const items = Array.from(event.clipboardData?.items ?? []);
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  return items
    .filter((item) => item.kind === 'file')
    .map((item) => item.getAsFile())
    .filter((file): file is File => !!file)
    .map((file, index) => {
      if (file.name && file.name !== 'image.png') return file;
      const ext = file.type.split('/')[1] || 'png';
      return new File([file], `captura-${stamp}-${index + 1}.${ext}`, {
        type: file.type,
      });
    });
}

function FilePreview({
  file,
  onRemove,
  disabled,
}: {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const [url, setUrl] = React.useState<string | null>(null);
  const isImage = file.type.startsWith('image/');

  React.useEffect(() => {
    if (!isImage) return;
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file, isImage]);

  return (
    <li className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-md border bg-gray-50">
      {isImage && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-gray-500">
          <Film className="h-6 w-6" aria-hidden />
          <span className="w-full truncate text-center text-[10px]">
            {file.name}
          </span>
        </div>
      )}
      <span className="absolute inset-x-0 bottom-0 bg-black/50 px-1 text-center text-[10px] text-white">
        {formatSize(file.size)}
      </span>
      {!disabled && (
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-1 top-1 rounded-full bg-black/60 p-0.5 text-white opacity-90 hover:bg-black/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={`Quitar ${file.name}`}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  );
}

/**
 * Zona de adjuntos genérica: clic, arrastrar y soltar, y pegar (vía
 * `getClipboardFiles` + `addFiles` del ref). Valida tipo, tamaño y cantidad y
 * muestra el error junto a la zona; los archivos inválidos no se añaden.
 */
export const AttachmentDropzone = React.forwardRef<
  AttachmentDropzoneHandle,
  AttachmentDropzoneProps
>(function AttachmentDropzone(
  {
    files,
    onFilesChange,
    accept,
    maxFiles,
    maxFileSize,
    maxTotalSize,
    disabled = false,
    variant = 'default',
    hint,
    className,
  },
  ref
) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const addFiles = React.useCallback(
    (incoming: File[]) => {
      if (disabled || incoming.length === 0) return;
      const problems: string[] = [];
      const next = [...files];
      let total = next.reduce((sum, f) => sum + f.size, 0);

      for (const file of incoming) {
        if (next.length >= maxFiles) {
          problems.push(`Máximo ${maxFiles} archivos.`);
          break;
        }
        if (!accept.includes(file.type)) {
          problems.push(`${file.name}: tipo de archivo no permitido.`);
          continue;
        }
        if (file.size > maxFileSize) {
          problems.push(
            `${file.name}: pesa más de ${formatSize(maxFileSize)}.`
          );
          continue;
        }
        if (maxTotalSize && total + file.size > maxTotalSize) {
          problems.push(
            `Entre todos los archivos no pueden pasar de ${formatSize(maxTotalSize)}.`
          );
          break;
        }
        const duplicate = next.some(
          (f) =>
            f.name === file.name &&
            f.size === file.size &&
            f.lastModified === file.lastModified
        );
        if (duplicate) continue;
        next.push(file);
        total += file.size;
      }

      setError(problems.length ? problems.join(' ') : null);
      if (next.length !== files.length) onFilesChange(next);
    },
    [
      accept,
      disabled,
      files,
      maxFileSize,
      maxFiles,
      maxTotalSize,
      onFilesChange,
    ]
  );

  React.useImperativeHandle(ref, () => ({ addFiles }), [addFiles]);

  const removeAt = (index: number) => {
    setError(null);
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const openPicker = () => inputRef.current?.click();

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(event.dataTransfer.files));
  };

  const dragHandlers = {
    onDragOver: (event: React.DragEvent) => {
      event.preventDefault();
      if (!disabled) setIsDragging(true);
    },
    onDragLeave: () => setIsDragging(false),
    onDrop,
  };

  const input = (
    <input
      ref={inputRef}
      type="file"
      multiple
      accept={accept.join(',')}
      className="hidden"
      disabled={disabled}
      onChange={(event) => {
        addFiles(Array.from(event.target.files ?? []));
        event.target.value = '';
      }}
    />
  );

  const previews = files.length > 0 && (
    <ul className="flex flex-wrap gap-2">
      {files.map((file, index) => (
        <FilePreview
          key={`${file.name}-${file.size}-${file.lastModified}`}
          file={file}
          disabled={disabled}
          onRemove={() => removeAt(index)}
        />
      ))}
    </ul>
  );

  const errorLine = error && (
    <p className="text-xs text-destructive" role="alert">
      {error}
    </p>
  );

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-col gap-2', className)} {...dragHandlers}>
        {input}
        {previews}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openPicker}
            disabled={disabled || files.length >= maxFiles}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50"
          >
            <Paperclip className="h-3.5 w-3.5" aria-hidden />
            Adjuntar
          </button>
          {hint && <span className="text-xs text-gray-400">{hint}</span>}
        </div>
        {errorLine}
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {input}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={openPicker}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPicker();
          }
        }}
        {...dragHandlers}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed px-4 py-4 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/60 hover:bg-gray-50',
          disabled && 'pointer-events-none opacity-50'
        )}
        aria-disabled={disabled}
      >
        <ImagePlus className="h-6 w-6 text-gray-400" aria-hidden />
        <p className="text-sm text-gray-700">
          <span className="font-medium text-primary">Elige archivos</span>,
          arrástralos aquí o pégalos con Ctrl+V
        </p>
        {hint && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
      {previews}
      {errorLine}
    </div>
  );
});
