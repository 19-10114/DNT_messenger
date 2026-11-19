'use client';
import { useState } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { usePartTransactions } from '@/hooks/useTransactions';
import { TransactionList } from '../tables/transactionsTable.component';
import { Button } from '../ui/button.component';
import { Title } from '../typography/title.component';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { FilterDate } from '../ui/filterDate.component';
import { BranchOriginTargetFilters } from './branchOriginTargetFilters.component';
import { TRANSACTIONS_BRANCH_SALE_TAB } from '@/constants/routes';

export function PartTransactions() {
  const token = useToken() || '';
  const branchId = useCurrentBranchId();

  const [pageInfo, setPageInfo] = useState({ page: '1', pageSize: '10' });
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm] = useDebounce(searchTerm, 100);
  const [startDate, setStartDate] = useState<string | undefined>(undefined);
  const [endDate, setEndDate] = useState<string | undefined>(undefined);
  const [originBranch, setOriginBranch] = useState<string | undefined>(
    undefined
  );
  const [targetBranch, setTargetBranch] = useState<string | undefined>(
    undefined
  );

  const {
    data: transactionData,
    isLoading,
    isError,
  } = usePartTransactions(
    token,
    branchId !== undefined ? branchId.toString() : undefined,
    {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      search: debouncedSearchTerm,
      start: startDate,
      finish: endDate,
      originBranch,
      targetBranch,
    }
  );

  if (branchId === undefined) {
    return (
      <div className="p-4 text-center">
        <Title>
          Seleccione una sucursal para ver las transacciones de repuestos
        </Title>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <Title>Error al cargar las transacciones de repuestos</Title>
      </div>
    );
  }

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Transacciones de Repuestos
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Transacciones de Repuestos.
        </p>
      </div>

      <div className="flex justify-end m-2 gap-2 items-center">
        <section className="flex justify-between">
          <Link href={TRANSACTIONS_BRANCH_SALE_TAB('repuestos')}>
            <Button>Nueva transferencia</Button>
          </Link>
        </section>
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar por SKU, producto o cliente..."
          className="px-3 py-2 border rounded-md"
        />
        <FilterDate
          onChange={(start, end) => {
            setStartDate(start);
            setEndDate(end);
            setPageInfo((prev) => ({ ...prev, page: '1' }));
          }}
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
        paginatedPayments={transactionData}
        isLoading={isLoading}
        onPageChange={(page) =>
          setPageInfo((prev) => ({ ...prev, page: String(page) }))
        }
      />
    </section>
  );
}
