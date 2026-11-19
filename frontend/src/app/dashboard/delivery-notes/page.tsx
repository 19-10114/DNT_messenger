'use client';
import { DeliveryNotesTable } from '@/components/deliveryNotes/deliveryNotesTable.component';

export default function DeliveryNotesPage() {
  return (
    <section>
      <div className="border-l-4 border-primary pl-4 mb-6">
        <h1 className="text-2xl font-semibold text-primary font-serif">
          Pre Ordenes
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          Visualización, Gestión y Administración de Pre Ordenes
        </p>
      </div>
      <DeliveryNotesTable />
    </section>
  );
}
