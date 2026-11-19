import { Suspense } from 'react';
import { OrderPayment } from '@/components/orders/payment.component';

export default function OrderPaymentPage() {
  return (
    <Suspense fallback={<div className="py-4">Cargando...</div>}>
      <OrderPayment />
    </Suspense>
  );
}
