'use client';

import { useCallback, useEffect, useRef, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import type { CatalogueConfig } from '@/types/carousel.types';
import { ProductsService } from '@/services/products/products.service';
import { ProductImagesService } from '@/services/products/product-images.service';
import { useToken } from '@/stores/auth/auth.store';
import { applyQueryConfig } from '@/config/queryOptimization.config';
import { LANDING_HIDDEN_BRANCH_IDS } from '@/constants/locations';
import Cookies from 'js-cookie';

const productsService = new ProductsService();
const productImagesService = new ProductImagesService();

const DEFAULT_CONFIG: CatalogueConfig = {
  autoScrollInterval: 5000,
  itemsPerView: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
  loop: true,
};

interface UseCatalogueProps {
  category?: string;
  config?: Partial<CatalogueConfig>;
  searchTerm?: string;
}

export function useCatalogue({
  category = '1',
  config = {},
  searchTerm = '',
}: UseCatalogueProps) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const storeToken = useToken();
  const cookieToken = Cookies.get('token');
  const token = storeToken || cookieToken || '';

  // Siempre usar branchId = 0 para el landing
  const branchIdString = '0';

  const [emblaRef, embla] = useEmblaCarousel({
    loop: finalConfig.loop,
    align: 'start',
    slidesToScroll: 1,
    breakpoints: {
      '(min-width: 768px)': {
        slidesToScroll: finalConfig.itemsPerView.tablet,
      },
      '(min-width: 1024px)': {
        slidesToScroll: finalConfig.itemsPerView.desktop,
      },
    },
  });

  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['catalogueProducts', category, branchIdString, searchTerm],
    queryFn: async () => {
      const response = await productsService.getGeneralBikeInventory(
        token,
        branchIdString,
        {
          page: '1',
          pageSize: '100',
          search: searchTerm,
          origin: 'landing',
        }
      );

      return response;
    },
    ...applyQueryConfig('PRODUCTS'),
  });

  const baseProducts = useMemo(() => {
    if (!responseData?.data?.results) return [];

    const allModels = [];
    for (const branch of responseData.data.results) {
      if (LANDING_HIDDEN_BRANCH_IDS.includes(Number(branch.branchId))) continue;
      if (branch.models) {
        for (const model of branch.models) {
          if (model.totalQuantity === true) {
            allModels.push({
              id: model.id,
              model: model.model,
              brand: model.brand,
              colors: model.colors,
              totalQuantity: model.totalQuantity,
              description: `${model.brand} ${model.model} - Motocicleta de alta calidad disponible en múltiples colores.`,
              branches: [
                {
                  branchId: branch.branchId,
                  branchName: branch.branchName,
                  colors: model.colors,
                  quantity: model.totalQuantity,
                },
              ],
            });
          }
        }
      }
    }

    const uniqueModels = new Map();
    for (const model of allModels) {
      if (uniqueModels.has(model.id)) {
        const existing = uniqueModels.get(model.id);
        existing.branches.push(...model.branches);
      } else {
        uniqueModels.set(model.id, model);
      }
    }

    return Array.from(uniqueModels.values());
  }, [responseData]);

  // Ids de todos los modelos para pedir sus imágenes en un solo request
  const productIds = useMemo(
    () => baseProducts.map((product) => product.id),
    [baseProducts]
  );

  const { data: imagesData } = useQuery({
    queryKey: ['catalogueProductImages', productIds],
    queryFn: () => productImagesService.getImagesByIdSet(productIds, token),
    enabled: productIds.length > 0,
    ...applyQueryConfig('PRODUCTS'),
  });

  // Mapa de productId -> lista de imágenes (la destacada primero)
  const imagesByProductId = useMemo(() => {
    const map = new Map<number, string[]>();

    for (const entry of imagesData?.data ?? []) {
      const urls: string[] = [];

      for (const image of entry.images ?? []) {
        if (!image?.imageUrl) continue;
        // La destacada se coloca al inicio para que sea la principal
        if (image.isFeatured) {
          urls.unshift(image.imageUrl);
        } else {
          urls.push(image.imageUrl);
        }
      }

      map.set(entry.id, urls);
    }

    return map;
  }, [imagesData]);

  const products = useMemo(
    () =>
      baseProducts.map((product) => {
        const images = imagesByProductId.get(product.id) ?? [];
        return {
          ...product,
          images,
          imageUrl: images[0] ?? null,
        };
      }),
    [baseProducts, imagesByProductId]
  );

  const clearAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startAutoScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      clearAutoScroll();
      intervalRef.current = setInterval(() => {
        if (emblaApi && emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        } else if (emblaApi && finalConfig.loop) {
          emblaApi.scrollTo(0);
        }
      }, finalConfig.autoScrollInterval);
    },
    [clearAutoScroll, finalConfig.autoScrollInterval, finalConfig.loop]
  );

  const onSelect = useCallback(
    (emblaApi: EmblaCarouselType) => {
      startAutoScroll(emblaApi);
    },
    [startAutoScroll]
  );

  const scrollPrev = useCallback(() => {
    embla?.scrollPrev();
    clearAutoScroll();
  }, [embla, clearAutoScroll]);

  const scrollNext = useCallback(() => {
    embla?.scrollNext();
    clearAutoScroll();
  }, [embla, clearAutoScroll]);

  const scrollTo = useCallback(
    (index: number) => {
      embla?.scrollTo(index);
      clearAutoScroll();
    },
    [embla, clearAutoScroll]
  );

  useEffect(() => {
    if (!embla) return;

    startAutoScroll(embla);
    embla.on('select', onSelect);
    embla.on('pointerDown', clearAutoScroll);

    return () => {
      clearAutoScroll();
      embla.off('select', onSelect);
      embla.off('pointerDown', clearAutoScroll);
    };
  }, [embla, onSelect, startAutoScroll, clearAutoScroll]);

  useEffect(() => {
    return () => {
      clearAutoScroll();
    };
  }, [clearAutoScroll]);

  return {
    emblaRef,
    embla,
    products,
    isLoading,
    isError,
    error,
    refetch,
    scrollPrev,
    scrollNext,
    scrollTo,
    clearAutoScroll,
    config: finalConfig,
  };
}

// Hook para inventario global de partes
export function useGlobalPartsInventory({
  searchTerm = '',
  page = '1',
  pageSize = '20',
}: {
  searchTerm?: string;
  page?: string;
  pageSize?: string;
} = {}) {
  const storeToken = useToken();
  const cookieToken = Cookies.get('token');
  const token = storeToken || cookieToken || '';

  const {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['globalPartsInventory', searchTerm, page, pageSize],
    queryFn: async () => {
      const response = await productsService.getGlobalPartInventory(token, {
        page,
        pageSize,
        search: searchTerm,
        origin: 'landing',
      });

      // Transformar los datos para agregar "Lubricante" al nombre si el SKU lo contiene
      // y quitar las sucursales ocultas en el landing (y los repuestos que solo están ahí)
      if (response?.data?.results) {
        response.data.results = response.data.results
          .map((item: any) => ({
            ...item,
            name: item.sku?.toLowerCase().includes('lubricante')
              ? `Lubricante ${item.name}`
              : item.name,
            branches: (item.branches ?? []).filter(
              (branch: any) =>
                !LANDING_HIDDEN_BRANCH_IDS.includes(Number(branch.branchId))
            ),
          }))
          .filter((item: any) => item.branches.length > 0);
      }

      return response;
    },
    enabled: true,
    ...applyQueryConfig('PRODUCTS'),
  });

  return {
    data: responseData,
    isLoading,
    isError,
    error,
    refetch,
  };
}
