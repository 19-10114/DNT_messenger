'use client';

import { PartsPaginatedList } from '@/components/product/partsPaginatedList.component';
import { Title } from '@/components/typography/title.component';
import { Button } from '@/components/ui/button.component';
import Link from 'next/link';
import { useState } from 'react';
import { UpdatePricesModal } from '@/components/modals/updatePricesModal.component';
import { useAuthStore, useRoles } from '@/stores/auth/auth.store';
import { UploadProductsModal } from '@/components/modals/uploadProductsModal.component';

export default function ProductsPartsPage() {
  const [isUpdatePricesModalOpen, setIsUpdatePricesModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { user } = useAuthStore();
  const roles = useRoles();

  const isAdmin =
    (user?.isSuperuser === true && user?.isStaff === false) ||
    roles.includes('admin');
  const canUpdatePrices = isAdmin || roles.includes('parts_admin');

  return (
    <>
      <section className="flex justify-between">
        <div className="border-l-4 border-primary pl-4 mb-6">
          <h1 className="text-2xl font-semibold text-primary font-serif">
            Repuestos
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Inventario, Gestión y Administración de Repuestos.
          </p>
        </div>
        <div className="flex gap-2">
          {canUpdatePrices && (
            <Button
              variant="outline"
              onClick={() => setIsUpdatePricesModalOpen(true)}
            >
              Actualizar Precios
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Actualizar Costos
            </Button>
          )}
          <Link href="/dashboard/products/parts/new">
            <Button>Crear Repuesto</Button>
          </Link>
        </div>
      </section>

      <PartsPaginatedList />

      <UploadProductsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        productType="part"
      />

      <UpdatePricesModal
        isOpen={isUpdatePricesModalOpen}
        onClose={() => setIsUpdatePricesModalOpen(false)}
      />
    </>
  );
}
