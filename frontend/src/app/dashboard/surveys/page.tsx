'use client';

import React from 'react';

import { SurveysManagement } from '@/components/surveys/surveysManagement.component';
import { Title } from '@/components/typography/title.component';
import { useRoles } from '@/stores/auth/auth.store';

export default function SurveysPage() {
  const roles = useRoles();
  const hasAccess = roles.includes('admin');

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <h1 className="text-2xl font-bold mb-4">Acceso denegado</h1>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta página.
        </p>
      </div>
    );
  }
  return (
    <>
      <section className="flex flex-col md:flex-row md:justify-between gap-4 mb-6">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Encuestas
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Visualización, Gestión y Administración de Encuestas/Formularios.
          </p>
        </div>
      </section>
      <SurveysManagement />
    </>
  );
}
