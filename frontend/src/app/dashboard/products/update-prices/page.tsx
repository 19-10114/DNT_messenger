'use client';

import React, { useState, useEffect } from 'react';
import {
  useAllBikes,
  useBulkUpdateBikePrices,
  useNoCostProducts,
} from '@/hooks/products';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table.component';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox.component';
import { useSuperuser, useIsStaff } from '@/stores/auth/auth.store';
import { cn } from '@/lib/utils';

interface Prices {
  cost: number;
  epPrice: number;
  dpPrice: number;
  price: number;
  bulkPrice: number;
}

interface ProductWithPrices {
  id: number;
  model: string;
  brand: string;
  prices: Prices;
}

type TabType = 'update-prices' | 'no-cost-products';

export default function UpdatePricesPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabType>('update-prices');
  const allBikes = useAllBikes({ pageSize: '10000' });
  const bulkUpdateBikePrices = useBulkUpdateBikePrices();
  const noCostProducts = useNoCostProducts();

  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<number>>(
    new Set()
  );

  const userIsSuperUser = useSuperuser();
  const isStaff = useIsStaff();

  // Verificar si el usuario es administrador
  const isAdmin = userIsSuperUser === true && isStaff === false;

  // Efecto para productos con precios
  useEffect(() => {
    if (allBikes.data?.results && activeTab === 'update-prices') {
      const editableProducts = allBikes.data.results.map((p: any) => ({
        ...p,
        prices: {
          cost: p.prices?.cost ?? 0,
          epPrice: p.prices?.epPrice ?? 0,
          dpPrice: p.prices?.dpPrice ?? 0,
          price: p.prices?.price ?? 0,
          bulkPrice: p.prices?.bulkPrice ?? 0,
        },
      }));
      setProducts(editableProducts);
    }
  }, [allBikes.data, activeTab]);

  const handlePriceChange = (
    productId: number,
    priceType: keyof Prices,
    value: string
  ) => {
    const updatedProducts = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          prices: {
            ...p.prices,
            [priceType]: parseFloat(value) || 0,
          },
        };
      }
      return p;
    });
    setProducts(updatedProducts);
  };

  const handleSelectProduct = (productId: number) => {
    const newSelectedProducts = new Set(selectedProducts);
    if (newSelectedProducts.has(productId)) {
      newSelectedProducts.delete(productId);
    } else {
      newSelectedProducts.add(productId);
    }
    setSelectedProducts(newSelectedProducts);
  };

  const isAllSelected =
    products.length > 0 && selectedProducts.size === products.length;
  const isSomeSelected =
    selectedProducts.size > 0 && selectedProducts.size < products.length;

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    // When indeterminate (some selected but not all), always select all when clicked
    if (isSomeSelected || checked === 'indeterminate') {
      setSelectedProducts(new Set(products.map((p) => p.id)));
      return;
    }

    // Normal toggle behavior based on checked state
    if (checked === true) {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSubmit = async () => {
    const productsToUpdate = products
      .filter((p) => selectedProducts.has(p.id))
      .map((p) => ({
        product: p.id,
        cost: p.prices.cost,
        ep_price: p.prices.epPrice,
        dp_price: p.prices.dpPrice,
        price: p.prices.price,
        bulk_price: p.prices.bulkPrice,
      }));

    if (productsToUpdate.length === 0) {
      toast({
        title: 'No hay productos seleccionados',
        description:
          'Por favor, seleccione al menos un producto para actualizar.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await bulkUpdateBikePrices.mutateAsync(productsToUpdate);
      toast({
        title: 'Precios actualizados',
        description:
          'Los precios de los productos seleccionados han sido actualizados.',
      });
      setSelectedProducts(new Set());
      allBikes.refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Hubo un error al actualizar los precios.',
        variant: 'destructive',
      });
    }
  };

  if (!isAdmin) {
    return <div> No tienes permisos para acceder a esta página </div>;
  }

  // Renderizar tabla de productos sin costo
  const renderNoCostProductsTable = () => {
    if (noCostProducts.isLoading) {
      return (
        <div className="py-10 text-center">Cargando productos sin costo...</div>
      );
    }

    if (noCostProducts.isError) {
      return (
        <div className="py-10 text-center text-red-600">
          Error al cargar los productos sin costo.
        </div>
      );
    }

    const noCostData = noCostProducts.data?.results || [];

    if (noCostData.length === 0) {
      return (
        <div className="py-10 text-center">
          No hay productos sin costo registrados.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Modelo</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>MFB</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {noCostData.map((product) => (
            <TableRow key={product.id}>
              <TableCell>{product.id}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.model}</TableCell>
              <TableCell>{product.brand}</TableCell>
              <TableCell>{product.category}</TableCell>
              <TableCell>
                {product.mfb ? (
                  <span className="text-blue-600">Sí</span>
                ) : (
                  <span className="text-gray-500">No</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Renderizar tabla de actualización de precios
  const renderUpdatePricesTable = () => {
    if (allBikes.isLoading) {
      return <div className="py-10 text-center">Cargando productos...</div>;
    }

    if (allBikes.isError) {
      return (
        <div className="py-10 text-center text-red-600">
          Error al cargar los productos.
        </div>
      );
    }

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Checkbox
                  checked={isAllSelected}
                  indeterminate={isSomeSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Seleccionar todos"
                />
              </TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Costo</TableHead>
              <TableHead>Panita</TableHead>
              <TableHead>Dale Play</TableHead>
              <TableHead>Regular</TableHead>
              <TableHead>Al mayor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                  />
                </TableCell>
                <TableCell>{product.model}</TableCell>
                <TableCell>{product.brand}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={product.prices.cost}
                    onChange={(e) =>
                      handlePriceChange(product.id, 'cost', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={product.prices.epPrice}
                    onChange={(e) =>
                      handlePriceChange(product.id, 'epPrice', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={product.prices.dpPrice}
                    onChange={(e) =>
                      handlePriceChange(product.id, 'dpPrice', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={product.prices.price}
                    onChange={(e) =>
                      handlePriceChange(product.id, 'price', e.target.value)
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={product.prices.bulkPrice}
                    onChange={(e) =>
                      handlePriceChange(product.id, 'bulkPrice', e.target.value)
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4">
          <Button type="submit" disabled={bulkUpdateBikePrices.isLoading}>
            {bulkUpdateBikePrices.isLoading
              ? 'Actualizando...'
              : 'Actualizar Precios Seleccionados'}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="container mx-auto py-10">
      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('update-prices')}
          className={cn(
            'px-8 py-2 text-lg font-medium transition-colors relative',
            activeTab === 'update-prices'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Actualización de Precios
        </button>
        <button
          onClick={() => setActiveTab('no-cost-products')}
          className={cn(
            'px-8 py-2 text-lg font-medium transition-colors relative',
            activeTab === 'no-cost-products'
              ? 'text-black border-b-2 border-black'
              : 'text-gray-500 hover:text-gray-700'
          )}
        >
          Productos Sin Costo
        </button>
      </div>

      {/* Content */}
      <div className="mt-4">
        {activeTab === 'update-prices' && renderUpdatePricesTable()}
        {activeTab === 'no-cost-products' && renderNoCostProductsTable()}
      </div>
    </div>
  );
}
