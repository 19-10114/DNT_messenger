'use client';
import React, { useMemo, useState, useEffect } from 'react';
import { useToken, useAuthService } from '@/stores/auth/auth.store';
import { BranchService } from '@/services/branches/branch.service';
import {
  useCurrentBranchId,
  useBranchActions,
  useBranches,
  useIsLoadingBranches,
} from '@/stores/branch/branch.store';
import { Title } from '@/components/typography/title.component';
import { useCashObjects } from '@/hooks/useCashObjects';
import { usdFormatCurrency } from '@/lib/utils';
import {
  parsePriceNumber,
  isExpenseObject,
  isCashWithdrawalObject,
} from '@/utils/debtObjects.utils';
import { CashWithdrawalButton } from '@/components/cashWithdrawals/cashWithdrawalButton.component';
import { CashWithdrawalDetailModal } from '@/components/cashWithdrawals/cashWithdrawalDetailModal.component';
import { ExpenseDetailModal } from '@/components/expenses/expenseDetailModal.component';
import { ExpenseFormModal } from '@/components/expenses/expenseFormModal.component';
import { Expense } from '@/services/expenses/types/Expense.type';
import { CashObjectsTable } from '@/components/tables/cashObjectsTable.component';
import { CashObjectItem } from '@/services/transactions/types/CashObjects.type';
import { CashObjectDetailsDialog } from '@/components/modals/CashObjectDetailsDialog.component';
import TransactionDetailsDialog from '@/components/modals/TransactionDetailsDialog.component';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';
import { useQuery } from '@tanstack/react-query';

export default function BranchCashPage() {
  const token = useToken() || '';
  const authService = useAuthService();
  const transactionService = useMemo(() => new TransactionService(), []);
  const branchService = useMemo(() => new BranchService(), []);
  const currentBranchId = useCurrentBranchId();
  const branchActions = useBranchActions();
  const branches = useBranches();
  const isLoadingGlobalBranches = useIsLoadingBranches();

  const { data: branchesData } = useQuery({
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

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser', token],
    queryFn: () => authService.getCurrentUser(token),
    enabled: !!token,
  });

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
  const [objectsPage, setObjectsPage] = useState<string>('1');
  const [objectsPageSize, setObjectsPageSize] = useState<string>('10');

  const {
    data: cashObjectsData,
    isLoading,
    isError,
    refetch,
  } = useCashObjects(token, undefined, {
    page: objectsPage,
    pageSize: objectsPageSize,
  });

  const cashObjectList = cashObjectsData?.cashObjects ?? [];
  const cashObjectsCurrentPage =
    Number(cashObjectsData?.currentPage || objectsPage) || 1;
  const cashObjectsTotalElements =
    typeof cashObjectsData?.totalElements === 'number'
      ? Number(cashObjectsData.totalElements)
      : cashObjectList.length;
  const cashObjectsTotalPages = Math.max(
    1,
    Math.ceil(cashObjectsTotalElements / (Number(objectsPageSize) || 10))
  );
  const maybeTotalCash = cashObjectsData?.totalCash;
  const cashObjectsTotalCash = parsePriceNumber(
    typeof maybeTotalCash === 'number' ? maybeTotalCash : 0
  );

  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCashObject, setSelectedCashObject] =
    useState<CashObjectItem | null>(null);
  const [isTransactionDialogOpen, setIsTransactionDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionDataResult | null>(null);

  const [selectedExpenseId, setSelectedExpenseId] = useState<number>();
  const [editingExpense, setEditingExpense] = useState<Expense>();
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState<number>();

  const handleViewCashObject = async (obj: CashObjectItem) => {
    // Gasto del Módulo de Gastos: su id es el del gasto, no el de una orden.
    if (isExpenseObject(obj.type)) {
      setSelectedExpenseId(obj.id);
      return;
    }
    // Salida de efectivo: su id es el de la salida.
    if (isCashWithdrawalObject(obj.type)) {
      setSelectedWithdrawalId(obj.id);
      return;
    }
    const t = (obj.type || '').toLowerCase();
    const isOrder = t === 'order' || t === 'orden';
    const isTransaction =
      t === 'transaction' || t === 'transferencia' || t === 'transaccion';

    if (isOrder) {
      setSelectedCashObject(obj);
      setIsDetailsOpen(true);
      return;
    }

    if (isTransaction) {
      try {
        const tx = await transactionService.getTransactionById(
          token,
          obj.id.toString()
        );
        setSelectedTransaction(tx);
        setIsTransactionDialogOpen(true);
      } catch (error) {
        setSelectedCashObject(obj);
        setIsDetailsOpen(true);
      }
      return;
    }

    setSelectedCashObject(obj);
    setIsDetailsOpen(true);
  };

  return (
    <section>
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Movimientos en efectivo
        </h1>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <button
          className="bg-primary text-white px-3 py-2 rounded-md hover:bg-primary/80"
          onClick={() => refetch()}
          disabled={isLoading}
        >
          Actualizar
        </button>
        <CashWithdrawalButton
          branchId={currentBranchId || undefined}
          branchName={
            branches.find((branch) => branch.id === currentBranchId)?.name
          }
        />
      </div>

      {isLoading && <Title>Cargando objetos de efectivo...</Title>}
      {isError && (
        <div className="text-red-500">Error al cargar objetos de efectivo</div>
      )}

      {!isLoading && !isError && cashObjectList.length > 0 ? (
        <CashObjectsTable
          items={cashObjectList}
          totalCash={cashObjectsTotalCash}
          currentPage={cashObjectsCurrentPage}
          totalPages={cashObjectsTotalPages}
          pageSize={objectsPageSize}
          onPrev={() => {
            const current = Number(objectsPage) || 1;
            const prev = Math.max(1, current - 1);
            setObjectsPage(String(prev));
          }}
          onNext={() => {
            const current = Number(objectsPage) || 1;
            const total = cashObjectsTotalPages;
            const next = Math.min(total, current + 1);
            setObjectsPage(String(next));
          }}
          onChangePageSize={(size) => {
            setObjectsPage('1');
            setObjectsPageSize(size);
          }}
          onView={handleViewCashObject}
        />
      ) : (
        !isLoading && <p>No hay objetos de efectivo para mostrar.</p>
      )}

      <TransactionDetailsDialog
        isOpen={isTransactionDialogOpen}
        onClose={() => {
          setIsTransactionDialogOpen(false);
          setSelectedTransaction(null);
        }}
        transaction={selectedTransaction as TransactionDataResult}
      />

      <ExpenseDetailModal
        expenseId={selectedExpenseId}
        open={selectedExpenseId !== undefined}
        onOpenChange={(open) => !open && setSelectedExpenseId(undefined)}
        onEdit={(expense) => {
          setSelectedExpenseId(undefined);
          setEditingExpense(expense);
        }}
      />

      <ExpenseFormModal
        open={editingExpense !== undefined}
        onOpenChange={(open) => !open && setEditingExpense(undefined)}
        editExpense={editingExpense}
      />

      <CashWithdrawalDetailModal
        withdrawalId={selectedWithdrawalId}
        open={selectedWithdrawalId !== undefined}
        onOpenChange={(open) => !open && setSelectedWithdrawalId(undefined)}
      />

      <CashObjectDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        cashObject={selectedCashObject}
        token={token}
      />
    </section>
  );
}
