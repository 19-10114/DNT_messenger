import React from 'react';

import { GpsAccessGuard } from '@/components/gps/gpsAccessGuard.component';
import { GpsSectionNav } from '@/components/gps/gpsSectionNav.component';

export default function GpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <GpsAccessGuard>
      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="border-l-4 border-primary pl-4">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            GPS
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Seguimiento del parque de unidades GPS y su historial.
          </p>
        </div>
        <GpsSectionNav />
      </section>
      {children}
    </GpsAccessGuard>
  );
}
