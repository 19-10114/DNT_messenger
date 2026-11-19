'use client';

import { useState } from 'react';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { useBranchInventory } from '@/hooks/useBranchInventory';
import { BikeInventorySection } from '@/components/dashBoard/BikeInventorySection.component';
import { GeneralBikeInventorySection } from '@/components/dashBoard/GeneralBikeInventorySection.component';
import { AdminBikeInventorySection } from '@/components/dashBoard/AdminBikeInventorySection.component';
import { BikeInventoryKpis } from '@/components/inventories/BikeInventoryKpis.component';
import { cn } from '@/lib/utils';

// Parámetros iniciales para la paginación (solo se leen al montar el hook)
const initialQueryParameters: GetAllServiceQueryParametersType = {
  page: '1',
  pageSize: '20',
  search: '',
};

export default function BikesInventoryPage() {
  const currentBranchId = useCurrentBranchId();
  const [activeTab, setActiveTab] = useState<'inventory' | 'general'>(
    'inventory'
  );

  // Usar el hook centralizado para obtener todos los inventarios
  const { bikeInventory, generalBikeInventory } = useBranchInventory(
    initialQueryParameters
  );

  // Alias para adminBikeInventory
  const adminBikeInventory = generalBikeInventory;

  // Obtener los datos del inventario de motos
  const getBikeInventoryData = () => {
    if (!bikeInventory || !bikeInventory.data) return [];

    return {
      results: bikeInventory.data.results || [],
      currentPage:
        bikeInventory.data.currentPage || bikeInventory.pagination.currentPage,
      pageSize:
        bikeInventory.data.pageSize || bikeInventory.pagination.pageSize,
      totalElements:
        bikeInventory.data.totalElements ||
        bikeInventory.data.results.length ||
        0,
      totalPages:
        bikeInventory.data.totalPages ||
        Math.ceil(
          (bikeInventory.data.results.length || 0) /
            (bikeInventory.pagination.pageSize || 10)
        ) ||
        1,
    };
  };

  // Obtener los datos del inventario general de motos
  const getGeneralBikeInventoryData = () => {
    if (!generalBikeInventory || !generalBikeInventory.data) return [];

    return {
      results: generalBikeInventory.data.results || [],
      currentPage:
        generalBikeInventory.data.currentPage ||
        generalBikeInventory.pagination.currentPage,
      pageSize:
        generalBikeInventory.data.pageSize ||
        generalBikeInventory.pagination.pageSize,
      totalElements:
        generalBikeInventory.data.totalElements ||
        generalBikeInventory.data.results.length ||
        0,
      totalPages:
        generalBikeInventory.data.totalPages ||
        Math.ceil(
          (generalBikeInventory.data.results.length || 0) /
            (generalBikeInventory.pagination.pageSize || 10)
        ) ||
        1,
    };
  };

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Inventario de Motos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Disponibilidad en stock y gestión de inventario de las motos.
        </p>
      </div>

      {/* KPIs: siguen al check "usadas" de la tabla de inventario */}
      <BikeInventoryKpis
        used={bikeInventory.queryParameters?.used === 'true'}
      />

      {/* Botones de pestañas */}
      <div className="mb-6 border-b border-gray-200">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab('inventory')}
            className={cn(
              'py-2 px-1 font-bold transition-colors text-center',
              activeTab === 'inventory'
                ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                : 'text-gray-700 hover:text-gray-900'
            )}
          >
            Inventario
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={cn(
              'py-2 px-1 font-bold transition-colors text-center',
              activeTab === 'general'
                ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                : 'text-gray-700 hover:text-gray-900'
            )}
          >
            Inventario General
          </button>
        </div>
      </div>

      {/* La pestaña "Inventario General" cambia de vista según la sucursal:
          la 0 (admin) ve la matriz sucursales × modelos */}
      {activeTab === 'inventory' && (
        <BikeInventorySection
          bikeInventory={bikeInventory}
          getBikeInventoryData={getBikeInventoryData}
        />
      )}

      {activeTab === 'general' &&
        (currentBranchId === 0 ? (
          <AdminBikeInventorySection
            adminBikeInventory={adminBikeInventory}
            getAdminBikeInventoryData={getGeneralBikeInventoryData}
          />
        ) : (
          <GeneralBikeInventorySection
            generalBikeInventory={generalBikeInventory}
            getGeneralBikeInventoryData={getGeneralBikeInventoryData}
          />
        ))}
    </section>
  );
}
