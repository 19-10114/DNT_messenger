import { useCallback, useEffect, useRef } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType } from 'embla-carousel';
import type { CarouselConfig } from '@/types/carousel.types';

const DEFAULT_CONFIG: CarouselConfig = {
  autoScrollInterval: 5000,
  transitionDuration: 20,
  loop: true,
};

export function useCarousel(config: Partial<CarouselConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const [emblaRef, embla] = useEmblaCarousel({
    loop: finalConfig.loop,
    duration: finalConfig.transitionDuration,
  });

  // Función para limpiar el intervalo
  const clearAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Función para iniciar el auto-scroll
  const startAutoScroll = useCallback(
    (emblaApi: EmblaCarouselType) => {
      clearAutoScroll();
      intervalRef.current = setInterval(() => {
        if (emblaApi && emblaApi.canScrollNext()) {
          emblaApi.scrollNext();
        }
      }, finalConfig.autoScrollInterval);
    },
    [clearAutoScroll, finalConfig.autoScrollInterval]
  );

  // Manejo de eventos del carrusel
  const onSelect = useCallback(
    (emblaApi: EmblaCarouselType) => {
      startAutoScroll(emblaApi);
    },
    [startAutoScroll]
  );

  // Configuración inicial y cleanup del carrusel
  useEffect(() => {
    if (!embla) return;

    // Iniciar auto-scroll
    startAutoScroll(embla);

    // Configurar eventos
    embla.on('select', onSelect);
    embla.on('pointerDown', clearAutoScroll);

    // Cleanup
    return () => {
      clearAutoScroll();
      embla.off('select', onSelect);
      embla.off('pointerDown', clearAutoScroll);
    };
  }, [embla, onSelect, startAutoScroll, clearAutoScroll]);

  // Cleanup al desmontar el componente
  useEffect(() => {
    return () => {
      clearAutoScroll();
    };
  }, [clearAutoScroll]);

  // Funciones de control
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

  // Función para pausar el auto-scroll
  const pauseAutoScroll = useCallback(() => {
    clearAutoScroll();
  }, [clearAutoScroll]);

  // Función para reanudar el auto-scroll
  const resumeAutoScroll = useCallback(() => {
    if (embla) {
      startAutoScroll(embla);
    }
  }, [embla, startAutoScroll]);

  return {
    emblaRef,
    embla,
    scrollPrev,
    scrollNext,
    scrollTo,
    clearAutoScroll,
    pauseAutoScroll,
    resumeAutoScroll,
  };
}
