import React from 'react';

import { ActivityAccessGuard } from '@/components/activity/activityAccessGuard.component';

export default function ActivityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ActivityAccessGuard>
      <section className="mb-6">
        <div className="border-l-4 border-primary pl-4">
          <h1 className="font-serif text-2xl font-semibold text-primary">
            Actividad
          </h1>
          <p className="mt-0.5 text-sm text-gray-400">
            Quién hizo qué y cuándo: motos usadas, preórdenes y órdenes.
          </p>
        </div>
      </section>
      {children}
    </ActivityAccessGuard>
  );
}
