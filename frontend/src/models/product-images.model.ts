export interface ProductImageDimensions {
  width: number;
  height: number;
}

export interface ProductImageModel {
  id: number;
  imageUrl: string;
  dimensions: ProductImageDimensions;
  fileType: string;
  createdAt: string;
  product: number;
  isVisible: boolean;
  isFeatured: boolean;
  color: string;
}

export interface ProductImagesResponse {
  message: string;
  data: {
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    results: ProductImageModel[];
  };
}

export interface ProductImageUploadRequest {
  image: File;
  color: string;
  product: string;
  is_visible: string;
}

export interface ProductImageUpdateRequest {
  id: number;
  description?: string;
  is_featured?: boolean;
  is_visible?: boolean;
}

export interface ProductImageUploadResponse {
  message: string;
  data: ProductImageModel;
}

export interface ProductImageUpdateResponse {
  message: string;
  data: ProductImageModel;
}

export interface ProductImagesByIdResponse {
  message: string;
  data: ProductImageModel[];
}

export interface ProductImagesByIdSetItem {
  id: number;
  images: ProductImageModel[];
}

export interface ProductImagesByIdSetResponse {
  message: string;
  data: ProductImagesByIdSetItem[];
}
