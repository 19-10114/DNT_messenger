// Tipos para el componente LandingCarousel

export interface CarouselSlide {
  id: string;
  type: 'image' | 'video';
  src: string;
  title: string;
  description?: string;
  buttonText: string;
  buttonAction?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

export interface CarouselConfig {
  autoScrollInterval: number;
  transitionDuration: number;
  loop: boolean;
}

// Tipos para el catálogo de productos
export interface Product {
  id: number;
  name: string;
  image: string;
  images?: string[]; // Galería de imágenes adicionales
  description?: string;
  price?: number;
  category?: string;
  featured?: boolean;
  available?: boolean; // Disponibilidad del producto
  paymentModes?: PaymentMode[]; // Modalidades de pago disponibles
  color?: string;
  leaseOptions?: LeaseOptions; // Nuevas opciones de arrendamiento
  leasePrice?: number;
  initialFee?: number;
  cashPrice?: number;
  brand?: string;
  internalId?: string;
  stock?: number;
  extra?: number;
  isFeatured?: boolean;
}

export interface LeaseOptions {
  '24'?: {
    weeklyFee: number;
  };
  '36'?: {
    weeklyFee: number;
  };
  '48'?: {
    weeklyFee: number;
  };
  initialFee?: number;
}

export interface PaymentMode {
  id: string;
  name: string;
  description?: string;
  price: number;
  duration?: string; // ej: "24 semanas", "36 semanas", "48 semanas"
  weeklyFee?: number;
}

export interface CatalogueConfig {
  autoScrollInterval: number;
  itemsPerView: {
    mobile: number;
    tablet: number;
    desktop: number;
  };
  loop: boolean;
}
