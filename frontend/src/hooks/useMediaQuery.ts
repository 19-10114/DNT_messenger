'use client';

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para detectar media queries
 * @param query - La media query a evaluar (ej: '(max-width: 768px)')
 * @returns boolean - true si la media query coincide
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Establecer el valor inicial
    setMatches(mediaQuery.matches);

    // Función para manejar cambios
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Agregar listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Hook específico para detectar dispositivos móviles
 * @returns boolean - true si es un dispositivo móvil (< 768px)
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}

/**
 * Hook específico para detectar tablets
 * @returns boolean - true si es una tablet (768px - 1023px)
 */
export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

/**
 * Hook específico para detectar escritorio
 * @returns boolean - true si es escritorio (>= 1024px)
 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
