'use client';

import { BikesPaginatedList } from '@/components/product/bikesPaginatedList.component';
import { Title } from '@/components/typography/title.component';
import { Button } from '@/components/ui/button.component';
import Link from 'next/link';
import { useState } from 'react';
import { UploadProductsModal } from '@/components/modals/uploadProductsModal.component';
import { useAuthStore } from '@/stores/auth/auth.store';
import { BIKES_NEW, BIKES_UPDATE_PRICE } from '@/constants/routes';

export default function ProductsBikesPage() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user } = useAuthStore();

  const isAdmin = user?.isSuperuser === true && user?.isStaff === false;

  return (
    <>
      <section className="flex justify-between">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Motos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Inventario, Gestión y Administración de Motos.
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Link href={BIKES_UPDATE_PRICE}>
              <Button variant="outline">Actualizar Precios</Button>
            </Link>
          )}
          <Link href={BIKES_NEW}>
            <Button>Crear Moto</Button>
          </Link>
        </div>
      </section>

      <BikesPaginatedList />

      <UploadProductsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        productType="bike"
      />
    </>
  );
}
