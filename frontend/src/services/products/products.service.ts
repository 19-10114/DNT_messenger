import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import { ProductModel } from '@/models/product.model';
import { createUrl } from '@/utils/createUrl.utils';
import {
  CreateNewProductData,
  CreateNewProductErrorResponse,
  CreateNewProductSuccessfullyResponse,
} from './types/CreateNewProduct.type';
import { FinancialProductsResponse } from './types/FinancialProducts.type';
import { OtherProductsResponse } from './types/OtherProducts.type';
import {
  BikeProductsResponse,
  CategoriesResponse,
  GetProductsBackendResponse,
  GlobalPartInventoryResponse,
  BikeInventorySummaryResponse,
  PartInventorySummaryResponse,
} from './types';
import { GetNoCostProductsResponse } from './types/BikeProducts.type';
import {
  TopPartsQueryParams,
  TopPartsBackendResponse,
} from './types/GetProductsBackendResponse.type';
import {
  CreateUsedBikePayload,
  DeleteUsedBikeResponse,
  GetUsedBikesTableQueryParams,
  UpdateUsedBikePayload,
  ApproveUsedBikePayload,
  UsedBike,
  UsedBikeApproval,
  UsedBikeApprovalResponse,
  UsedBikeResponse,
  UsedBikesTableResponse,
} from './types/UsedBike.type';
import {
  UsedBikePricingCase,
  UsedBikePricingPayload,
  UsedBikePricingResponse,
  UsedBikePricingResult,
} from './types/UsedBikePricing.type';
import {
  ProductsByIdsResponse,
  ProductsByIdsResult,
} from './types/ProductsByIds.type';

const mockImage =
  'https://www.mototransformerempirekeeway.com/wp-content/uploads/2021/09/arsen-II-motos-transformer.jpg';

export class ProductsService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Productos por lote de ids, en una sola llamada y sin paginar.
   *
   * Es un POST porque la lista viaja en el cuerpo, pero es una lectura pura.
   * Un id inexistente **no** da 404: vuelve en `missingIds` con status 200, así
   * que hay que revisarlo antes de renderizar. El orden de `products` es el de
   * la base de datos, no el de los ids enviados: indexa por `id`.
   * Con `skus` también busca por sku (los que no existen vuelven en
   * `missingSkus`); un producto que coincide por id y por sku viene una vez.
   * @param token - Token de autenticación
   * @param ids - Ids de producto
   * @param skus - Skus de producto; `ids` y `skus` no pueden ir vacíos los
   * dos (el backend responde 400)
   */
  public async getProductsByIds(
    token: string,
    ids: number[],
    skus: string[] = []
  ): Promise<ProductsByIdsResult> {
    const response = await this.service.post<ProductsByIdsResponse>({
      endpoint: '/products/byids',
      data: skus.length > 0 ? { ids, skus } : { ids },
      token,
    });
    return response.data;
  }

  /*Obtener info de un repuesto por sku*/
  public async getProductBySku(token: string, sku: string) {
    const response = await this.service.get<any>({
      endpoint: `/products/${sku}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de productos comprados
  public async getPurchasedProducts(token: string, id: string) {
    const response = await this.service.get<any>({
      endpoint: `/products/purchased/${id}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de motos con paginación
  public async getBikeInventory(
    token: string,
    id: string,
    queryParameters: any = {}
  ) {
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/products/bikeinv/${id}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
          // Solo viaja cuando se pide: sin filtro, el parámetro no va en la URL
          ...(queryParameters?.used && { used: 'true' }),
          // Igual que `used`: sólo viaja cuando se piden motos con GPS
          ...(queryParameters?.needGps && { needGps: 'true' }),
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  // Todas las motos que han existido alguna vez (incluyendo ya vendidas), para
  // la búsqueda de cualquier moto por placa (no solo las que están en stock).
  // id=0 = todas las sucursales (super admin); si no, solo esa sucursal.
  public async getAllBikesHistory(
    token: string,
    id: string,
    queryParameters: any = {}
  ) {
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/products/bikeinv/history/${id}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Inventario general de motos con paginación
  public async getGeneralBikeInventory(
    token: string,
    id: string,
    queryParameters: any = {}
  ) {
    const originValue =
      queryParameters?.origin === 'landing' ? 'landing' : 'admiin';
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/products/bikeinv/general/${id}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          ...(queryParameters?.search && { search: queryParameters.search }),
          ...(queryParameters?.model && { model: queryParameters.model }),
          ...(queryParameters?.pending === 'true' && { pending: 'true' }),
          origin: originValue,
        },
      }),
    });
    return response;
  }

  /**
   * KPIs del inventario de motos: unidades y valor (costo de adquisición),
   * por modelo y, con la sede 0, por sede. `used` sigue al check "usadas" de
   * la tabla: sin él cuenta solo motos nuevas, como el resto del inventario.
   * El valor llega en `null` si el usuario no es super admin.
   */
  public async getBikeInventorySummary(
    token: string,
    branchId: string,
    used = false
  ) {
    const response = await this.service.get<BikeInventorySummaryResponse>({
      endpoint: createUrl({
        url: `/products/bikeinv/summary/${branchId}`,
        parameters: used ? { used: 'true' } : {},
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  /**
   * KPIs del inventario de repuestos: valor FIFO de lo que hay en stock,
   * referencias y unidades, por SKU y por modelo. Sede 0 = todas.
   * El valor llega en `null` si el usuario no es super admin.
   */
  public async getPartInventorySummary(token: string, branchId: string) {
    const response = await this.service.get<PartInventorySummaryResponse>({
      endpoint: `/products/partinv/summary/${branchId}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Inventario global de repuestos con paginación
  public async getGlobalPartInventory(
    token: string,
    queryParameters: any = {}
  ) {
    const originValue =
      queryParameters?.origin === 'landing' ? 'landing' : 'admiin';
    const response = await this.service.get<GlobalPartInventoryResponse>({
      endpoint: createUrl({
        url: '/products/global/partinv',
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          ...(queryParameters?.search && { search: queryParameters.search }),
          origin: originValue,
        },
      }),
    });
    return response;
  }

  //Listado de repuestos con paginación
  public async getPartInventory(
    token: string,
    id: string,
    queryParameters: any = {}
  ) {
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/products/partinv/${id}`,
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          search: queryParameters?.search ?? '',
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de productos vendidos
  public async getSoldProducts(token: string, id: string) {
    const response = await this.service.get<any>({
      endpoint: `/products/sold/${id}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de productos financieros
  public async getFinancialProducts(token: string, id: string) {
    const response = await this.service.get<any>({
      endpoint: `/products/fproducts/${id}`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de todos los productos financieros
  public async getAllFinancialProducts(token: string) {
    const response = await this.service.get<FinancialProductsResponse>({
      endpoint: '/products/fproducts/all',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de productos "otros"
  public async getOtherProducts(token: string) {
    const response = await this.service.get<OtherProductsResponse>({
      endpoint: '/products/other/all',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de todas las motos
  public async getAllBikes(token: string, queryParameters: any = {}) {
    const response = await this.service.get<BikeProductsResponse>({
      endpoint: createUrl({
        url: '/products/bike/all',
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          ...(queryParameters?.search && { search: queryParameters.search }),
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  /**
   * Listado paginado de motos usadas de una sucursal
   * @param token - Token de autenticación
   * @param branchId - Id de sucursal; `0` trae las de todas las sucursales
   * @param queryParameters - Paginación y filtro por estado
   */
  public async getUsedBikesTable(
    token: string,
    branchId: number,
    queryParameters: GetUsedBikesTableQueryParams = {}
  ): Promise<UsedBikesTableResponse> {
    const { page, pageSize, status } = queryParameters;

    return this.service.get<UsedBikesTableResponse>({
      endpoint: createUrl({
        url: `/products/usedbikes/table/${branchId}`,
        parameters: {
          page: (page ?? 1).toString(),
          pageSize: (pageSize ?? 10).toString(),
          ...(status?.length && { status: status.join(',') }),
        },
      }),
      token,
    });
  }

  /**
   * Detalle de una moto usada
   * @param token - Token de autenticación
   * @param usedBikeId - Id del registro
   */
  public async getUsedBikeById(
    token: string,
    usedBikeId: number
  ): Promise<UsedBike> {
    const response = await this.service.get<UsedBikeResponse>({
      endpoint: `/products/usedbikes/${usedBikeId}`,
      token,
    });
    return response.data;
  }

  /**
   * Registra una moto usada
   * @param token - Token de autenticación
   * @param payload - Datos de la unidad; los relacionados van como id
   */
  public async createUsedBike(
    token: string,
    payload: CreateUsedBikePayload
  ): Promise<UsedBike> {
    const response = await this.service.post<UsedBikeResponse>({
      endpoint: '/products/usedbikes',
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Actualiza parcialmente una moto usada
   * @param token - Token de autenticación
   * @param usedBikeId - Id del registro
   * @param payload - Solo los campos que cambian. `productPrices` se reemplaza
   *   por completo: hay que enviar el arreglo entero.
   */
  public async updateUsedBike(
    token: string,
    usedBikeId: number,
    payload: UpdateUsedBikePayload
  ): Promise<UsedBike> {
    const response = await this.service.patch<UsedBikeResponse>({
      endpoint: `/products/usedbikes/${usedBikeId}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Aprueba una moto usada: guarda el `cost`, deriva el precio de reventa,
   * crea la transacción de compra, la enlaza al registro y pasa su estado a
   * `approved`, todo de forma atómica.
   *
   * **No es reversible por API.** Escribe `cost` y `price` por su cuenta, así
   * que no hay que parchearlos aparte.
   * @param token - Token de autenticación
   * @param usedBikeId - Id del registro
   * @param payload - `cost` cae al guardado si se omite; sin `margin`, el
   * backend aplica el suyo
   * @param branchId - Sucursal receptora; por defecto, la del registro
   */
  public async approveUsedBike(
    token: string,
    usedBikeId: number,
    payload: ApproveUsedBikePayload,
    branchId?: number
  ): Promise<UsedBikeApproval> {
    const response = await this.service.post<UsedBikeApprovalResponse>({
      endpoint: branchId
        ? `/products/usedbikes/${usedBikeId}/approve/${branchId}`
        : `/products/usedbikes/${usedBikeId}/approve`,
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Calcula el rango de compra de una moto usada. No persiste nada.
   * @param token - Token de autenticación
   * @param pricingCase - 1 por condición, 2 por reparaciones, 3 ambos
   * @param payload - Porcentajes como enteros (`20` = 20%, no `0.20`)
   */
  public async calculateUsedBikePricing(
    token: string,
    pricingCase: UsedBikePricingCase,
    payload: UsedBikePricingPayload
  ): Promise<UsedBikePricingResult> {
    const response = await this.service.post<UsedBikePricingResponse>({
      endpoint: `/products/usedbikes/pricing/${pricingCase}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Elimina una moto usada. El borrado es **definitivo**, no lógico.
   * @param token - Token de autenticación
   * @param usedBikeId - Id del registro
   */
  public async deleteUsedBike(
    token: string,
    usedBikeId: number
  ): Promise<{ success: boolean }> {
    const response = await this.service.delete<DeleteUsedBikeResponse>({
      endpoint: `/products/usedbikes/${usedBikeId}`,
      token,
    });
    return response.data;
  }

  //Listado de todos los repuestos
  public async getAllParts(token: string, queryParameters: any = {}) {
    const response = await this.service.get<BikeProductsResponse>({
      endpoint: createUrl({
        url: '/products/part/all',
        parameters: {
          pageSize: queryParameters?.pageSize ?? '10',
          page: queryParameters?.page ?? '1',
          ...(queryParameters?.search && { search: queryParameters.search }),
        },
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  //Listado de todas las categorías
  public async getAllCategories(token: string) {
    const response = await this.service.get<CategoriesResponse>({
      endpoint: '/products/categories/all',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response.data;
  }

  public async getById(
    id: string,
    token: string | undefined
  ): Promise<ProductModel> {
    const response = await this.service.get<any>({
      endpoint: createUrl({
        url: `/products/name/${id}`,
      }),
      token,
    });

    const product: ProductModel = {
      ...response.data,
      profileImage: mockImage,
      images: [
        mockImage,
        mockImage,
        mockImage,
        mockImage,
        mockImage,
        mockImage,
      ],
    };

    return product;
  }

  public async createProduct(token: string, product: CreateNewProductData) {
    return this.service.post<
      CreateNewProductErrorResponse | CreateNewProductSuccessfullyResponse
    >({
      endpoint: '/products/',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: {
        ...product,
      },
    });
  }

  public async patchProduct(
    token: string | undefined,
    productData: Partial<any>
  ): Promise<void> {
    await this.service.patch<void>({
      endpoint: `/products/`,
      token,
      data: productData,
    });
  }

  public async deleteProduct(token: string, sku: string) {
    await this.service.delete<void>({
      endpoint: `/products/`,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: {
        product: sku,
      },
    });
  }

  public async postImage(token: string, newImage: File, id: string) {
    // Crearmos un formData porque es necesario para enviar archivos al backend
    const formData = new FormData();

    formData.append('image', newImage, newImage.name);
    formData.append('product', id);

    // Es necesario especificar el header de Content-Type como multipart/form-data
    // Para que el backend pueda procesar el archivo
    const response = await this.service.post<
      CreateNewProductErrorResponse | CreateNewProductSuccessfullyResponse
    >({
      endpoint: `/products/image/all`,
      customHeaders: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });

    return response;
  }

  public async bulkUpdateBikePrices(
    token: string,
    products: {
      product: number;
      cost: number;
      ep_price: number;
      dp_price: number;
      price: number;
      bulk_price: number;
    }[]
  ) {
    const response = await this.service.patch<any>({
      endpoint: '/products/bike/bulk/price',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: products,
    });
    return response;
  }

  // Cargar archivo Excel para actualizar inventario de repuestos
  public async uploadPartInventoryExcel(
    token: string,
    file: File,
    searchParam?: string
  ) {
    // Crear FormData para enviar el archivo
    const formData = new FormData();
    formData.append('file', file, file.name);

    // Construir la URL con parámetros de búsqueda si se proporcionan
    const endpoint = createUrl({
      url: '/products/part/batch/update',
      parameters: searchParam ? { search: searchParam } : {},
    });

    const response = await this.service.post<any>({
      endpoint,
      customHeaders: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });

    return response;
  }

  public async bulkUpdatePartPrices(token: string, file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);
    const response = await this.service.post<any>({
      endpoint: '/products/part/bulk/price',
      customHeaders: {
        Authorization: `Token ${token}`,
        'Content-Type': 'multipart/form-data',
      },
      data: formData,
    });
    return response;
  }

  // Actualizar tasa USDT
  public async updateUsdtRate(token: string, rate: number): Promise<void> {
    await this.service.patch<void>({
      endpoint: '/products/rates',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
      data: { rate },
    });
  }

  // Obtener tasa de cambio
  public async getExchangeRate(token: string, date?: string) {
    const response = await this.service.get<{
      message: string;
      data: {
        date: string;
        rate: {
          exchangeRate: number;
          eurRate: number;
          usdtRate: number;
          lastUpdated: string;
        };
      };
    }>({
      endpoint: createUrl({
        url: '/products/rates',
        parameters: date ? { date } : undefined,
      }),
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  // Obtener productos sin costo
  public async getNoCostProducts(token: string) {
    const response = await this.service.get<GetNoCostProductsResponse>({
      endpoint: '/products/nocost/all',
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });
    return response;
  }

  public async getTopParts(
    token: string,
    params: TopPartsQueryParams
  ): Promise<TopPartsBackendResponse> {
    const endpoint = createUrl({
      url: '/transactions/parts/top',
      parameters: {
        start: params.start,
        finish: params.finish,
        page: params.page ?? '1',
        pageSize: params.pageSize ?? '10',
      },
    });

    const response = await this.service.get<TopPartsBackendResponse>({
      endpoint,
      customHeaders: {
        Authorization: `Token ${token}`,
      },
    });

    return response;
  }
}
