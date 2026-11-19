import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { createUrl } from '@/utils/createUrl.utils';
import type {
  GetCarouselImagesResponse,
  GetFeaturedCarouselImagesResponse,
  GetCarouselQueryParameters,
  CarouselImage,
  CarouselImagesData,
  CreateCarouselImageData,
  CreateCarouselImageResponse,
  UpdateCarouselImageData,
  UpdateCarouselImageResponse,
  DeleteCarouselImageResponse,
} from './types';

export class CarouselService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Obtiene todas las imágenes del carrusel con paginación
   * @param token Token de autenticación (opcional para endpoints públicos)
   * @param queryParameters Parámetros de consulta (page, pageSize)
   * @returns Respuesta paginada con las imágenes del carrusel
   */
  public async getAllCarouselImages(
    token: string | undefined,
    queryParameters: GetCarouselQueryParameters = {}
  ): Promise<CarouselImagesData> {
    const response = await this.service.get<GetCarouselImagesResponse>({
      endpoint: createUrl({
        url: '/storage/landing/carousel',
        parameters: {
          page: queryParameters?.page ?? '1',
          pageSize: queryParameters?.pageSize ?? '5',
        },
      }),
      token,
    });

    return response.data;
  }

  /**
   * Obtiene todas las imágenes "seleccionadas" (featured) del carrusel
   * @param token Token de autenticación (requerido para contenido destacado)
   * @returns Array de imágenes destacadas del carrusel
   */
  public async getFeaturedCarouselImages(
    token: string | undefined
  ): Promise<CarouselImage[]> {
    try {
      const response =
        await this.service.get<GetFeaturedCarouselImagesResponse>({
          endpoint: '/storage/landing/carousel/featured',
          token,
        });

      return response.data;
    } catch (error) {
      console.error('❌ Error fetching featured carousel images:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        token: token ? 'present' : 'missing',
      });
      throw error;
    }
  }

  /**
   * Crea una nueva imagen del carrusel
   * @param token Token de autenticación (requerido)
   * @param data Datos de la imagen (archivo y descripción)
   * @returns Imagen del carrusel creada
   */
  public async createCarouselImage(
    token: string,
    data: CreateCarouselImageData
  ): Promise<CarouselImage> {
    const formData = new FormData();
    formData.append('image', data.image);
    formData.append('description', data.description);
    formData.append('is_featured', data.is_featured.toString());

    const response = await this.service.post<CreateCarouselImageResponse>({
      endpoint: '/storage/landing/carousel',
      token,
      data: formData,
      customHeaders: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  /**
   * Actualiza una imagen del carrusel existente
   * @param token Token de autenticación (requerido)
   * @param data Datos a actualizar (id, is_featured, description)
   * @returns Imagen del carrusel actualizada
   */
  public async updateCarouselImage(
    token: string,
    data: UpdateCarouselImageData
  ): Promise<CarouselImage> {
    const response = await this.service.patch<UpdateCarouselImageResponse>({
      endpoint: '/storage/landing/carousel/update',
      token,
      data,
    });

    return response.data;
  }

  /**
   * Elimina una imagen del carrusel
   * @param token Token de autenticación (requerido)
   * @param id ID de la imagen a eliminar
   * @returns Respuesta de confirmación
   */
  public async deleteCarouselImage(token: string, id: number): Promise<[]> {
    const response = await this.service.delete<DeleteCarouselImageResponse>({
      endpoint: createUrl({
        url: '/storage/landing/carousel',
        parameters: { id: id.toString() },
      }),
      token,
    });

    return response.data;
  }
}
