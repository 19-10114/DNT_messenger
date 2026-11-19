'use client';

import { BasePaginatedProductsList } from '@/components/product/basePaginatedProductsList.component';
import type { ProductType } from '@/components/product/basePaginatedProductsList.component';
import { Button } from '@/components/ui/button.component';
import Link from 'next/link';
import { useState } from 'react';
import { UploadProductsModal } from '@/components/modals/uploadProductsModal.component';
import { UpdatePricesModal } from '@/components/modals/updatePricesModal.component';
import { useAuthStore } from '@/stores/auth/auth.store';
import { BIKES_NEW, BIKES_UPDATE_PRICE } from '@/constants/routes';
import { cn } from '@/lib/utils';

const PRODUCT_TABS: { value: ProductType; label: string }[] = [
  { value: 'bikes', label: 'Motos' },
  { value: 'parts', label: 'Repuestos' },
];

export default function ProductsPage() {
  const [productType, setProductType] = useState<ProductType>('bikes');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUpdatePricesModalOpen, setIsUpdatePricesModalOpen] = useState(false);
  const { user } = useAuthStore();

  const isAdmin = user?.isSuperuser === true && user?.isStaff === false;
  const isBikes = productType === 'bikes';

  return (
    <>
      {/* Selector de tipo de producto */}
      <div className="mb-4 border-b border-gray-200">
        <div className="grid grid-cols-2">
          {PRODUCT_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setProductType(tab.value)}
              className={cn(
                'py-3 px-1 font-bold transition-colors text-center',
                productType === tab.value
                  ? 'text-secondary border-b-2 border-secondary bg-orange-100'
                  : 'text-gray-700 hover:text-gray-900'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <section className="flex justify-end">
        <div className="flex gap-2">
          {isAdmin &&
            (isBikes ? (
              <Link href={BIKES_UPDATE_PRICE}>
                <Button variant="outline">Actualizar Precios</Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsUpdatePricesModalOpen(true)}
              >
                Actualizar Precios
              </Button>
            ))}

          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Subir Productos
            </Button>
          )}

          <Link href={isBikes ? BIKES_NEW : '/dashboard/products/parts/new'}>
            <Button>{isBikes ? 'Crear Moto' : 'Crear Repuesto'}</Button>
          </Link>
        </div>
      </section>

      <BasePaginatedProductsList key={productType} productType={productType} />

      <UploadProductsModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        productType={isBikes ? 'bike' : 'part'}
      />

      <UpdatePricesModal
        isOpen={isUpdatePricesModalOpen}
        onClose={() => setIsUpdatePricesModalOpen(false)}
      />
    </>
  );
}
