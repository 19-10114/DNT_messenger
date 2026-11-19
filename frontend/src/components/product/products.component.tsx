'use client';
import { useState } from 'react';
import { ProductCard } from './productCard.component';
import { Pagination } from '@/models/pagination.model';
import { ProductModel } from '@/models/product.model';
import { ProductDetailsModal } from '@/components/modals/productDetailsModal.component';

interface ProductsListProps {
  paginatedProducts: Pagination<ProductModel>;
}

export function ProductsList({ paginatedProducts }: ProductsListProps) {
  const { results: products } = paginatedProducts;
  const [selectedProduct, setSelectedProduct] = useState<ProductModel | null>(
    null
  );

  return (
    <div className="py-3">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {products.map((product) => (
          <ProductCard
            product={product}
            key={product.id}
            onClick={setSelectedProduct}
          />
        ))}
      </div>

      <ProductDetailsModal
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        product={selectedProduct}
      />
    </div>
  );
}
