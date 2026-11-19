'use client';

/**
 * Configuración de optimización para React Query
 * Define configuraciones específicas para diferentes tipos de queries
 */

// Tipos de configuración disponibles
export type QueryConfigType =
  | 'CAROUSEL_IMAGES'
  | 'FEATURED_CAROUSEL'
  | 'PRODUCTS'
  | 'USERS'
  | 'TRANSACTIONS'
  | 'INVENTORY'
  | 'BRANCHES'
  | 'DEFAULT';

// Configuraciones específicas para cada tipo de query
const queryConfigurations = {
  CAROUSEL_IMAGES: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
  FEATURED_CAROUSEL: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 3,
  },
  PRODUCTS: {
    staleTime: 2 * 60 * 1000, // 2 minutos
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 2,
  },
  USERS: {
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000, // 10 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  },
  TRANSACTIONS: {
    staleTime: 1 * 60 * 1000, // 1 minuto
    cacheTime: 3 * 60 * 1000, // 3 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
  },
  INVENTORY: {
    staleTime: 30 * 1000, // 30 segundos
    cacheTime: 2 * 60 * 1000, // 2 minutos
    /**
     * Sin refetch al volver a la ventana: los inventarios son tablas grandes y
     * paginadas, y volver a pedirlas cada vez que el usuario vuelve a la
     * pestaña son llamadas al backend que nadie pidió. El `staleTime` ya cubre
     * el refresco al navegar, y siempre queda el `refetch` manual.
     */
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    retry: 2,
  },
  /**
   * Listado de sucursales: cambia muy de vez en cuando y alimenta selects en
   * media aplicación, así que se cachea largo y no se vuelve a pedir al
   * enfocar la ventana.
   */
  BRANCHES: {
    staleTime: 10 * 60 * 1000, // 10 minutos
    cacheTime: 15 * 60 * 1000, // 15 minutos
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: 2,
  },
  DEFAULT: {
    staleTime: 0,
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  },
};

/**
 * Aplica la configuración de optimización específica para un tipo de query
 * @param configType Tipo de configuración a aplicar
 * @returns Objeto de configuración para React Query
 */
export function applyQueryConfig(configType: QueryConfigType = 'DEFAULT') {
  return queryConfigurations[configType] || queryConfigurations.DEFAULT;
}

/**
 * Configuración global por defecto para React Query
 */
export const defaultQueryConfig = {
  queries: {
    staleTime: 0,
    cacheTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 1,
  },
  mutations: {
    retry: 0,
  },
};

/**
 * Configuración específica para el optimizador de datos del carousel
 */
export const carouselDataOptimizerConfig = {
  prefetchDelay: 100, // ms
  maxRetries: 3,
  retryDelay: 1000, // ms
  enableDeviceFiltering: true,
  enableImagePreloading: true,
};
