'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { SearchInput } from '@/components/ui/searchInput.component';
import {
  GenericTable,
  GenericTableColumn,
} from '@/components/tables/genericTable.component';
import BikeDetailsModal from '@/components/modals/bikeDetailsModal.component';
import ExportButton from '@/components/excelExporter/exportButtons.component';
import { useAllBikesHistory } from '@/hooks/useBikeService';
import { BranchesResults } from '@/services/transactions/types/GetAllTransactions';
import { consumeUsedBikeReturn } from '@/utils/usedBikeReturn.utils';
import { useCurrentBranchId } from '@/stores/branch/branch.store';

const PAGE_SIZE = 20;

export default function BikesHistoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pathname = usePathname();
  const currentBranchId = useCurrentBranchId();

  const [selectedBike, setSelectedBike] = useState<BranchesResults | null>(
    null
  );
  const [isBikeModalOpen, setIsBikeModalOpen] = useState(false);

  const { data, isLoading, isFetching, isError } = useAllBikesHistory(search, {
    page: String(page),
    pageSize: String(PAGE_SIZE),
  });

  /**
   * Al volver de la ficha de una moto usada se reabre el modal con la fila que
   * quedó anotada, porque al remontar la vista se vuelve a la página 1 y la
   * fila podría no estar cargada.
   */
  useEffect(() => {
    const pending = consumeUsedBikeReturn(pathname);
    if (!pending) return;

    setSelectedBike(pending);
    setIsBikeModalOpen(true);
  }, [pathname]);

  const bikes: BranchesResults[] = data?.results ?? [];

  const columns: GenericTableColumn<BranchesResults>[] = [
    {
      key: 'id',
      header: 'ID',
      width: '5rem',
      // Al hacer click en el ID se abre la ficha de la moto y sus servicios
      onCellClick: (bike) => {
        setSelectedBike(bike);
        setIsBikeModalOpen(true);
      },
    },
    { key: 'plate', header: 'Placa' },
    { key: 'name', header: 'Nombre', render: (bike) => bike.product?.name },
    { key: 'brand', header: 'Marca', render: (bike) => bike.product?.brand },
    { key: 'color', header: 'Color' },
    {
      key: 'activated',
      header: 'Activada',
      align: 'center',
      render: (bike) => (bike.activated ? '✓' : '-'),
    },
    {
      key: 'targetBranch',
      header: 'Sucursal',
      // Solo para el super admin (sucursal 0): en una sucursal concreta todas
      // las filas repetirían el mismo valor
      hidden: currentBranchId !== 0,
      render: (bike) => bike.targetBranch?.name || 'N/A',
    },
  ];

  const exportData = bikes.map((bike) => ({
    ID: bike.id,
    Placa: bike.plate,
    Nombre: bike.product.name,
    Marca: bike.product.brand,
    Color: bike.color,
    Activada: bike.activated ? '✓' : '-',
    // El export sigue a la tabla: sin columna a la vista, tampoco en el Excel
    ...(currentBranchId === 0
      ? { Sucursal: bike.targetBranch?.name || 'N/A' }
      : {}),
  }));

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Historial de Motos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Todas las motos que han existido alguna vez, incluyendo las ya
          vendidas. Haz clic en el ID para ver sus detalles y servicios.
        </p>
      </div>

      {/* Buscador: fuera de la tabla, para que no se desmonte al refrescar */}
      <div className="mb-4">
        <SearchInput
          placeholder="Buscar motos por nombre, marca, modelo, placa..."
          onSearch={(term) => {
            setSearch(term);
            setPage(1);
          }}
          initialValue={search}
          className="max-w-md"
        />
      </div>

      {isError ? (
        <div className="text-red-500">
          Error al cargar el historial de motos
        </div>
      ) : (
        <GenericTable<BranchesResults>
          columns={columns}
          data={bikes}
          isLoading={isLoading}
          emptyMessage="No hay datos de motos para mostrar."
          toolbar={
            isFetching ? (
              <span className="text-sm text-muted-foreground">
                Actualizando...
              </span>
            ) : null
          }
          pagination={{
            currentPage: data?.currentPage ?? page,
            totalPages: data?.totalPages ?? 1,
            totalElements: data?.totalElements,
            pageSize: PAGE_SIZE,
            onPageChange: setPage,
          }}
          footer={
            bikes.length > 0 ? (
              <ExportButton
                data={exportData}
                title="Descargar Historial de Motos"
              />
            ) : null
          }
        />
      )}

      <BikeDetailsModal
        bike={selectedBike}
        open={isBikeModalOpen}
        onOpenChange={setIsBikeModalOpen}
      />
    </section>
  );
}
