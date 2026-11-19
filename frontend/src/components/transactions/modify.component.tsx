'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';
import { TransactionForm } from '@/components/forms/transactionForm.component';
import { useToken } from '@/stores/auth/auth.store';
import { TransactionService } from '@/services/transactions/transactions.service';
import { TransactionDataResult } from '@/services/transactions/types/GetAllTransactions';

export function ModifyTransaction() {
  const [transaction, setTransaction] = useState<TransactionDataResult | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const token = useToken();
  const transactionId = searchParams.get('id');
  const transactionService = useMemo(() => new TransactionService(), []);

  useEffect(() => {
    const fetchTransaction = async () => {
      if (!transactionId || !token) {
        setError('ID de transacción no proporcionado o usuario no autenticado');
        setLoading(false);
        return;
      }

      try {
        // Obtener los detalles de la transacción por ID
        const response = await transactionService.getTransactionById(
          token,
          transactionId
        );
        setTransaction(response);
        setLoading(false);
      } catch (err) {
        console.error('Error al obtener la transacción:', err);
        setError('Error al cargar los datos de la transacción');
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, token, transactionService]);

  if (loading)
    return (
      <div className="container py-8">Cargando datos de la transacción...</div>
    );
  if (error) return <div className="container py-8 text-red-500">{error}</div>;
  if (!transaction)
    return <div className="container py-8">No se encontró la transacción</div>;

  return (
    <section className="container bg-background w-full min-h-screen flex items-center justify-center flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Editar transacción</CardTitle>
          <CardDescription>
            Modifica la información de la transacción #{transaction.id}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <TransactionForm transactionToEdit={transaction} isEditing={true} />
        </CardContent>
      </Card>
    </section>
  );
}
