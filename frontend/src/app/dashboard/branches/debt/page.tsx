'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Title } from '@/components/typography/title.component';
import { useToken, useAuthService } from '@/stores/auth/auth.store';
import { useQuery } from '@tanstack/react-query';
import { useBranchTotalDebt } from '@/hooks/useTransactions';
import { useDebtObjects } from '@/hooks/useDebtObjects';
import { useBranchDebt } from '@/hooks/useBranchDebt';
import {
  useCurrentBranchId,
  useBranchActions,
  useBranches,
  useIsLoadingBranches,
} from '@/stores/branch/branch.store';
import { BranchService } from '@/services/branches/branch.service';
import { TotalDebtTable } from '@/components/tables/totalDebtTable.component';
import { Button } from '@/components/ui/button.component';
import { usdFormatCurrency } from '@/lib/utils';
import { parsePriceNumber } from '@/utils/debtObjects.utils';
import { DebtObjectItem } from '@/services/transactions/types/DebtObjects.type';
import { DebtObjectsTable } from '@/components/tables/debtObjectsTable.component';
import { DebtObjectDetailsDialog } from '@/components/modals/DebtObjectDetailsDialog.component';
import { TransactionService } from '@/services/transactions/transactions.service';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import { canViewTransactionDetails } from '@/utils/debtObjects.utils';

const branchService = new BranchService();

export default function BranchDebtPage() {
  const token = useToken() || '';
  const authService = useAuthService();

  const currentBranchId = useCurrentBranchId();
  const branchActions = useBranchActions();
  const branches = useBranches();
  const isLoadingGlobalBranches = useIsLoadingBranches();

  const transactionService = useMemo(() => new TransactionService(), []);

  // Load branches into global store if empty
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

  // Set current branch based on user role if not set
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => authService.getCurrentUser(token),
    enabled: !!token,
  });
  const isAdmin = Boolean(currentUser?.isSuperuser || currentUser?.isStaff);

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

  // Total debt for the current branch
  const {
    data: branchTotalDebt,
    isLoading: isLoadingTotalDebt,
    isError: isErrorTotalDebt,
    refetch: refetchTotalDebt,
  } = useBranchTotalDebt(token);

  const totalDebtData = useMemo(
    () => branchTotalDebt?.debts || [],
    [branchTotalDebt]
  );
  const totalDebt = branchTotalDebt?.total ?? 0;

  // Pairwise debt selection
  const [primaryBranchId, setPrimaryBranchId] = useState<string | undefined>(
    currentBranchId ? currentBranchId.toString() : undefined
  );
  const [secondaryBranchId, setSecondaryBranchId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    // keep primary in sync with global current branch
    if (currentBranchId) {
      setPrimaryBranchId(currentBranchId.toString());
    }
  }, [currentBranchId]);

  const {
    data: pairwiseDebt,
    isLoading: isLoadingPairwiseDebt,
    isError: isErrorPairwiseDebt,
    refetch: refetchPairwiseDebt,
  } = useBranchDebt(token, primaryBranchId, secondaryBranchId);

  // Paginación para "Deuda entre seleccionadas"
  const [transactionsPage, setTransactionsPage] = useState<string>('1');
  const [transactionsPageSize] = useState<string>('10');

  // Resetear a la primera página cuando cambian las sucursales seleccionadas
  useEffect(() => {
    setTransactionsPage('1');
  }, [primaryBranchId, secondaryBranchId]);

  // Obtener transacciones de deuda con paginación
  // const {
  //   data: debtTransactions,
  //   isLoading: isLoadingDebtTransactions,
  //   isError: isErrorDebtTransactions,
  //   refetch: refetchDebtTransactions,
  // } = useTransactionsDebt(
  //   token,
  //   primaryBranchId && secondaryBranchId
  //     ? { first_branch: primaryBranchId, second_branch: secondaryBranchId }
  //     : undefined,
  //   { page: transactionsPage, pageSize: transactionsPageSize }
  // );

  // Debt objects paginated
  const [objectsPage, setObjectsPage] = useState<string>('1');
  const [objectsPageSize, setObjectsPageSize] = useState<string>('10');

  const {
    data: debtObjectsData,
    isLoading: isLoadingDebtObjects,
    isError: isErrorDebtObjects,
    refetch: refetchDebtObjects,
  } = useDebtObjects(token, primaryBranchId, secondaryBranchId, {
    page: objectsPage,
    pageSize: objectsPageSize,
  });

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedDebtObject, setSelectedDebtObject] =
    useState<DebtObjectItem | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDataResult | null>(null);

  const handleViewDebtObject = async (obj: DebtObjectItem) => {
    // Si es una transacción, usamos el modal de detalles de transacción
    if (canViewTransactionDetails(obj.type)) {
      try {
        const tx = await transactionService.getTransactionById(
          token,
          obj.id.toString()
        );
        setSelectedTransaction(tx);
        setIsTransactionDialogOpen(true);
      } catch (error) {
        setSelectedDebtObject(obj);
        setIsDetailsOpen(true);
      }
      return;
    }

    setSelectedDebtObject(obj);
    setIsDetailsOpen(true);
  };

  const handleSetSecondaryFromRow = (
    row: Record<string, number | string | boolean>
  ) => {
    const branchIdValue = row['ID Sucursal'];
    if (typeof branchIdValue === 'number') {
      setSecondaryBranchId(branchIdValue.toString());
    } else if (typeof branchIdValue === 'string') {
      setSecondaryBranchId(branchIdValue);
    }
  };

  const disabledControls = isLoadingBranches || isLoadingGlobalBranches;

  // Derivados seguros para la tabla de Objetos de deuda
  const debtObjectList = debtObjectsData?.debtObjects ?? [];
  const debtObjectsCurrentPage =
    Number(debtObjectsData?.currentPage || objectsPage) || 1;
  const debtObjectsTotalElements =
    typeof debtObjectsData?.totalElements === 'number'
      ? Number(debtObjectsData.totalElements)
      : debtObjectList.length;
  const debtObjectsTotalPages = Math.max(
    1,
    Math.ceil(debtObjectsTotalElements / (Number(objectsPageSize) || 10))
  );
  const maybeTotalDebt = debtObjectsData?.totalDebt;
  const debtObjectsTotalDebt = parsePriceNumber(
    typeof maybeTotalDebt === 'number' ? maybeTotalDebt : 0
  );

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Deuda entre Sucursales
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización de la deuda entre sucursales.
        </p>
      </div>

      {isLoadingBranches && <Title>Cargando sucursales...</Title>}
      {isErrorBranches && (
        <div className="text-red-500">Error al cargar las sucursales</div>
      )}

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="primary-branch" className="font-medium">
            Sucursal primaria:
          </label>
          <select
            id="primary-branch"
            className="px-3 py-2 border rounded-md"
            value={primaryBranchId || ''}
            onChange={(e) => setPrimaryBranchId(e.target.value)}
            disabled={disabledControls || !isAdmin}
          >
            {(branches || []).map((branch) => (
              <option key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="secondary-branch" className="font-medium">
            Sucursal secundaria:
          </label>
          <select
            id="secondary-branch"
            className="px-3 py-2 border rounded-md"
            value={secondaryBranchId || ''}
            onChange={(e) => setSecondaryBranchId(e.target.value)}
            disabled={disabledControls}
          >
            <option value="" disabled>
              Selecciona una sucursal
            </option>
            {(branches || [])
              .filter((b) => b.id.toString() !== (primaryBranchId || ''))
              .map((branch) => (
                <option key={branch.id} value={branch.id.toString()}>
                  {branch.name}
                </option>
              ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => {
              refetchTotalDebt();
              refetchPairwiseDebt();
              // refetchDebtTransactions();
              refetchDebtObjects();
            }}
            disabled={
              isLoadingTotalDebt || isLoadingPairwiseDebt
              // isLoadingDebtTransactions
            }
          >
            Actualizar
          </Button>
        </div>
      </div>

      <div className="mb-8">
        {isLoadingTotalDebt && <Title>Cargando deuda total...</Title>}
        {isErrorTotalDebt && (
          <div className="text-red-500">Error al cargar la deuda total</div>
        )}
        {!isLoadingTotalDebt && !isErrorTotalDebt && (
          <TotalDebtTable
            debtData={totalDebtData}
            totalDebt={totalDebt}
            buttonConfig={{
              label: 'Seleccionar',
              onClick: handleSetSecondaryFromRow,
            }}
          />
        )}
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-primary">
          Deuda entre seleccionadas
        </h2>
        {!primaryBranchId || !secondaryBranchId ? (
          <p>Selecciona ambas sucursales para ver el detalle de deuda.</p>
        ) : isLoadingPairwiseDebt ? (
          <Title>Cargando deuda...</Title>
        ) : isErrorPairwiseDebt ? (
          <div className="text-red-500">Error al calcular la deuda</div>
        ) : (
          <div className="p-3 border rounded-md">
            <p>
              Monto de deuda:{' '}
              <span className="font-semibold">
                {usdFormatCurrency(pairwiseDebt ?? 0)}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              Positivo: la secundaria debe a la primaria; negativo: la primaria
              debe a la secundaria.
            </p>

            {/* Tabla de transacciones entre sucursales seleccionadas */}
            {/* <div className="mt-4">
              {isLoadingDebtTransactions ? (
                <Title>Cargando transacciones...</Title>
              ) : isErrorDebtTransactions ? (
                <div className="text-red-500">Error al cargar transacciones</div>
              ) : debtTransactions && debtTransactions.results && debtTransactions.results.length > 0 ? (
                <>
                  <TransactionList paginatedPayments={debtTransactions} />
                  <PaginationComponent
                    currentPage={Number(debtTransactions.currentPage || transactionsPage) || 1}
                    totalPages={Number(debtTransactions.totalPages || 1) || 1}
                    onPageChange={(page) => setTransactionsPage(String(page))}
                  />
                </>
              ) : (
                <p>No hay transacciones para mostrar.</p>
              )}
            </div> */}
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2 text-primary">
          Historial de movimientos
        </h2>
        {!primaryBranchId || !secondaryBranchId ? (
          <p>Selecciona ambas sucursales para ver los movimientos.</p>
        ) : isErrorDebtObjects ? (
          <div className="text-red-500">Error al cargar objetos de deuda</div>
        ) : (
          <DebtObjectsTable
            items={debtObjectList}
            totalDebt={debtObjectsTotalDebt}
            currentPage={debtObjectsCurrentPage}
            totalPages={debtObjectsTotalPages}
            pageSize={objectsPageSize}
            isLoading={isLoadingDebtObjects}
            onPageChange={(page) => setObjectsPage(String(page))}
            onChangePageSize={(size) => {
              setObjectsPage('1');
              setObjectsPageSize(size);
            }}
            onView={handleViewDebtObject}
          />
        )}
      </div>

      <TransactionDetailsDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => {
          setIsTransactionDialogOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction as TransactionDataResult}
      />

      <DebtObjectDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        debtObject={selectedDebtObject}
        token={token}
      />
    </section>
  );
}
