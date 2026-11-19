'use client';

import React from 'react';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import { usdFormatCurrency } from '@/lib/utils';
import { BranchDebtItem } from '@/services/transactions/types/BranchDebt.type';
import ExportButton from '@/components/excelExporter/exportButtons.component';

interface TotalDebtTableProps {
  debtData: BranchDebtItem[];
  totalDebt: number;
  buttonConfig?: {
    label: string;
    onClick: (row: Record<string, number | string | boolean>) => void;
  };
}

/** La fila tal como la espera `buttonConfig.onClick` y el export */
const toExportRow = (item: BranchDebtItem) => ({
  'ID Sucursal': item.branch.id,
  'Nombre Sucursal': item.branch.name,
  'Tipo Sucursal': item.branch.type,
  'Monto Deuda': usdFormatCurrency(item.debt),
});

/**
 * A table component specifically for displaying branch total debt data
 */
export function TotalDebtTable({
  debtData,
  totalDebt,
  buttonConfig,
}: TotalDebtTableProps): JSX.Element {
  const columns: GenericTableColumn<BranchDebtItem>[] = [
    {
      key: 'branchId',
      header: 'ID Sucursal',
      width: '7rem',
      render: (item) => item.branch.id,
    },
    {
      key: 'branchName',
      header: 'Nombre Sucursal',
      render: (item) => item.branch.name,
      footer: 'Deuda Total:',
    },
    {
      key: 'branchType',
      header: 'Tipo Sucursal',
      render: (item) => item.branch.type,
    },
    {
      key: 'debt',
      header: 'Monto Deuda',
      render: (item) => usdFormatCurrency(item.debt),
      footer: usdFormatCurrency(totalDebt),
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Deuda Total por Sucursal
      </h2>

      <GenericTable<BranchDebtItem>
        columns={columns}
        data={debtData}
        getRowKey={(item) => item.branch.id}
        emptyMessage="No hay datos de deuda para mostrar."
        actions={
          buttonConfig
            ? [
                {
                  label: buttonConfig.label,
                  onClick: (item) => buttonConfig.onClick(toExportRow(item)),
                },
              ]
            : undefined
        }
        footer={
          debtData.length > 0 ? (
            <ExportButton
              data={[
                ...debtData.map(toExportRow),
                { 'Deuda Total': usdFormatCurrency(totalDebt) },
              ]}
              title="Descargar Deuda Total por Sucursal"
              fileName="deudaTotalPorSucursal"
            />
          ) : null
        }
      />
    </div>
  );
}
