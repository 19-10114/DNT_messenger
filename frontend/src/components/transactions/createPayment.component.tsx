import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.component';

import { PaymentForm } from '@/components/forms/paymentForm.component';

export function CreateTransaction() {
  return (
    <section className="container bg-background w-full min-h-screen flex items-center justify-center flex-col space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Crear un nuevo pago</CardTitle>
          <CardDescription>
            Ingresa la información del pago que deseas crear
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PaymentForm />
        </CardContent>
      </Card>
    </section>
  );
}
