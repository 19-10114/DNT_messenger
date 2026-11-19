# Carousel Service

Este servicio proporciona endpoints para gestionar las imágenes del carrusel de la landing page.

## Endpoints Disponibles

### 1. Obtener todas las imágenes del carrusel

- **URL**: `api/storage/landing/carousel`
- **Método**: GET
- **Parámetros de consulta**:
  - `page` (opcional): Número de página (default: 1)
  - `pageSize` (opcional): Tamaño de página (default: 5)

### 2. Obtener imágenes destacadas del carrusel

- **URL**: `api/storage/landing/carousel/featured`
- **Método**: GET
- **Sin parámetros**

## Uso del Servicio

```typescript
import { CarouselService } from '@/services/carousel';

const carouselService = new CarouselService();

// Obtener todas las imágenes
const allImages = await carouselService.getAllCarouselImages(token, {
  page: '1',
  pageSize: '10',
});

// Obtener imágenes destacadas
const featuredImages = await carouselService.getFeaturedCarouselImages(token);
```

## Uso de Hooks con React Query

```typescript
import { useCarouselImages, useFeaturedCarouselImages } from '@/hooks';

// En tu componente
function MyComponent() {
  const {
    data: allImages,
    isLoading,
    isError,
  } = useCarouselImages(token, {
    page: '1',
    pageSize: '5',
  });

  const { data: featuredImages } = useFeaturedCarouselImages(token);

  // Tu lógica del componente...
}
```

## Tipos de Datos

### CarouselImage

```typescript
interface CarouselImage {
  id: number;
  imageUrl: string;
  dimensions: {
    width: number;
    height: number;
  };
  fileType: string;
  description: string;
  createdAt: string;
  isFeatured: boolean;
}
```

### Respuesta Paginada

```typescript
interface CarouselImagesData {
  currentPage: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  results: CarouselImage[];
}
```
