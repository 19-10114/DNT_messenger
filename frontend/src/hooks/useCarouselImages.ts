'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { CarouselService } from '@/services/carousel/carousel.service';
import { applyQueryConfig } from '@/config/queryOptimization.config';
import type {
  CarouselImage,
  CarouselImagesData,
  GetCarouselQueryParameters,
  CreateCarouselImageData,
  UpdateCarouselImageData,
} from '@/services/carousel/types';

const carouselService = new CarouselService();

/**
 * Hook para obtener todas las imágenes del carrusel con paginación
 * @param token Token de autenticación (opcional para endpoints públicos)
 * @param queryParameters Parámetros de consulta (page, pageSize)
 * @returns Objeto con data, isLoading, isError, error y refetch
 */
export function useCarouselImages(
  token: string | undefined,
  queryParameters: GetCarouselQueryParameters = {}
) {
  return useQuery({
    queryKey: ['carouselImages', token, queryParameters],
    queryFn: () => carouselService.getAllCarouselImages(token, queryParameters),
    enabled: true, // Permitir que funcione sin token para páginas públicas
    ...applyQueryConfig('CAROUSEL_IMAGES'),
  });
}

/**
 * Hook para obtener las imágenes destacadas del carrusel
 * @param token Token de autenticación (requerido para contenido destacado)
 * @returns Objeto con data, isLoading, isError, error y refetch
 */
export function useFeaturedCarouselImages(token: string | undefined) {
  return useQuery({
    queryKey: ['featuredCarouselImages', token],
    queryFn: async () => {
      const data = await carouselService.getFeaturedCarouselImages(token);
      // Validar y limpiar los datos del backend
      const cleanedData = data
        .filter((image) => {
          // Filtrar imágenes con URLs vacías o inválidas
          if (
            !image.imageUrl ||
            typeof image.imageUrl !== 'string' ||
            image.imageUrl.trim() === ''
          ) {
            console.warn(`Skipping image with invalid URL: ${image.id}`);
            return false;
          }
          return true;
        })
        .map((image) => ({
          ...image,
          // Asegurar que los campos requeridos tengan valores por defecto
          // Limpiar URL removiendo espacios, backticks y otros caracteres problemáticos
          imageUrl: image.imageUrl.trim().replace(/[`\s]/g, ''),
          description: image.description || `Imagen ${image.id}`,
          buttonLabel: image.buttonLabel || 'Ver Más',
          buttonUrl:
            (image.buttonUrl || '#').trim().replace(/[`\s]/g, '') || '#',
          dimensions: image.dimensions || null,
        }));

      return cleanedData;
    },
    enabled: true, // Permitir que funcione sin token para contenido público
    ...applyQueryConfig('CAROUSEL_IMAGES'),
  });
}

/**
 * Hook para crear una nueva imagen del carrusel
 * @param token Token de autenticación (requerido)
 * @returns Objeto de mutación con mutate, isLoading, isError, error
 */
export function useCreateCarouselImage(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCarouselImageData) =>
      carouselService.createCarouselImage(token, data),
    onSuccess: () => {
      // Invalidar y refrescar las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['carouselImages'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCarouselImages'] });
    },
    onError: (error) => {
      console.error('Error creating carousel image:', error);
    },
  });
}

/**
 * Hook para actualizar una imagen del carrusel existente
 * @param token Token de autenticación (requerido)
 * @returns Objeto de mutación con mutate, isLoading, isError, error
 */
export function useUpdateCarouselImage(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateCarouselImageData) =>
      carouselService.updateCarouselImage(token, data),
    onSuccess: () => {
      // Invalidar y refrescar las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['carouselImages'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCarouselImages'] });
    },
    onError: (error) => {
      console.error('Error updating carousel image:', error);
    },
  });
}

/**
 * Hook para eliminar una imagen del carrusel
 * @param token Token de autenticación (requerido)
 * @returns Objeto de mutación con mutate, isLoading, isError, error
 */
export function useDeleteCarouselImage(token: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => carouselService.deleteCarouselImage(token, id),
    onSuccess: () => {
      // Invalidar y refrescar las consultas relacionadas
      queryClient.invalidateQueries({ queryKey: ['carouselImages'] });
      queryClient.invalidateQueries({ queryKey: ['featuredCarouselImages'] });
    },
    onError: (error) => {
      console.error('Error deleting carousel image:', error);
    },
  });
}
