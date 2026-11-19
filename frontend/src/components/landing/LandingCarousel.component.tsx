'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';
import type { CarouselSlide } from '@/types/carousel.types';
import type { CarouselImage } from '@/services/carousel/types';
import { useToken } from '@/stores/auth/auth.store';
import { useFeaturedCarouselImages, useIsMobile, useCarousel } from '@/hooks';
import { useCarouselDataOptimizer } from '@/hooks/useInitialDataLoader';

export default function LandingCarousel() {
  const storeToken = useToken();
  const cookieToken = Cookies.get('token');
  const token = storeToken || cookieToken;
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  // Optimizar la carga de datos del carrusel
  useCarouselDataOptimizer();

  // Solo usar imágenes destacadas para este componente
  const {
    data: carouselData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFeaturedCarouselImages(token);

  const isMobile = useIsMobile();

  const slides = useMemo((): CarouselSlide[] => {
    // Usar solo imágenes destacadas (array directo de CarouselImage[])
    const carouselImages: CarouselImage[] =
      (carouselData as CarouselImage[]) || [];

    if (isError || !carouselImages || carouselImages.length === 0) {
      return [];
    }

    // Filtrar imágenes según el dispositivo basándose en las dimensiones
    const filteredImages = carouselImages.filter((image) => {
      // La validación de URL ya se hace en el hook, aquí solo filtramos por dimensiones
      if (!image.dimensions) {
        return true; // Mostrar imágenes sin dimensiones en todos los dispositivos
      }

      const { width, height } = image.dimensions;
      const aspectRatio = width / height;

      if (isMobile) {
        // Para móviles: mostrar imágenes verticales o cuadradas (aspect ratio <= 1.2)
        // Ejemplo: 600x850 (0.71) - formato vertical para móviles
        return aspectRatio <= 1.2;
      } else {
        // Para escritorio: mostrar imágenes horizontales (aspect ratio > 1.2)
        // Ejemplo: 1280x720 (1.78) - formato horizontal para escritorio
        return aspectRatio > 1.2;
      }
    });

    const processedSlides = filteredImages.map((image, index) => ({
      id: `carousel-${image.id}`,
      type:
        image.fileType === 'video' ? ('video' as const) : ('image' as const),
      src: image.imageUrl, // Ya está limpio desde el hook
      title: image.description,
      description: 'Descubre nuestros productos y servicios',
      buttonText: image.buttonLabel,
      buttonAction: image.buttonUrl,
      buttonLabel: image.buttonLabel,
      buttonUrl: image.buttonUrl,
    }));

    return processedSlides;
  }, [carouselData, isError, isMobile]);

  const {
    emblaRef,
    scrollPrev,
    scrollNext,
    scrollTo,
    embla,
    pauseAutoScroll,
    resumeAutoScroll,
  } = useCarousel({
    autoScrollInterval: 5000,
    loop: true,
  });

  // Manejar la reproducción de videos cuando cambia el slide
  useEffect(() => {
    if (!embla) return;

    const onSelect = () => {
      const selectedIndex = embla.selectedScrollSnap();
      setCurrentSlideIndex(selectedIndex);

      // Pausar todos los videos y remover event listeners
      Object.values(videoRefs.current).forEach((video) => {
        if (video) {
          video.pause();
          video.removeEventListener('ended', handleVideoEnded);
        }
      });

      // Reproducir el video del slide actual si es un video
      const currentSlide = slides[selectedIndex];
      if (currentSlide && currentSlide.type === 'video') {
        const currentVideo = videoRefs.current[currentSlide.id];
        if (currentVideo) {
          currentVideo.currentTime = 0; // Reiniciar desde el principio

          // Pausar el auto-scroll mientras se reproduce el video
          pauseAutoScroll();

          // Agregar event listener para cuando termine el video
          currentVideo.addEventListener('ended', handleVideoEnded);

          currentVideo.play().catch((error) => {
            console.error('Error playing video:', error);
            // Si hay error reproduciendo, reanudar auto-scroll
            resumeAutoScroll();
          });
        }
      } else {
        // Si no es video, mantener el auto-scroll normal
        resumeAutoScroll();
      }
    };

    // Función para manejar cuando termina un video
    const handleVideoEnded = () => {
      // Reanudar el auto-scroll cuando termine el video
      resumeAutoScroll();
    };

    embla.on('select', onSelect);
    onSelect(); // Ejecutar inmediatamente para el slide inicial

    // Capturar la referencia actual para la función de limpieza
    const currentVideoRefs = videoRefs.current;

    return () => {
      embla.off('select', onSelect);
      // Limpiar event listeners de videos usando la referencia capturada
      Object.values(currentVideoRefs).forEach((video) => {
        if (video) {
          video.removeEventListener('ended', handleVideoEnded);
        }
      });
    };
  }, [embla, slides, pauseAutoScroll, resumeAutoScroll]);

  const renderActionButton = (slide: CarouselSlide) => {
    const buttonClasses =
      'mt-4 px-6 py-3 bg-accent-foreground hover:bg-accent-foreground/90 hover:opacity-70 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 shadow-lg';

    if (slide.buttonAction?.startsWith('#')) {
      return (
        <a href={slide.buttonAction} className={buttonClasses}>
          {slide.buttonLabel}
        </a>
      );
    }

    if (slide.buttonAction?.startsWith('/')) {
      return (
        <Link href={slide.buttonUrl || '/'} className={buttonClasses}>
          {slide.buttonLabel}
        </Link>
      );
    }

    return <button className={buttonClasses}>{slide.buttonText}</button>;
  };

  const renderLoadingState = () => (
    <div className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-foreground mx-auto mb-4"></div>
        <p className="text-gray-600">Cargando carrusel...</p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Error al cargar el carrusel
        </h3>
        <p className="text-gray-600 mb-4">
          {error instanceof Error
            ? error.message
            : 'Ha ocurrido un error inesperado'}
        </p>
        <button
          onClick={() => refetch()}
          className="flex items-center mx-auto px-4 py-2 bg-secondary text-white rounded-md hover:bg-green-600 transition-colors duration-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </button>
      </div>
    </div>
  );

  if (isLoading) {
    return renderLoadingState();
  }

  if (isError) {
    return renderErrorState();
  }

  if (!slides || slides.length === 0) {
    return (
      <div className="relative w-full h-[calc(100vh-80px)] flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay contenido disponible
          </h3>
          <p className="text-gray-600 mb-4">
            No se encontraron imágenes para mostrar en el carrusel
          </p>
          <button
            onClick={() => refetch()}
            className="flex items-center mx-auto px-4 py-2 bg-accent-foreground text-white rounded-md hover:bg-accent-foreground/90 transition-colors duration-200"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <section
      id="inicio"
      className="relative w-full overflow-hidden"
      style={{
        height: '100vh',
        marginTop: 'calc(-90px)',
      }}
      aria-label="Carrusel principal de Moto Candela"
    >
      {/* Controles de navegación */}
      <div className="absolute bottom-6 right-6 z-50 flex gap-3">
        <button
          onClick={scrollPrev}
          className="bg-black/60 hover:bg-black/80 p-3 rounded-full text-white transition-all duration-300 backdrop-blur-sm"
          aria-label="Slide anterior"
        >
          <ArrowLeft size={24} />
        </button>
        <button
          onClick={scrollNext}
          className="bg-black/60 hover:bg-black/80 p-3 rounded-full text-white transition-all duration-300 backdrop-blur-sm"
          aria-label="Siguiente slide"
        >
          <ArrowRight size={24} />
        </button>
      </div>

      {/* Carrusel */}
      <div
        ref={emblaRef}
        className="w-full h-full overflow-hidden"
        role="region"
        aria-label="Slides del carrusel"
      >
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.id} className="min-w-full relative h-full">
              {/* Imagen de fondo */}
              {slide.type === 'image' ? (
                <Image
                  src={slide.src}
                  alt={slide.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 100vw"
                  unoptimized
                  priority={
                    currentSlideIndex ===
                    slides.findIndex((s) => s.id === slide.id)
                  }
                />
              ) : (
                <video
                  ref={(el) => {
                    if (el) {
                      videoRefs.current[slide.id] = el;
                    }
                  }}
                  key={slide.id}
                  className="w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  controls={false}
                  preload="auto"
                  style={{ background: '#000' }}
                  aria-label={slide.title}
                  onError={(e) => {
                    console.error('Error loading video:', slide.src, e);
                  }}
                  onLoadedData={() => {
                    // Si este es el slide actual, reproducir el video
                    const slideIndex = slides.findIndex(
                      (s) => s.id === slide.id
                    );
                    if (slideIndex === currentSlideIndex) {
                      const video = videoRefs.current[slide.id];
                      if (video) {
                        // Pausar auto-scroll mientras se reproduce el video
                        pauseAutoScroll();

                        // Agregar event listener para cuando termine
                        const handleVideoEnded = () => {
                          resumeAutoScroll();
                          video.removeEventListener('ended', handleVideoEnded);
                        };
                        video.addEventListener('ended', handleVideoEnded);

                        video.play().catch((error) => {
                          console.error('Error auto-playing video:', error);
                          // Si hay error, reanudar auto-scroll
                          resumeAutoScroll();
                        });
                      }
                    }
                  }}
                  onCanPlay={() => {
                    // console.log('Video can play:', slide.src);
                  }}
                >
                  <source src={slide.src} type="video/webm" />
                  <source src={slide.src} type="video/mp4" />
                  Tu navegador no soporta el formato de video.
                </video>
              )}

              <div className="absolute inset-0 bg-black/30" />

              <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
                {/* <div className="absolute inset-0 flex flex-col justify-center items-start px-6 sm:px-12 lg:px-20 text-white"> */}
                <div className="max-w-2xl">
                  {/* <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4 leading-tight">
                    {slide.title}
                  </h1>
                  {slide.description && (
                    <p className="text-lg sm:text-xl mb-6 text-gray-200 leading-relaxed">
                      {slide.description}
                    </p>
                  )} */}
                  {renderActionButton(slide)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className="w-3 h-3 rounded-full bg-white/50 hover:bg-white/80 transition-all duration-300"
            aria-label={`Ir al slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
