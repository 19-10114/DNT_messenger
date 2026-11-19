'use client';
import { useState } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useQuery } from '@tanstack/react-query';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionList } from '../tables/transactionsTable.component';
import { Button } from '../ui/button.component';
import { Title } from '../typography/title.component';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { BranchOriginTargetFilters } from './branchOriginTargetFilters.component';
import { TRANSACTIONS_BRANCH_SALE_TAB } from '@/constants/routes';

const transactionService = new TransactionService();

export function BranchTransactions() {
  const token = useToken() || '';
  const branchId = useCurrentBranchId();

  const [pageInfo, setPageInfo] = useState({ page: '1', pageSize: '10' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 100);
  const [originBranch, setOriginBranch] = useState<string | undefined>(
    undefined
  );
  const [targetBranch, setTargetBranch] = useState<string | undefined>(
    undefined
  );

  const transactionQuery = useQuery({
    queryKey: [
      'branchTransactions',
      token,
      branchId,
      pageInfo,
      debouncedSearchTerm,
      originBranch,
      targetBranch,
    ],
    queryFn: async () =>
      transactionService.getAllTransactions(
        token,
        branchId !== undefined ? branchId.toString() : undefined,
        {
          page: pageInfo.page,
          pageSize: pageInfo.pageSize,
          search: debouncedSearchTerm,
          originBranch,
          targetBranch,
        }
      ),
    enabled: !!token && branchId !== undefined,
  });

  if (branchId === undefined) {
    return (
      <div className="p-4 text-center">
        <Title>Seleccione una sucursal para ver sus transacciones</Title>
      </div>
    );
  }

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Transacciones de la Sucursal
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Transacciones de Motos.
        </p>
      </div>

      <div className="flex justify-end m-2 gap-2 items-center">
        <section className="flex justify-between">
          <Link href={TRANSACTIONS_BRANCH_SALE_TAB('motos')}>
            <Button>Nueva transferencia</Button>
          </Link>
        </section>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar transacción..."
          className="px-3 py-2 border rounded-md"
        />
        <BranchOriginTargetFilters
          originBranch={originBranch}
          targetBranch={targetBranch}
          onOriginChange={(value) => {
            setOriginBranch(value);
            setPageInfo((prev) => ({ ...prev, page: '1' }));
          }}
          onTargetChange={(value) => {
            setTargetBranch(value);
            setPageInfo((prev) => ({ ...prev, page: '1' }));
          }}
        />
      </div>
      <TransactionList
        paginatedPayments={transactionQuery.data}
        isLoading={transactionQuery.isLoading}
        onPageChange={(page) =>
          setPageInfo((prev) => ({ ...prev, page: String(page) }))
        }
      />
    </section>
  );
}
