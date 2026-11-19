'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';

import { OrderForm } from '@/components/forms/orderForm.component';
import { useSearchParams } from 'next/navigation';

export function CreateOrder() {
  const searchParams = useSearchParams();
  const isPreOrden = searchParams.get('is-pre-orden') === 'true';

  return (
    <section className="container bg-background w-full min-h-screen flex items-center justify-center flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crea una nueva orden</CardTitle>
          <CardDescription>
            Ingresa la información de la orden que deseas crear
          </CardDescription>
        </CardHeader>

        <CardContent>
          <OrderForm isPreOrden={isPreOrden} />
        </CardContent>
      </Card>
    </section>
  );
}
