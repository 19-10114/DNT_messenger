'use client';

import { useState } from 'react';
import {
  Card,
  CardTitle,
  CardContent,
  CardFooter,
  CardDescription,
} from '@/components/ui/card.component';
import { ProductModel } from '@/models/product.model';

interface ProductCardProps {
  product: ProductModel;
  onClick?: (product: ProductModel) => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  // Se muestra la primera imagen del producto; si falla o no hay, un placeholder.
  const imageUrl = product.images?.[0];
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!imageUrl && !imageFailed;

  return (
    <Card
      onClick={() => onClick?.(product)}
      className="w-full hover:bg-muted hover:text-white transition-all group cursor-pointer bg-gray-100"
    >
      <CardContent className="p-0">
        <div className="flex h-32 items-center justify-center overflow-hidden rounded-t-lg bg-white">
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.name}
              onError={() => setImageFailed(true)}
              className="h-full w-full object-contain"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src="/icons/no-image.svg"
              alt="Sin imagen"
              className="h-12 w-12 opacity-40"
            />
          )}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start space-y-1 p-4">
        <CardTitle className="text-sm leading-tight break-words">
          {product.name}
        </CardTitle>
        <CardDescription className="text-xs break-words">
          {product.brand} - {product.sku}
          {product.category === 2 && (
            <span className="block">Modelo: {product.model}</span>
          )}
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
