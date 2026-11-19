import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table.component';
import { usdFormatCurrency } from '@/lib/utils';
import { Button } from '../ui/button.component';
import { GeneralBikeInventoryItem } from '@/services/products/types/GeneralBikeInventory';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { PaginationComponent } from '../ui/pagination.component';
import { Pagination } from '@/models/pagination.model';

interface GeneralBikeInventoryTableProps {
  bikeData: GeneralBikeInventoryItem[] | Pagination<GeneralBikeInventoryItem>;
  buttonConfig?: {
    label: string;
    onClick: (row: Record<string, number | string | boolean>) => void;
  };
  onPageChange?: (page: number) => void;
  pageSize?: number;
  getAllData?: () => Promise<GeneralBikeInventoryItem[]>;
}

/**
 * A table component specifically for displaying general bike inventory data
 */
export function GeneralBikeInventoryTable({
  bikeData,
  buttonConfig,
  onPageChange,
  pageSize = 10,
  getAllData,
}: GeneralBikeInventoryTableProps): JSX.Element {
  // Estado local para la página actual si no se proporciona control externo
  const [currentPage, setCurrentPage] = React.useState(1);

  // Determinar si los datos son paginados o un array simple
  const isPaginated = bikeData && 'results' in bikeData;

  // Extraer los datos de motos y la información de paginación
  const bikes = isPaginated ? bikeData.results : bikeData;
  const totalPages = isPaginated ? bikeData.totalPages : 1;
  const displayedCurrentPage = isPaginated ? bikeData.currentPage : currentPage;

  if (!bikes || bikes.length === 0)
    return <p>No hay datos de inventario general de motos para mostrar.</p>;

  const ColorCircles = ({
    colors,
  }: {
    colors: { color: string; colorHex: string; quantity: number }[];
  }) => (
    <div className="flex flex-wrap gap-1 justify-center">
      {colors.map((colorItem, index) => (
        <div key={index} className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-full border border-gray-300"
            style={{ backgroundColor: colorItem.colorHex }}
            title={`${colorItem.color}: ${colorItem.quantity}`}
          />
          <span className="text-xs">{colorItem.quantity}</span>
        </div>
      ))}
    </div>
  );

  // Format bike data for the table
  const formattedBikeData = bikes.map((item) => ({
    id: item.id,
    Modelo: item.model,
    Marca: item.brand,
    Colores: <ColorCircles colors={item.colors} />,
    'Cantidad Total': item.totalQuantity,
  }));

  const formattedBikeDataForActions = bikes.map((item) => ({
    id: item.id,
    Modelo: item.model,
    Marca: item.brand,
    Colores: item.colors
      .map((color) => `${color.color}: ${color.quantity}`)
      .join(', '),
    'Cantidad Total': item.totalQuantity,
  }));

  // Extract column names dynamically from the first object in the data array
  const columns =
    formattedBikeData.length > 0 ? Object.keys(formattedBikeData[0]) : [];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-primary">
        Inventario General de Motos
      </h2>
      <section className="overflow-x-auto">
        <Table className="min-w-full border-collapse border border-gray-300">
          <TableHeader>
            <TableRow className="bg-primary text-white text-xs font-medium uppercase tracking-wider">
              {columns
                .filter((col) => col !== 'id')
                .map((column, index) => (
                  <TableHead
                    key={index}
                    className="p-2 text-white text-center w-2"
                  >
                    {column.replace(/_/g, ' ')}
                  </TableHead>
                ))}
              {buttonConfig && (
                <TableHead className="p-2 text-white text-center w-2">
                  Acciones
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {formattedBikeData.map((row, rowIndex) => (
              <TableRow key={row.id || rowIndex}>
                {columns
                  .filter((col) => col !== 'id') // Excluir 'id' de las columnas mostradas
                  .map((column, colIndex) => (
                    <TableCell
                      key={colIndex}
                      className="border border-gray-300 px-4 py-2 text-sm text-gray-600 text-center"
                    >
                      {row[column as keyof typeof row]}
                    </TableCell>
                  ))}
                {buttonConfig && (
                  <TableCell className="border border-gray-300 px-4 py-2 text-sm text-center">
                    <button
                      onClick={() =>
                        buttonConfig.onClick(
                          formattedBikeDataForActions[rowIndex]
                        )
                      }
                      className="bg-primary text-white px-4 py-2 rounded hover:bg-primary/90"
                    >
                      {buttonConfig.label}
                    </button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* Componente de paginación */}
      {isPaginated && totalPages > 1 && (
        <PaginationComponent
          currentPage={displayedCurrentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (onPageChange) {
              onPageChange(page);
            } else {
              setCurrentPage(page);
            }
          }}
        />
      )}

      {formattedBikeData.length > 0 && (
        <div className="py-4">
          <ExportButton
            data={formattedBikeData}
            title="Descargar Inventario General de Motos"
            getAllData={
              getAllData
                ? async () => {
                    const allData = await getAllData();
                    return allData.map((item) => ({
                      Modelo: item.model,
                      Marca: item.brand,
                      Colores: item.colors
                        .map((color) => `${color.color}: ${color.quantity}`)
                        .join(', '),
                      'Cantidad Total': item.totalQuantity,
                    }));
                  }
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
