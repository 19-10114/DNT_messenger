'use client';

import React, { useState } from 'react';
import {
  Search,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Package,
  Check,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Cookies from 'js-cookie';
import { useGlobalPartsInventory } from '@/hooks/useCatalogue';
import { ProductImagesService } from '@/services/products/product-images.service';
import { useToken } from '@/stores/auth/auth.store';
import { NO_IMAGE_SRC } from '@/constants/images';

const productImagesService = new ProductImagesService();

const FILTER_CONFIG = {
  modelos: {
    label: 'Modelos',
    options: ['Matrix II', 'EK XPRESS 150', 'EKXPRESS II 150'],
  },
  sedes: {
    label: 'Sedes',
    options: ['Caracas', 'Maturín', 'Guarenas', 'Guayana'],
  },
} as const;

type FilterKey = keyof typeof FILTER_CONFIG;

/**
 * Galería de imágenes visibles de un repuesto. Se monta junto con el modal,
 * así que las imágenes solo se piden al abrir la card.
 * Muestra una en grande y el resto en miniaturas; la que está en grande
 * no aparece repetida abajo.
 */
const PartImageGallery: React.FC<{ productId: number; alt: string }> = ({
  productId,
  alt,
}) => {
  const storeToken = useToken();
  const token = storeToken || Cookies.get('token') || '';
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['partVisibleImages', productId],
    queryFn: () => productImagesService.getVisibleByProduct(productId, token),
    enabled: !!productId,
  });

  const images = data?.data?.results ?? [];

  if (isLoading) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-100 animate-pulse" />
    );
  }

  if (images.length === 0) {
    return (
      <div className="w-full aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
        <img
          src={NO_IMAGE_SRC}
          alt="Sin imagen"
          className="w-20 h-20 opacity-50"
        />
      </div>
    );
  }

  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  const thumbnails = images.filter((image) => image.id !== selected.id);

  return (
    <div className="space-y-3">
      <img
        src={selected.imageUrl}
        alt={alt}
        className="w-full aspect-square rounded-lg border border-gray-100 bg-white object-cover"
      />
      {thumbnails.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {thumbnails.map((image) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedId(image.id)}
              className="h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 hover:border-secondary transition-colors focus:outline-none focus:ring-2 focus:ring-secondary"
              aria-label={`Ver otra imagen de ${alt}`}
            >
              <img
                src={image.imageUrl}
                alt={alt}
                loading="lazy"
                className="h-full w-full bg-white object-contain"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LandingCatalogueParts: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<
    Record<FilterKey, string[]>
  >({
    modelos: [],
    sedes: [],
  });

  const pageSize = 10;

  const { data, isLoading, isError, error, refetch } = useGlobalPartsInventory({
    searchTerm: debouncedSearch,
    page: currentPage.toString(),
    pageSize: pageSize.toString(),
  });

  const results = data?.data?.results || [];
  const totalElements = data?.data?.totalElements || 0;
  const totalPages = data?.data?.totalPages || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setDebouncedSearch(searchTerm);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleOpenModal = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const toggleNavFilter = (key: FilterKey) => {
    setActiveFilter(activeFilter === key ? null : key);
  };

  const toggleFilterOption = (key: FilterKey, option: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [key]: prev[key].includes(option)
        ? prev[key].filter((o) => o !== option)
        : [...prev[key], option],
    }));
  };

  return (
    <>
      <section
        id="parts-catalogue"
        className="w-full max-w-6xl mx-auto mt-10 pt-10 scroll-mt-20 px-8 md:px-6"
        aria-labelledby="catalogue-title"
      >
        <h2
          id="catalogue-title"
          className="text-4xl font-extrabold text-center text-gray-900 mb-8"
        >
          Catálogo de{' '}
          <span className="text-secondary font-extrabold">Repuestos</span>
        </h2>

        {/* Barra de búsqueda */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex gap-1 sm:gap-2 max-w-md mx-auto mb-8 px-2 sm:px-0"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar repuestos..."
            className="flex-1 px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent"
          />
          <button
            type="submit"
            className="bg-secondary text-gray-900 px-4 py-2 rounded-lg hover:bg-secondary/80 transition-colors duration-200 flex items-center gap-1 sm:gap-2 font-medium text-sm sm:text-base"
            title="Buscar repuestos"
          >
            <Search size={18} />
          </button>
        </form>

        {/* Layout principal */}
        <div className="flex gap-4 items-start">
          {/* Navbar vertical izquierda */}
          <div className="relative flex-shrink-0">
            <div className="flex flex-col gap-2">
              {(Object.keys(FILTER_CONFIG) as FilterKey[]).map((key) => {
                const isActive = activeFilter === key;
                const count = selectedFilters[key].length;
                return (
                  <button
                    key={key}
                    onClick={() => toggleNavFilter(key)}
                    className={`relative flex flex-col items-center justify-center gap-1 py-4 px-3 rounded-xl text-xs font-semibold transition-all duration-200 border-2 w-[72px] ${
                      isActive
                        ? 'bg-secondary text-white border-secondary shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-secondary/50 hover:text-secondary'
                    }`}
                  >
                    {count > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                        {count}
                      </span>
                    )}
                    <span className="text-center leading-tight">
                      {FILTER_CONFIG[key].label}
                    </span>
                    {isActive ? (
                      <ChevronLeft size={13} />
                    ) : (
                      <ChevronRight size={13} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Panel de filtros: flotante sobre el grid */}
            {activeFilter && (
              <div className="absolute left-full top-0 ml-2 z-30 w-44 bg-white rounded-xl border-2 border-secondary/30 shadow-xl p-4">
                <h3 className="text-sm font-bold text-gray-800 mb-3 pb-2 border-b border-gray-100">
                  {FILTER_CONFIG[activeFilter].label}
                </h3>
                <div className="flex flex-col gap-2.5">
                  {FILTER_CONFIG[activeFilter].options.map((option) => {
                    const isChecked =
                      selectedFilters[activeFilter].includes(option);
                    return (
                      <label
                        key={option}
                        className="flex items-center gap-2 cursor-pointer group"
                        onClick={() => toggleFilterOption(activeFilter, option)}
                      >
                        <div
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
                            isChecked
                              ? 'bg-secondary border-secondary'
                              : 'border-gray-300 group-hover:border-secondary/60'
                          }`}
                        >
                          {isChecked && (
                            <Check
                              size={10}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span
                          className={`text-xs font-medium transition-colors duration-150 leading-tight ${
                            isChecked
                              ? 'text-secondary'
                              : 'text-gray-600 group-hover:text-gray-900'
                          }`}
                        >
                          {option}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {selectedFilters[activeFilter].length > 0 && (
                  <button
                    onClick={() =>
                      setSelectedFilters((prev) => ({
                        ...prev,
                        [activeFilter]: [],
                      }))
                    }
                    className="mt-3 text-[11px] text-red-400 hover:text-red-600 transition-colors duration-150 w-full text-center"
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Grid de productos */}
          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-secondary" />
                <span className="ml-3 text-gray-600">
                  Cargando repuestos...
                </span>
              </div>
            ) : isError ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error al cargar repuestos
                </h3>
                <p className="text-gray-600 mb-4">
                  {error instanceof Error
                    ? error.message
                    : 'Ha ocurrido un error inesperado'}
                </p>
                <button
                  onClick={() => refetch()}
                  className="flex items-center px-4 py-2 bg-secondary text-gray-900 rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </button>
              </div>
            ) : results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package size={48} className="mb-3 opacity-30" />
                <p className="text-sm">
                  {debouncedSearch
                    ? 'No se encontraron resultados para tu búsqueda.'
                    : 'No hay repuestos disponibles en este momento.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {results.map((item: any) => (
                  <button
                    key={item.productId}
                    onClick={() => handleOpenModal(item)}
                    className="group bg-white rounded-xl border border-gray-200 hover:border-secondary/50 hover:shadow-md transition-all duration-200 p-4 text-left flex flex-col gap-2 h-full"
                  >
                    <p className="text-sm font-semibold text-gray-800 group-hover:text-secondary transition-colors duration-200 line-clamp-2 leading-tight">
                      {item.name}
                    </p>
                    {item.model && (
                      <span className="mt-auto self-start text-[11px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                        {item.model}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Paginación */}
        <div className="flex items-center justify-center gap-5 mt-8">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="bg-secondary text-white p-3 rounded-full shadow-md hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-95"
            aria-label="Página anterior"
          >
            <ChevronLeft size={20} />
          </button>

          <span className="text-sm font-bold text-gray-700 bg-gray-100 px-5 py-2 rounded-full min-w-[90px] text-center">
            {currentPage} / {totalPages}
          </span>

          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-secondary text-white p-3 rounded-full shadow-md hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:shadow-lg active:scale-95"
            aria-label="Página siguiente"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {totalElements > 0 && (
          <p className="text-center text-xs text-gray-400 mt-2">
            Mostrando {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, totalElements)} de {totalElements}{' '}
            repuestos
          </p>
        )}
      </section>

      {/* Modal de sucursales */}
      {isModalOpen && selectedProduct && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-5 border-b border-gray-100 flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Cerrar modal"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
              <h2 className="text-xl font-bold text-gray-900 pr-8">
                {selectedProduct.name}
              </h2>
              {selectedProduct.model && (
                <p className="text-sm text-gray-500 mt-1">
                  Modelo: {selectedProduct.model}
                </p>
              )}
            </div>

            {/* Body: imagen a la izquierda, sucursales a la derecha */}
            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PartImageGallery
                  productId={selectedProduct.productId}
                  alt={selectedProduct.name}
                />

                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-secondary" />
                    Sucursales disponibles
                  </h3>
                  {selectedProduct.branches &&
                  selectedProduct.branches.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProduct.branches.map(
                        (branch: any, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <span className="text-sm text-gray-700">
                              {branch.branchName}
                            </span>
                            <span className="text-xs text-green-600 font-medium">
                              Disponible
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">
                      No hay sucursales disponibles para este producto.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 rounded-b-xl flex-shrink-0">
              <button
                onClick={handleCloseModal}
                className="w-full bg-secondary hover:bg-secondary/80 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default LandingCatalogueParts;
