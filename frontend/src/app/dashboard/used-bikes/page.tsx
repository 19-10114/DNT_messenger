'use client';

import React from 'react';

import { Title } from '@/components/typography/title.component';
import { UsedBikesManagement } from '@/components/usedBikes/usedBikesManagement.component';
import { useRoles } from '@/stores/auth/auth.store';

export default function UsedBikesPage() {
  const roles = useRoles();
  const allowedRoles = ['admin', 'manager', 'seller', 'administrator'];

  if (!allowedRoles.some((role) => roles.includes(role))) {
    return null;
  }

  return (
    <>
      <section className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Motos Usadas
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Flujo de motos usadas, desde la recepción hasta la venta, incluyendo
            la gestión de reparaciones y mantenimientos.
          </p>
        </div>
      </section>
      <UsedBikesManagement />
    </>
  );
}
