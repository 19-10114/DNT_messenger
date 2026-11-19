'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook para manejar la carga inicial de datos de manera eficiente
 * Evita múltiples peticiones al servidor al cargar la página
 */
export function useInitialDataLoader() {
  const queryClient = useQueryClient();
  const hasLoadedRef = useRef(false);

  /**
   * Función para precargar datos específicos solo si no están en caché
   */
  const prefetchIfNeeded = async (
    queryKey: string[],
    queryFn: () => Promise<any>
  ) => {
    const existingData = queryClient.getQueryData(queryKey);

    // Solo hacer prefetch si no hay datos en caché
    if (!existingData) {
      await queryClient.prefetchQuery({
        queryKey,
        queryFn,
        // Las opciones de caché se configuran globalmente en queryOptimization.config.ts
      });
    }
  };

  /**
   * Función para invalidar caché de manera selectiva
   */
  const invalidateSpecificQueries = (queryKeys: string[][]) => {
    queryKeys.forEach((queryKey) => {
      queryClient.invalidateQueries({ queryKey });
    });
  };

  /**
   * Función para limpiar caché antiguo
   */
  const clearStaleCache = () => {
    queryClient.clear();
  };

  return {
    prefetchIfNeeded,
    invalidateSpecificQueries,
    clearStaleCache,
    hasLoaded: hasLoadedRef.current,
  };
}

/**
 * Hook específico para optimizar la carga de datos del carrusel
 */
export function useCarouselDataOptimizer() {
  const { prefetchIfNeeded } = useInitialDataLoader();
  const hasInitializedRef = useRef(false);

  const optimizeCarouselData = useCallback(async () => {
    if (hasInitializedRef.current) return;

    // Precargar solo los datos esenciales del carrusel
    try {
      // Solo precargar imágenes destacadas si no están en caché
      await prefetchIfNeeded(['featuredCarouselImages'], async () => {
        const { CarouselService } = await import(
          '@/services/carousel/carousel.service'
        );
        const carouselService = new CarouselService();
        return carouselService.getFeaturedCarouselImages(undefined);
      });

      hasInitializedRef.current = true;
    } catch (error) {
      console.warn('Error optimizing carousel data:', error);
    }
  }, [prefetchIfNeeded]);

  useEffect(() => {
    // Usar requestIdleCallback para cargar datos cuando el navegador esté inactivo
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        optimizeCarouselData();
      });
    } else {
      // Fallback para navegadores que no soportan requestIdleCallback
      setTimeout(optimizeCarouselData, 100);
    }
  }, [optimizeCarouselData]);

  return {
    isOptimized: hasInitializedRef.current,
  };
}
