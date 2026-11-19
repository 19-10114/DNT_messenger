'use client';
import { useState } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { useCurrentBranchId } from '@/stores/branch/branch.store';
import { useServiceTransactions } from '@/hooks/useTransactions';
import { TransactionList } from '../tables/transactionsTable.component';
import { Title } from '../typography/title.component';
import { useDebounce } from 'use-debounce';
import { BranchOriginTargetFilters } from './branchOriginTargetFilters.component';

export function ServiceTransactions() {
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

  const {
    data: transactionData,
    isLoading,
    isError,
  } = useServiceTransactions(
    token,
    branchId !== undefined ? branchId.toString() : undefined,
    {
      page: pageInfo.page,
      pageSize: pageInfo.pageSize,
      search: debouncedSearchTerm,
      originBranch,
      targetBranch,
    }
  );

  if (branchId === undefined) {
    return (
      <div className="p-4 text-center">
        <Title>
          Seleccione una sucursal para ver las transacciones de servicios
        </Title>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 text-center">
        <Title>Error al cargar las transacciones de servicios</Title>
      </div>
    );
  }

  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Transacciones de Servicios
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Transacciones de Servicios.
        </p>
      </div>

      <div className="flex justify-end m-2 gap-2 items-center">
        <input
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar transacción de servicio..."
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
        paginatedPayments={transactionData}
        isLoading={isLoading}
        onPageChange={(page) =>
          setPageInfo((prev) => ({ ...prev, page: String(page) }))
        }
      />
    </section>
  );
}
