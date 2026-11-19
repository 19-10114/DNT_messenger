import React from 'react';

import { BikeRequestsAccessGuard } from '@/components/bikeRequests/bikeRequestsAccessGuard.component';
import { BikeRequestsSectionNav } from '@/components/bikeRequests/bikeRequestsSectionNav.component';

export default function ArrancaRequestsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BikeRequestsAccessGuard>
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="border-l-4 border-primary pl-4">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Solicitudes Arranca
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Motos que Arranca pide a Moto Candela y su despacho.
          </p>
        </div>
        <BikeRequestsSectionNav />
      </section>
      {children}
    </BikeRequestsAccessGuard>
  );
}
