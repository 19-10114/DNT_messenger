'use client';
import { useEffect, useState } from 'react';
import { Title } from '@/components/typography/title.component';
import {
  useToken,
  useAuthService,
  useSuperuser,
  useUser,
} from '@/stores/auth/auth.store';
import {
  useBranchBalance,
  useBranchCash,
  useBranchTotalDebt,
  useClientBonus,
} from '@/hooks/useTransactions';
import { BranchService } from '@/services/branches/branch.service';
import { useQuery } from '@tanstack/react-query';
import { usdFormatCurrency } from '@/lib/utils';
import {
  useCurrentBranchId,
  useBranchActions,
  useBranches,
  useIsLoadingBranches,
} from '@/stores/branch/branch.store';
import { useBranchInventory } from '@/hooks/useBranchInventory';
import { GetAllServiceQueryParametersType } from '@/services/products/types';
import { BikeInventorySection } from '@/components/dashBoard/BikeInventorySection.component';
import { BranchBalanceSection } from '@/components/dashBoard/BranchBalanceSection.component';
import { GeneralBikeInventorySection } from '@/components/dashBoard/GeneralBikeInventorySection.component';
import { AdminBikeInventorySection } from '@/components/dashBoard/AdminBikeInventorySection.component';
import { PartInventorySection } from '@/components/dashBoard/PartInventorySection.component';
import { GlobalPartInventorySection } from '@/components/dashBoard/GlobalPartInventorySection.component';
import { ClientBonusModal } from '@/components/dashBoard/ClientBonusModal.component';

const branchService = new BranchService();

export default function BranchBalancePage() {
  const token = useToken() || '';
  const authService = useAuthService();

  // Obtener el ID de sucursal actual del store global
  const currentBranchId = useCurrentBranchId();
  const branchActions = useBranchActions();

  // Obtener las sucursales del store global
  const branches = useBranches();
  const isLoadingGlobalBranches = useIsLoadingBranches();

  // Fetch branches si no están ya cargadas en el store global
  const {
    data: branchesData,
    isLoading: isLoadingBranches,
    isError: isErrorBranches,
  } = useQuery({
    queryKey: ['branches', token],
    queryFn: () => {
      // Usar el ID de sucursal actual si está disponible, de lo contrario usar '20' como valor predeterminado
      const branchIdParam = currentBranchId?.toString() || '20';
      return branchService.getBranches(token, branchIdParam);
    },
    enabled: !!token && branches.length === 0 && !isLoadingGlobalBranches,
    onSuccess: (data) => {
      // Actualizar las sucursales en el store global
      if (data && data.data) {
        branchActions.setBranches(data.data);
      }
    },
  });

  // Parámetros iniciales para la paginación
  const initialQueryParameters: GetAllServiceQueryParametersType = {
    page: '1',
    pageSize: '10',
    search: '',
  };

  // Usar el hook centralizado para obtener todos los inventarios
  const { bikeInventory, partInventory, generalBikeInventory, refetchAll } =
    useBranchInventory(initialQueryParameters);

  // Alias para adminBikeInventory (usamos el mismo generalBikeInventory pero con diferente nombre para claridad)
  const adminBikeInventory = generalBikeInventory;

  // Fetch branch balance data usando el hook para obtener montos
  const {
    data: branchBalance,
    isLoading: isLoadingBalance,
    isError: isErrorBalance,
    refetch: refetchBalance,
  } = useBranchBalance(token);

  // Fetch branch cash data usando el hook para obtener el efectivo de la sucursal
  const {
    data: branchCash,
    isLoading: isLoadingCash,
    isError: isErrorCash,
    refetch: refetchCash,
  } = useBranchCash(token);

  // Fetch branch total debt data usando el hook para obtener la deuda total de la sucursal
  const {
    data: branchTotalDebt,
    isLoading: isLoadingTotalDebt,
    isError: isErrorTotalDebt,
    refetch: refetchTotalDebt,
  } = useBranchTotalDebt(token);

  // State for Regular Client Bonus Modal
  const [isRegularBonusModalOpen, setIsRegularBonusModalOpen] = useState(false);
  const [regularBonusPage, setRegularBonusPage] = useState(1);

  // State for Ally Client Bonus Modal
  const [isAllyBonusModalOpen, setIsAllyBonusModalOpen] = useState(false);
  const [allyBonusPage, setAllyBonusPage] = useState(1);

  const isSuperuser = useSuperuser();
  const currentUser = useUser();

  // Fetch regular client bonus data
  const {
    data: regularClientBonus,
    isLoading: isLoadingRegularBonus,
    isError: isErrorRegularBonus,
    refetch: refetchRegularBonus,
  } = useClientBonus(
    token,
    {
      page: regularBonusPage.toString(),
      pageSize: '10',
    },
    'regular',
    !!isSuperuser
  );

  // Fetch ally client bonus data
  const {
    data: allyClientBonus,
    isLoading: isLoadingAllyBonus,
    isError: isErrorAllyBonus,
    refetch: refetchAllyBonus,
  } = useClientBonus(
    token,
    {
      page: allyBonusPage.toString(),
      pageSize: '10',
    },
    'aliado',
    !!isSuperuser
  );

  // Obtener los datos de deuda total por sucursal
  const getTotalDebtData = () => {
    if (!branchTotalDebt) return [];
    return branchTotalDebt.debts || [];
  };

  // Establecer el ID de sucursal en el store global basado en el rol del usuario
  useEffect(() => {
    if (
      currentUser &&
      (currentBranchId === undefined || currentBranchId === null)
    ) {
      if (!currentUser.isSuperuser && currentUser.branch) {
        // Para usuarios no administradores, usar su ID de sucursal
        branchActions.setCurrentBranchId(currentUser.branch.id);
      } else if (currentUser.isSuperuser && branches.length > 0) {
        // Para administradores, establecer la primera sucursal como predeterminada
        branchActions.setCurrentBranchId(branches[0].id);
      } else if (
        currentUser.isSuperuser &&
        branchesData?.data &&
        branchesData.data.length > 0
      ) {
        // Si las sucursales se cargaron desde la consulta
        branchActions.setCurrentBranchId(branchesData.data[0].id);
      }
    }
  }, [branchesData, branches, currentBranchId, currentUser, branchActions]);

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

  // Actualizar el ID de sucursal en el store global cuando el usuario cambia la selección
  // const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
  //   const newBranchId = parseInt(e.target.value, 10);
  //   branchActions.setCurrentBranchId(newBranchId);
  // };

  // Solo verificar condiciones críticas que afectan toda la página
  if (branches.length === 0 && isLoadingBranches) {
    return <div>Cargando...</div>;
  }

  if (isErrorBranches) {
    return <div>Error al cargar los datos.</div>;
  }

  return (
    <section>
      <div>
        <h1 className="text-2xl font-semibold mb-2 text-primary font-serif">
          Balance de Sucursal
        </h1>
      </div>

      {/* <div className="flex justify-between items-center mb-4">
        {currentUser?.isSuperuser ? (
          <div className="flex items-center gap-2">
            <label htmlFor="branch-select" className="font-medium">
              Seleccionar Sucursal:
            </label>
            <select
              id="branch-select"
              value={currentBranchId?.toString() || ''}
              onChange={handleBranchChange}
              className="px-3 py-2 border rounded-md"
              disabled={isLoadingBranches || isLoadingGlobalBranches}
            >
              {isLoadingBranches || isLoadingGlobalBranches ? (
                <option>Cargando sucursales...</option>
              ) : (
                branches.map((branch) => (
                  <option key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Sucursal: {currentUser?.branch?.name || 'Cargando...'}
            </span>
          </div>
        )}
        <Button 
          onClick={() => {
            refetchAll();
            refetchBalance();
            refetchCash();
            refetchTotalDebt();
          }} 
          disabled={isLoadingBalance || bikeInventory.isLoading || partInventory.isLoading || generalBikeInventory.isLoading}
        >
          Actualizar
        </Button>
      </div> */}

      {isErrorBranches && (
        <div className="text-red-500">Error al cargar las sucursales</div>
      )}

      <BranchBalanceSection
        branchBalance={branchBalance}
        branchId={currentBranchId}
        branchCash={branchCash}
        branchTotalDebt={branchTotalDebt}
        isLoadingBalance={isLoadingBalance}
        isLoadingCash={isLoadingCash}
        isLoadingTotalDebt={isLoadingTotalDebt}
        isErrorBalance={isErrorBalance}
        isErrorCash={isErrorCash}
        isErrorTotalDebt={isErrorTotalDebt}
        getTotalDebtData={getTotalDebtData}
        regularClientBonus={regularClientBonus}
        isLoadingRegularBonus={isLoadingRegularBonus}
        isErrorRegularBonus={isErrorRegularBonus}
        onRegularBonusClick={() => setIsRegularBonusModalOpen(true)}
        allyClientBonus={allyClientBonus}
        isLoadingAllyBonus={isLoadingAllyBonus}
        isErrorAllyBonus={isErrorAllyBonus}
        onAllyBonusClick={() => setIsAllyBonusModalOpen(true)}
        isSuperuser={isSuperuser}
      />

      {/* Regular Client Bonus Modal */}
      {regularClientBonus && isSuperuser && (
        <ClientBonusModal
          isOpen={isRegularBonusModalOpen}
          onClose={() => setIsRegularBonusModalOpen(false)}
          data={regularClientBonus.results || []}
          total={regularClientBonus.staticData?.total || 0}
          currentPage={regularClientBonus.currentPage}
          totalPages={regularClientBonus.totalPages}
          onPageChange={(page) => setRegularBonusPage(page)}
          title="Abono Regular"
        />
      )}

      {/* Ally Client Bonus Modal */}
      {allyClientBonus && isSuperuser && (
        <ClientBonusModal
          isOpen={isAllyBonusModalOpen}
          onClose={() => setIsAllyBonusModalOpen(false)}
          data={allyClientBonus.results || []}
          total={allyClientBonus.staticData?.total || 0}
          currentPage={allyClientBonus.currentPage}
          totalPages={allyClientBonus.totalPages}
          onPageChange={(page) => setAllyBonusPage(page)}
          title="Abono Aliado"
        />
      )}

      {/* Mostrar inventario admin cuando branchId es 0, sino mostrar inventario regular */}
      {currentBranchId === 0 ? (
        <>
          <BikeInventorySection
            bikeInventory={bikeInventory}
            getBikeInventoryData={getBikeInventoryData}
          />
          <div className="mt-8"></div>
          <GlobalPartInventorySection />
          <div className="mt-8"></div>
          <AdminBikeInventorySection
            adminBikeInventory={adminBikeInventory}
            getAdminBikeInventoryData={getGeneralBikeInventoryData}
          />
        </>
      ) : (
        <>
          <BikeInventorySection
            bikeInventory={bikeInventory}
            getBikeInventoryData={getBikeInventoryData}
          />

          <div className="mt-8"></div>

          <PartInventorySection
            partInventory={partInventory}
            getPartInventoryData={getPartInventoryData}
          />
          <div className="mt-8"></div>

          <GeneralBikeInventorySection
            generalBikeInventory={generalBikeInventory}
            getGeneralBikeInventoryData={getGeneralBikeInventoryData}
          />
        </>
      )}

      <div className="mt-8"></div>
    </section>
  );
}
