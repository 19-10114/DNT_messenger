'use client';

import React, { useState } from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { BranchItem } from '@/services/branches/types/Branch.type';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { GeneralBikeInventoryTable } from './generalBikeInventoryTable.component';
import { useGeneralBikeInventory } from '@/hooks/useGeneralBikeInventory';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog.component';

interface BranchTableProps {
  branchData: BranchItem[];
  isLoading?: boolean;
  onEdit?: (branch: BranchItem) => void;
  onDelete?: (branch: BranchItem) => void;
  isAdmin: boolean;
}

/**
 * A table component specifically for displaying branch data
 */
export function BranchTable({
  branchData,
  isLoading: isLoadingBranches = false,
  onEdit,
  onDelete,
  isAdmin,
}: BranchTableProps): JSX.Element {
  const [showInventoryDialog, setShowInventoryDialog] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('TOKEN') || undefined
      : undefined;
  const { data: bikeInventoryData, isLoading } = useGeneralBikeInventory(
    token,
    selectedBranch?.id?.toString()
  );

  const columns: GenericTableColumn<BranchItem>[] = [
    { key: 'id', header: 'ID', width: '5rem' },
    {
      key: 'name',
      header: 'Nombre',
      // Al hacer click en el nombre se abre el inventario de esa sucursal
      onCellClick: (branch) => {
        setSelectedBranch(branch);
        setShowInventoryDialog(true);
      },
    },
    { key: 'type', header: 'Tipo' },
  ];

  const exportData = branchData.map((item) => ({
    ID: item.id,
    Nombre: item.name,
    Tipo: item.type,
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Listado de Sucursales
      </h2>

      <GenericTable<BranchItem>
        columns={columns}
        data={branchData}
        isLoading={isLoadingBranches}
        emptyMessage="No hay datos de sucursales para mostrar."
        actions={
          isAdmin
            ? [
                {
                  label: 'Editar',
                  icon: 'edit',
                  onClick: (branch) => onEdit?.(branch),
                },
                {
                  label: 'Eliminar',
                  icon: 'delete',
                  variant: 'ghost',
                  className:
                    'border border-transparent text-red-600 hover:border-red-500 hover:bg-red-200 hover:text-red-700',
                  onClick: (branch) => onDelete?.(branch),
                },
              ]
            : undefined
        }
        footer={
          branchData.length > 0 ? (
            <ExportButton
              data={exportData}
              title="Descargar Listado de Sucursales"
            />
          ) : null
        }
      />

      <Dialog open={showInventoryDialog} onOpenChange={setShowInventoryDialog}>
        <DialogContent width="90%" maxHeight="90vh">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary">
              Inventario de Motos - Sucursal {selectedBranch?.name}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <p>Cargando datos de inventario...</p>
            </div>
          ) : (
            <GeneralBikeInventoryTable
              bikeData={bikeInventoryData?.data || []}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
