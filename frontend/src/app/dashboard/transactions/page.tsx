'use client';
import { Button } from '@/components/ui/button.component';
import { Title } from '@/components/typography/title.component';
import Link from 'next/link';
import {
  TRANSACTIONS_BIKES,
  TRANSACTIONS_BRANCH_SALE,
  TRANSACTIONS_PARTS,
} from '@/constants/routes';

export type PageInfo = { page: string; pageSize: string };

export default function TransactionPage() {
  return (
    <section className="p-6">
      <div className="text-center mb-8">
        <Title>Seleccione el tipo de transacciones</Title>
        <p className="text-gray-600 mt-2">
          Elija entre transacciones de motos o repuestos para ver los datos
          específicos
        </p>
      </div>

      <div className="flex justify-center gap-6">
        <Link href={TRANSACTIONS_BIKES}>
          <Button className="px-8 py-4 text-lg">Transacciones de Motos</Button>
        </Link>

        <Link href={TRANSACTIONS_PARTS}>
          <Button className="px-8 py-4 text-lg">
            Transacciones de Repuestos
          </Button>
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <Link href={TRANSACTIONS_BRANCH_SALE}>
          <Button variant="outline" className="px-8 py-4 text-lg">
            Nueva transferencia entre sucursales
          </Button>
        </Link>
      </div>
    </section>
  );
}
