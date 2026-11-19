import {
  BranchSaleTab,
  BranchSaleTransactions,
} from '@/components/transactions/branchSaleTransactions.component';

interface BranchSaleTransactionsPageProps {
  searchParams: { tab?: string };
}

/** Venta por sucursal (transferencias). `?tab=repuestos` abre en repuestos. */
export default function BranchSaleTransactionsPage({
  searchParams,
}: BranchSaleTransactionsPageProps) {
  const initialTab: BranchSaleTab =
    searchParams.tab === 'repuestos' ? 'repuestos' : 'motos';
  return <BranchSaleTransactions initialTab={initialTab} />;
}
