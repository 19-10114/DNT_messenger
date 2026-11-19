export interface CarouselImage {
  id: number;
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  } | null;
  fileType: string;
  description: string;
  createdAt: string;
  isFeatured: boolean;
  buttonLabel: string;
  buttonUrl: string;
}

export interface CarouselImagesData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: CarouselImage[];
}

export interface GetCarouselImagesResponse {
  message: string;
  data: CarouselImagesData;
}

export interface GetFeaturedCarouselImagesResponse {
  message: string;
  data: CarouselImage[];
}

export interface GetCarouselQueryParameters {
  page?: string;
  pageSize?: string;
}

// Tipos para crear imagen del carrusel
export interface CreateCarouselImageData {
  image: File;
  description: string;
  is_featured: boolean;
}

export interface CreateCarouselImageResponse {
  message: string;
  data: CarouselImage;
  is_featured: boolean;
}

// Tipos para editar imagen del carrusel
export interface UpdateCarouselImageData {
  id: number;
  is_featured?: boolean;
  description?: string;
}

export interface UpdateCarouselImageResponse {
  message: string;
  data: CarouselImage;
}

// Tipos para eliminar imagen del carrusel
export interface DeleteCarouselImageResponse {
  message: string;
  data: [];
}
