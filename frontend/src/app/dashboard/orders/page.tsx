'use client';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.component';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import OrdersTable from './ordersTable.component';
import { useAllBranches } from '@/hooks/useAllBranches';
import { useSuperuser, useIsSuperAdmin } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useAllBikes } from '@/hooks';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select.component';
import { FilterDate } from '@/components/ui/filterDate.component';

const categoryOptions = [
  { value: 'finance', label: 'Financieras' },
  { value: 'mfb', label: 'Motores fuera de borda' },
  { value: 'bikes', label: 'Motos' },
  { value: 'parts', label: 'Repuestos' },
  { value: 'services', label: 'Servicios' },
];

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  // Remonta el FilterDate para reiniciar su selección interna
  const [dateFilterKey, setDateFilterKey] = useState<number>(0);
  const [selectedBranch, setSelectedBranch] = useState<string>('');

  const { data: branches } = useAllBranches();
  const isSuperuser = useSuperuser();
  const isSuperAdmin = useIsSuperAdmin();
  const currentBranchId = useCurrentBranchId();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [allBikesList, setAllBikesList] = useState<
    Array<{ id: number; name: string }>
  >([]);

  const allBikes = useAllBikes({
    page: '1',
    pageSize: '1000',
  });

  useEffect(() => {
    if (allBikes.data?.results) {
      setAllBikesList(
        allBikes.data.results.map((bike: any) => ({
          id: bike.id,
          name: bike.name,
        }))
      );
    }
  }, [allBikes.data]);

  const handleOnSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setStartDate(undefined);
    setEndDate(undefined);
    setDateFilterKey((k) => k + 1);
    setSelectedBranch('');
    setSelectedModelId('');
  };

  const hasActiveFilters =
    selectedCategory ||
    startDate ||
    endDate ||
    selectedBranch ||
    selectedModelId;

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Ordenes
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Ordenes.
        </p>
      </div>

      <div className="flex flex-col gap-4 my-4">
        {/* Search and Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchTerm}
            onChange={handleOnSearch}
            placeholder="Buscar cliente..."
            className="px-3 py-2 border rounded-md min-w-[200px]"
          />

          {/* Category Filter */}
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCategory === 'bikes' && (
            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los modelos</SelectItem>
                {allBikesList.map((bike) => (
                  <SelectItem key={bike.id} value={bike.id.toString()}>
                    {bike.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Branch Filter - Only for Super Admin */}
          {isSuperuser && currentBranchId === 0 && branches && (
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* Date Filter */}
        <div className="flex items-center">
          <FilterDate
            key={dateFilterKey}
            onChange={(start, end) => {
              setStartDate(start);
              setEndDate(end);
            }}
          />
        </div>

        {/* Create Order Button */}
        {isSuperAdmin && (
          <div className="flex justify-end">
            <Link href="/dashboard/orders/new">
              <Button>Crear Orden</Button>
            </Link>
          </div>
        )}
      </div>

      <OrdersTable
        search={debouncedSearchTerm}
        category={selectedCategory as any}
        startDate={startDate}
        endDate={endDate}
        branchId={selectedBranch}
        modelId={selectedModelId === 'all' ? undefined : selectedModelId}
      />
    </section>
  );
}
