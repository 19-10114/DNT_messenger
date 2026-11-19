'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog.component';
import { Button } from '@/components/ui/button.component';
import { InventoryTable } from '@/components/ui/inventoryTable.component';

interface LeaseStatusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  data: Array<Record<string, string | number>>;
}

const LeaseStatusDialog: React.FC<LeaseStatusDialogProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-3/4 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estatus de la orden</DialogTitle>
        </DialogHeader>
        {data.length > 0 ? (
          <InventoryTable data={data} />
        ) : (
          <p>No se encontraron datos para esta orden.</p>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Cerrar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LeaseStatusDialog;
