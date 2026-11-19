'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { FileUploadButton } from '@/components/ui/fileUploadButton.component';
import { useUploadPartInventoryExcel } from '@/hooks/products';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore, useRoles } from '@/stores/auth/auth.store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';

interface UploadProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
  productType: 'bike' | 'part';
}

export function UploadProductsModal({
  isOpen,
  onClose,
  productType,
}: UploadProductsModalProps) {
  const uploadPartInventoryExcel = useUploadPartInventoryExcel();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const roles = useRoles();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const isAdmin =
    (user?.isSuperuser === true && user?.isStaff === false) ||
    roles.includes('admin');

  const handleClose = () => {
    setSelectedFile(null);
    onClose();
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadPartInventoryExcel.mutateAsync({
        file: selectedFile,
      });
      toast({
        title: 'Éxito',
        description:
          'Archivo cargado exitosamente. Los datos se han actualizado.',
      });
      handleClose();
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description:
          'Error al cargar el archivo. Por favor, intente nuevamente.',
        variant: 'destructive',
      });
    }
  };

  // Si el usuario no es admin, no mostrar el modal
  if (!isAdmin) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent width="440px" maxHeight="90vh" className="max-w-[95vw]">
        <DialogHeader>
          <DialogTitle className="text-xl">Actualizar Costos</DialogTitle>
          <DialogDescription>
            Sube el archivo con los costos actualizados de{' '}
            {productType === 'bike' ? 'motos' : 'repuestos'}.
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {selectedFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
              <FileSpreadsheet className="h-8 w-8 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                disabled={uploadPartInventoryExcel.isLoading}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
                aria-label="Quitar archivo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <FileUploadButton
              onFileSelect={setSelectedFile}
              loading={uploadPartInventoryExcel.isLoading}
              accept=".xlsx,.xls"
              className="w-full"
            />
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={uploadPartInventoryExcel.isLoading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploadPartInventoryExcel.isLoading}
          >
            {uploadPartInventoryExcel.isLoading
              ? 'Cargando...'
              : 'Cargar Archivo'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
