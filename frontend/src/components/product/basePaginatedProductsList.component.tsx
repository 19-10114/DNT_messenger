'use client';

import { ProductsList } from './products.component';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductsService } from '@/services/products/products.service';
import { Button } from '../ui/button.component';
import { Title } from '../typography/title.component';
import { useToken } from '@/stores/auth/auth.store';
import { SearchInput } from '../ui/searchInput.component';

export type PageInfo = { page: string; pageSize: string; search: string };
export type ProductType = 'bikes' | 'parts';

const productsService = new ProductsService();

interface BasePaginatedProductsListProps {
  productType: ProductType;
}

export function BasePaginatedProductsList({
  productType,
}: BasePaginatedProductsListProps) {
  const token = useToken() || '';
  const [pageInfo, setPageInfo] = useState({
    page: '1',
    pageSize: '20',
    search: '',
  });

  const productsQuery = useQuery({
    queryKey: [
      productType === 'bikes' ? 'allBikes' : 'allParts',
      token,
      pageInfo,
    ],
    queryFn: async () => {
      if (productType === 'bikes') {
        return productsService.getAllBikes(token, pageInfo);
      } else {
        return productsService.getAllParts(token, pageInfo);
      }
    },
  });

  const disabledPrevButton = Number.parseInt(pageInfo.page) === 1;
  const disabledNextButton =
    productsQuery.data &&
    Number.parseInt(pageInfo.page) === productsQuery.data.data.totalPages;

  const handleOnPreviousPage = () => {
    if (disabledPrevButton) return;

    setPageInfo((oldValue) => ({
      ...oldValue,
      page: `${Number.parseInt(oldValue.page) - 1}`,
    }));
  };

  const handleOnNextPage = () => {
    if (disabledNextButton) return;

    setPageInfo((oldValue) => ({
      ...oldValue,
      page: `${Number.parseInt(oldValue.page) + 1}`,
    }));
  };

  const handleSearch = (searchTerm: string) => {
    setPageInfo((oldValue) => ({
      ...oldValue,
      search: searchTerm,
      page: '1', // Reset to first page when searching
    }));
  };

  const handlePageChange = (page: number) => {
    setPageInfo((oldValue) => ({
      ...oldValue,
      page: page.toString(),
    }));
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    if (!adaptedData) return [];

    const totalPages = adaptedData.totalPages;
    const currentPage = Number.parseInt(pageInfo.page);
    const pages = [];

    // Show up to 5 page numbers
    const maxPages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(totalPages, startPage + maxPages - 1);

    // Adjust start page if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  // Adaptar la respuesta al formato esperado por ProductsList
  const adaptedData = productsQuery.data
    ? {
        currentPage: productsQuery.data.data.currentPage,
        pageSize: productsQuery.data.data.pageSize,
        totalElements: productsQuery.data.data.totalElements,
        totalPages: productsQuery.data.data.totalPages,
        results: Array.isArray(productsQuery.data.data.results)
          ? productsQuery.data.data.results.map((item: any) => ({
              ...item,
              profileImage:
                'https://www.mototransformerempirekeeway.com/wp-content/uploads/2021/09/arsen-II-motos-transformer.jpg',
              leasePrice: item.leasePrice || 0,
              initialFee: item.initialFee || 0,
              cashPrice: item.cashPrice || 0,
              stock: item.stock || 0,
              description: item.description || '',
              leaseOptions: item.leaseOptions || {},
              images: item.images || [],
              isFeatured: false,
            }))
          : [],
      }
    : undefined;

  return (
    <>
      {/* Search Input */}
      <div className="mb-6">
        <SearchInput
          placeholder={`Buscar ${productType === 'bikes' ? 'motos' : 'repuestos'} por nombre, marca, modelo, SKU...`}
          onSearch={handleSearch}
          initialValue={pageInfo.search}
          className="max-w-md"
        />
      </div>

      {productsQuery.isLoading && <Title>Cargando productos...</Title>}

      {!productsQuery.isLoading && !!adaptedData && (
        <ProductsList paginatedProducts={adaptedData} />
      )}

      {!productsQuery.isLoading &&
        !!adaptedData &&
        adaptedData.totalPages > 1 && (
          <section className="mx-auto flex justify-center items-center space-x-2 mt-16">
            <Button
              disabled={disabledPrevButton}
              onClick={handleOnPreviousPage}
              variant="outline"
              size="sm"
            >
              Anterior
            </Button>

            {generatePageNumbers().map((pageNum) => (
              <Button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                variant={
                  Number.parseInt(pageInfo.page) === pageNum
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            ))}

            <Button
              disabled={disabledNextButton}
              onClick={handleOnNextPage}
              variant="outline"
              size="sm"
            >
              Siguiente
            </Button>

            <span className="text-sm text-gray-600 ml-4">
              Página {adaptedData.currentPage} de {adaptedData.totalPages}(
              {adaptedData.totalElements}{' '}
              {productType === 'bikes' ? 'motos' : 'repuestos'})
            </span>
          </section>
        )}
    </>
  );
}
