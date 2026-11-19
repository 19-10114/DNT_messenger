'use client';

import React from 'react';

import { Title } from '@/components/typography/title.component';
import { UsedBikeDetailView } from '@/components/usedBikes/usedBikeDetailView.component';
import { useRoles } from '@/stores/auth/auth.store';

interface UsedBikeDetailPageProps {
  params: { id: string };
}

/**
 * Ficha de una moto usada por id. Se llega desde el inventario de motos, no
 * desde el listado del módulo.
 *
 * El gate de rol se repite acá y no solo en la etiqueta que trae hasta aquí:
 * el middleware únicamente valida el token, así que sin esto la URL directa
 * quedaría abierta.
 */
export default function UsedBikeDetailPage({
  params,
}: UsedBikeDetailPageProps) {
  const roles = useRoles();

  if (!roles.includes('admin')) return null;

  return (
    <>
      <section className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <Title>Moto Usada</Title>
      </section>
      <UsedBikeDetailView usedBikeId={Number(params.id)} />
    </>
  );
}
