'use client';

import { useEffect, useState } from 'react';
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
import {
  useCurrentBranchId,
  useBranchActions,
  useBranches,
  useIsLoadingBranches,
} from '@/stores/branch/branch.store';
import { BranchBalanceSection } from '@/components/dashBoard/BranchBalanceSection.component';
import { ClientBonusModal } from '@/components/dashBoard/ClientBonusModal.component';
import { HomeGreeting } from '@/components/dashBoard/HomeGreeting.component';

const branchService = new BranchService();

/**
 * Inicio de sucursal: el de siempre, para los roles que no ven el Inicio de
 * gerencia (finanzas, cajeros, vendedores...). Movido sin cambios desde
 * `app/dashboard/page.tsx`.
 */
export function BranchHome() {
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
      const branchIdParam = currentBranchId?.toString() || '20';
      return branchService.getBranches(token, branchIdParam);
    },
    enabled: !!token && branches.length === 0 && !isLoadingGlobalBranches,
    onSuccess: (data) => {
      if (data && data.data) {
        branchActions.setBranches(data.data);
      }
    },
  });

  // Fetch branch balance data
  const {
    data: branchBalance,
    isLoading: isLoadingBalance,
    isError: isErrorBalance,
    refetch: refetchBalance,
  } = useBranchBalance(token);

  // Fetch branch cash data
  const {
    data: branchCash,
    isLoading: isLoadingCash,
    isError: isErrorCash,
    refetch: refetchCash,
  } = useBranchCash(token);

  // Fetch branch total debt data
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
        branchActions.setCurrentBranchId(currentUser.branch.id);
      } else if (currentUser.isSuperuser && branches.length > 0) {
        branchActions.setCurrentBranchId(branches[0].id);
      } else if (
        currentUser.isSuperuser &&
        branchesData?.data &&
        branchesData.data.length > 0
      ) {
        branchActions.setCurrentBranchId(branchesData.data[0].id);
      }
    }
  }, [branchesData, branches, currentBranchId, currentUser, branchActions]);

  // Loading state
  if (branches.length === 0 && isLoadingBranches) {
    return <div>Cargando...</div>;
  }

  // Error state
  if (isErrorBranches) {
    return <div>Error al cargar los datos.</div>;
  }

  return (
    <section>
      <HomeGreeting />

      <h2 className="mb-4 text-base font-semibold text-neutral-950">
        Resumen de la sucursal
      </h2>

      {/* Sección de KPIs */}
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
    </section>
  );
}
