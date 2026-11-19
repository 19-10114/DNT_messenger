'use client';
import React, { useRef, useState } from 'react';
import { Button } from './button.component';
import { Upload, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadButtonProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  disabled?: boolean;
  loading?: boolean;
  showIcon?: boolean;
  /** El botón "Cargar Archivo Excel" debajo de la zona; fuera cuando el archivo no es un Excel. */
  showButton?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function FileUploadButton({
  onFileSelect,
  accept = '.xlsx,.xls',
  disabled = false,
  loading = false,
  showIcon = true,
  showButton = true,
  className,
  children,
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      fileInputRef.current?.click();
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled && !loading) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);

    if (disabled || loading) return;

    const files = event.dataTransfer.files;
    const file = files[0];

    if (file) {
      // Validate file type
      const acceptedTypes = accept.split(',').map((type) => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

      if (acceptedTypes.includes(fileExtension)) {
        onFileSelect(file);
      } else {
        console.warn(
          'Tipo de archivo no válido. Solo se permiten archivos Excel.'
        );
      }
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || loading}
      />

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer',
          dragOver && !disabled && !loading
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary/50',
          disabled || loading ? 'opacity-50 cursor-not-allowed' : '',
          className
        )}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          {loading ? (
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          ) : showIcon ? (
            <FileSpreadsheet className="h-8 w-8 text-gray-400" />
          ) : null}

          <div className="text-sm text-gray-600">
            {children || (
              <>
                <span className="font-medium text-primary">
                  Haz clic para cargar
                </span>
                <span> o arrastra y suelta</span>
                <br />
                <span className="text-xs text-gray-500">
                  Archivos Excel (.xlsx, .xls)
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {showButton && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={disabled || loading}
          className="mt-2 w-full"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Cargando...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Cargar Archivo Excel
            </>
          )}
        </Button>
      )}
    </div>
  );
}
