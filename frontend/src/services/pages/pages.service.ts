import { Pagination } from '@/models/pagination.model';
import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import {
  CreatePagePayload,
  GetPagesQueryParams,
  PageBlockPayload,
  PageDetail,
  PageImage,
  PageListItem,
  PageProductSearchItem,
  PagesEnvelope,
  UpdatePageMetaPayload,
} from './types';

const MULTIPART = { 'Content-Type': 'multipart/form-data' };

/** Administración de Páginas públicas (solo Super Admin) */
export class PagesService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /** Listado paginado con filtro por estado y búsqueda por título o link */
  public async getPages(
    token: string,
    { page, pageSize, status, search }: GetPagesQueryParams = {}
  ): Promise<Pagination<PageListItem>> {
    const params: { [key: string]: string | number } = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (status && status !== 'all') params.status = status;
    if (search) params.search = search;

    const response = await this.service.get<
      PagesEnvelope<Pagination<PageListItem>>
    >({ endpoint: '/pages/', params, token });
    return response.data;
  }

  /** Página con todos sus bloques (también los ocultos) e imágenes */
  public async getPage(token: string, pageId: number): Promise<PageDetail> {
    const response = await this.service.get<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}`,
      token,
    });
    return response.data;
  }

  /** Crea la página en borrador; el slug lo resuelve el backend */
  public async createPage(
    token: string,
    payload: CreatePagePayload
  ): Promise<PageDetail> {
    const response = await this.service.post<PagesEnvelope<PageDetail>>({
      endpoint: '/pages/',
      data: payload,
      token,
    });
    return response.data;
  }

  /** Título, link, tema, SEO, vencimiento e imagen para compartir */
  public async updateMeta(
    token: string,
    pageId: number,
    payload: UpdatePageMetaPayload
  ): Promise<PageDetail> {
    const response = await this.service.patch<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}`,
      data: payload,
      token,
    });
    return response.data;
  }

  /**
   * Reemplaza la lista completa de bloques. Borra en el servidor las imágenes
   * que ya no usa ningún bloque ni la tarjeta para compartir, por eso se
   * llama después de `updateMeta`.
   */
  public async replaceBlocks(
    token: string,
    pageId: number,
    blocks: PageBlockPayload[]
  ): Promise<PageDetail> {
    const response = await this.service.put<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}/blocks`,
      data: { blocks },
      token,
    });
    return response.data;
  }

  public async publish(token: string, pageId: number): Promise<PageDetail> {
    const response = await this.service.post<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}/publish`,
      token,
    });
    return response.data;
  }

  public async unpublish(token: string, pageId: number): Promise<PageDetail> {
    const response = await this.service.post<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}/unpublish`,
      token,
    });
    return response.data;
  }

  /** Copia como borrador, con copias propias de las imágenes */
  public async duplicate(token: string, pageId: number): Promise<PageDetail> {
    const response = await this.service.post<PagesEnvelope<PageDetail>>({
      endpoint: `/pages/${pageId}/duplicate`,
      token,
    });
    return response.data;
  }

  /** Archiva (borrado lógico) */
  public async archive(token: string, pageId: number): Promise<void> {
    await this.service.delete<PagesEnvelope<null>>({
      endpoint: `/pages/${pageId}`,
      token,
    });
  }

  /**
   * Buscador de productos del editor: motos y repuestos por nombre, marca,
   * modelo o SKU. Máximo 20 resultados.
   */
  public async searchProducts(
    token: string,
    search: string,
    category?: 1 | 2
  ): Promise<PageProductSearchItem[]> {
    const params: { [key: string]: string | number } = {};
    if (search) params.search = search;
    if (category) params.category = category;
    const response = await this.service.get<
      PagesEnvelope<PageProductSearchItem[]>
    >({ endpoint: '/pages/products', params, token });
    return response.data;
  }

  public async uploadImage(
    token: string,
    pageId: number,
    file: File
  ): Promise<PageImage> {
    const form = new FormData();
    form.append('image', file, file.name);
    const response = await this.service.post<PagesEnvelope<PageImage>>({
      endpoint: `/pages/${pageId}/images`,
      data: form,
      token,
      customHeaders: MULTIPART,
    });
    return response.data;
  }
}
