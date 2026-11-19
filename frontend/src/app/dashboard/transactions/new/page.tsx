import { redirect } from 'next/navigation';

import { TRANSACTIONS_BRANCH_SALE } from '@/constants/routes';

interface NewTransactionPageProps {
  searchParams: { category?: string };
}

/**
 * Crear transacciones ya no pasa por el formulario viejo: las transferencias
 * entre sucursales se hacen en el módulo de venta por sucursal, y las compras
 * y ventas en sus propios módulos (Compras, Órdenes). Esta ruta queda solo
 * para enlaces guardados y redirige; el formulario viejo se sigue usando para
 * editar (`/dashboard/transactions/edit`).
 */
export default function NewTransactionPage({
  searchParams,
}: NewTransactionPageProps) {
  const tab = searchParams.category === 'spare_parts' ? 'repuestos' : 'motos';
  redirect(`${TRANSACTIONS_BRANCH_SALE}?tab=${tab}`);
}
