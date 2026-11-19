'use client';

import { useState } from 'react';
import { useRoles } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { useBranchInventory } from '@/hooks/useBranchInventory';
import { PartInventorySection } from '@/components/dashBoard/PartInventorySection.component';
import { GlobalPartInventorySection } from '@/components/dashBoard/GlobalPartInventorySection.component';
import { LoadInventoryModal } from '@/components/modals/loadInventoryModal.component';
import { PartInventoryKpis } from '@/components/inventories/PartInventoryKpis.component';
import { Button } from '@/components/ui/button.component';
import { cn } from '@/lib/utils';

// Parámetros iniciales para la paginación (solo se leen al montar el hook)
const initialQueryParameters: GetAllServiceQueryParametersType = {
  page: '1',
  pageSize: '10',
  search: '',
};

const ROLES_THAT_CAN_LOAD_PRODUCTS = [
  'admin',
  'administrator',
  'parts_admin',
  'manager',
  'main_storage',
];

export default function PartsInventoryPage() {
  const roles = useRoles();
  const currentBranchId = useCurrentBranchId();
  const [activeTab, setActiveTab] = useState<'inventory' | 'global'>(
    'inventory'
  );
  const [isLoadInventoryModalOpen, setIsLoadInventoryModalOpen] =
    useState(false);
  const canSeeUpdateButton = ROLES_THAT_CAN_LOAD_PRODUCTS.some((role) =>
    roles.includes(role)
  );

  // Usar el hook centralizado para obtener todos los inventarios
  const { partInventory } = useBranchInventory(initialQueryParameters);

  // Obtener los datos del inventario de repuestos
  const getPartInventoryData = () => {
    if (!partInventory || !partInventory.data) return [];

    return {
      results: partInventory.data.results || [],
      currentPage:
        partInventory.data.currentPage || partInventory.pagination.currentPage,
      pageSize:
        partInventory.data.pageSize || partInventory.pagination.pageSize,
      totalElements:
        partInventory.data.totalElements ||
        partInventory.data.results.length ||
        0,
      totalPages:
        partInventory.data.totalPages ||
        Math.ceil(
          (partInventory.data.results.length || 0) /
            (partInventory.pagination.pageSize || 10)
        ) ||
        1,
    };
  };

  return (
    <section>
      <div className="mb-8 flex items-center justify-between">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Inventario de Repuestos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Disponibilidad en stock y gestión de inventario de los repuestos
          </p>
        </div>
        {canSeeUpdateButton && (
          <Button
            variant="outline"
            onClick={() => setIsLoadInventoryModalOpen(true)}
          >
            Cargar Productos
          </Button>
        )}
      </div>

      <PartInventoryKpis />

      {/* Botones de pestañas solo para admin */}
      {currentBranchId === 0 && (
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
              onClick={() => setActiveTab('global')}
              className={cn(
                'py-2 px-1 font-bold transition-colors text-center',
                activeTab === 'global'
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              Inventario Global
            </button>
          </div>
        </div>
      )}

      {/* La pestaña "Inventario Global" solo existe para la sucursal 0 */}
      {currentBranchId === 0 && activeTab === 'global' ? (
        <GlobalPartInventorySection />
      ) : (
        <PartInventorySection
          partInventory={partInventory}
          getPartInventoryData={getPartInventoryData}
        />
      )}

      <LoadInventoryModal
        isOpen={isLoadInventoryModalOpen}
        onClose={() => setIsLoadInventoryModalOpen(false)}
      />
    </section>
  );
}
