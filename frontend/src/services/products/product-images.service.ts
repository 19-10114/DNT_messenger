import {
  ProductImagesResponse,
  ProductImageUploadRequest,
  ProductImageUploadResponse,
  ProductImageUpdateRequest,
  ProductImageUpdateResponse,
  ProductImagesByIdResponse,
  ProductImagesByIdSetResponse,
} from '@/models/product-images.model';
import { MotoCandelaHttpService } from '../motoCandelaHttp.service';

export class ProductImagesService {
  private service: MotoCandelaHttpService;
  private static readonly BASE_URL = '/storage/products';

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Get all product images with pagination
   * @param page - Page number (optional)
   * @param pageSize - Number of items per page (optional)
   * @param token - User authentication token
   */
  async getAll(
    token: string | undefined,
    page?: number,
    pageSize?: number
  ): Promise<ProductImagesResponse> {
    const params = new URLSearchParams();
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('pageSize', pageSize.toString());

    const queryString = params.toString();
    const endpoint = queryString
      ? `${ProductImagesService.BASE_URL}?${queryString}`
      : ProductImagesService.BASE_URL;

    const response = await this.service.get<ProductImagesResponse>({
      endpoint,
      token,
    });
    return response;
  }

  /**
   * Get visible images for a specific product
   * @param productId - Product ID
   * @param token - User authentication token
   * @param page - Page number (optional)
   * @param pageSize - Number of items per page (optional)
   */
  async getVisibleByProduct(
    productId: number,
    token: string | undefined,
    page?: number,
    pageSize?: number
  ): Promise<ProductImagesResponse> {
    const params = new URLSearchParams();
    params.append('id', productId.toString());
    if (page !== undefined) params.append('page', page.toString());
    if (pageSize !== undefined) params.append('pageSize', pageSize.toString());

    const endpoint = `${ProductImagesService.BASE_URL}/visible?${params.toString()}`;

    const response = await this.service.get<ProductImagesResponse>({
      endpoint,
      token,
    });
    return response;
  }

  /**
   * Upload a new product image
   * @param uploadData - Form data with image, color, product, and visibility
   * @param token - User authentication token
   */
  async upload(
    uploadData: ProductImageUploadRequest,
    token: string | undefined
  ): Promise<ProductImageUploadResponse> {
    const formData = new FormData();
    formData.append('image', uploadData.image);
    formData.append('color', uploadData.color);
    formData.append('product', uploadData.product);
    formData.append('is_visible', uploadData.is_visible);

    const response = await this.service.post<ProductImageUploadResponse>({
      endpoint: ProductImagesService.BASE_URL,
      data: formData,
      token,
      customHeaders: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response;
  }

  /**
   * Update an existing product image
   * @param updateData - Data to update (id is required)
   * @param token - User authentication token
   */
  async update(
    updateData: ProductImageUpdateRequest,
    token: string | undefined
  ): Promise<ProductImageUpdateResponse> {
    const response = await this.service.patch<ProductImageUpdateResponse>({
      endpoint: `${ProductImagesService.BASE_URL}/update`,
      data: updateData,
      token,
    });
    return response;
  }

  /**
   * Get all images for a specific product by product ID
   * @param productId - Product ID
   * @param token - User authentication token
   */
  async getImagesByProductId(
    productId: number,
    token: string | undefined
  ): Promise<ProductImagesByIdResponse> {
    const endpoint = `${ProductImagesService.BASE_URL}/imagebypid?id=${productId}`;

    const response = await this.service.get<ProductImagesByIdResponse>({
      endpoint,
      token,
    });
    return response;
  }

  /**
   * Get images for a set of product IDs in a single request
   * @param ids - Array of product IDs
   * @param token - User authentication token
   */
  async getImagesByIdSet(
    ids: number[],
    token: string | undefined
  ): Promise<ProductImagesByIdSetResponse> {
    const response = await this.service.post<ProductImagesByIdSetResponse>({
      endpoint: `${ProductImagesService.BASE_URL}/imagesbyidset`,
      data: { ids },
      token,
    });
    return response;
  }

  /**
   * Delete a product image
   * @param imageId - Image ID to delete
   * @param token - User authentication token
   */
  async delete(
    imageId: number,
    token: string | undefined
  ): Promise<{ message: string }> {
    const response = await this.service.delete<{ message: string }>({
      endpoint: `${ProductImagesService.BASE_URL}?id=${imageId}`,
      token,
    });
    return response;
  }
}
