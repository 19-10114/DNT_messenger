'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Search,
} from 'lucide-react';
import { usdFormatCurrency } from '@/lib/utils';
import ProductDetailModal from '../modals/ProductDetailModal.component';
import { useCatalogue } from '@/hooks/useCatalogue';
import { NO_IMAGE_SRC } from '@/constants/images';

interface LandingCatalogueProps {
  category?: string;
}

const LandingCatalogue: React.FC<LandingCatalogueProps> = ({
  category = '1',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const {
    emblaRef,
    products,
    isLoading,
    isError,
    error,
    refetch,
    scrollPrev,
    scrollNext,
    clearAutoScroll,
  } = useCatalogue({ category, searchTerm: debouncedSearch });

  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedSearch(searchTerm);
  };

  const handleOpenProductDetail = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const renderProductButton = (product: any) => {
    return (
      <button
        className="mt-2 bg-primary text-white px-4 py-2 rounded-md cursor-pointer hover:transition-transform duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-[#bae208] focus:ring-opacity-50"
        onClick={() => handleOpenProductDetail(product)}
        aria-label={`Ver detalles de ${product.brand} ${product.model}`}
      >
        Ver Detalles
      </button>
    );
  };

  const renderLoadingState = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-foreground"></div>
      <span className="ml-3 text-gray-600">Cargando productos...</span>
    </div>
  );

  const renderErrorState = () => (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Error al cargar productos
      </h3>
      <p className="text-gray-600 mb-4">
        {error instanceof Error
          ? error.message
          : 'Ha ocurrido un error inesperado'}
      </p>
      <button
        onClick={() => refetch()}
        className="flex items-center px-4 py-2 bg-secondary text-gray-900 rounded-md hover:bg-secondary transition-colors duration-200"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Reintentar
      </button>
    </div>
  );

  return (
    <section
      id="bikes-catalogue"
      className="w-full max-w-screen-lg mx-auto mt-10 pt-10 scroll-mt-20 px-4 md:px-0"
      aria-labelledby="catalogue-title"
    >
      <h2
        id="catalogue-title"
        className="text-4xl font-extrabold text-center text-gray-900"
      >
        Variedad de Modelos diseñados para{' '}
        <span className="text-secondary font-extrabold">TU RITMO DE VIDA</span>
      </h2>

      {/* Barra de búsqueda */}
      <div className="mt-8 mb-2 max-w-md mx-auto">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Buscar por modelo o marca..."
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-secondary text-gray-900 px-4 py-2 rounded-md hover:bg-secondary/80 transition-colors duration-200 flex items-center gap-2"
          >
            <Search size={18} />
            Buscar
          </button>
        </form>
      </div>

      {/* Contenido del catálogo */}
      <div className="pt-2">
        {isLoading && renderLoadingState()}
        {isError && renderErrorState()}

        {!isLoading && !isError && products.length > 0 && (
          <>
            {/* Carrusel del catálogo */}
            <div
              ref={emblaRef}
              className="overflow-hidden"
              role="region"
              aria-label="Catálogo de productos"
            >
              <div className="flex">
                {products.map((product: any, index: number) => (
                  <div
                    key={`${product.id}-${index}`}
                    className="min-w-full md:min-w-[33.33%] p-3"
                  >
                    <article className="p-4 shadow-lg hover:transition-transform duration-300 ease-in-out hover:scale-105 bg-white rounded-md group h-full flex flex-col">
                      <div className="relative overflow-hidden rounded-md">
                        <img
                          src={product.imageUrl || NO_IMAGE_SRC}
                          alt={`${product.brand} ${product.model}`}
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = NO_IMAGE_SRC;
                          }}
                          className={`h-48 w-full rounded-md ${
                            product.imageUrl
                              ? 'object-cover'
                              : 'object-contain bg-gray-100 p-6 opacity-50'
                          }`}
                        />
                      </div>

                      <div className="flex flex-col items-center text-center mt-4 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 min-h-[3.5rem] line-clamp-2">
                          {product.brand} {product.model}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                          Disponible en {product.branches?.length || 0}{' '}
                          sucursal(es)
                        </p>
                        <div className="mt-auto">
                          {renderProductButton(product)}
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            </div>

            {/* Controles de navegación */}
            <div className="relative hidden md:flex mt-6">
              <button
                onClick={() => {
                  clearAutoScroll();
                  scrollPrev();
                }}
                className="absolute left-0 -top-32 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white cursor-pointer z-10 -ml-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#bae208] focus:ring-opacity-50"
                aria-label="Producto anterior"
              >
                <ArrowLeft size={24} />
              </button>

              <button
                onClick={() => {
                  clearAutoScroll();
                  scrollNext();
                }}
                className="absolute right-0 -top-32 -translate-y-1/2 bg-black/50 hover:bg-black/70 p-3 rounded-full text-white cursor-pointer z-10 -mr-6 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#bae208] focus:ring-opacity-50"
                aria-label="Siguiente producto"
              >
                <ArrowRight size={24} />
              </button>
            </div>
          </>
        )}

        {!isLoading && !isError && products.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <p className="text-gray-600 text-lg">
              {searchTerm
                ? 'No se encontraron productos que coincidan con tu búsqueda.'
                : 'No hay productos disponibles en este momento.'}
            </p>
          </div>
        )}
      </div>

      <ProductDetailModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </section>
  );
};

export default LandingCatalogue;
