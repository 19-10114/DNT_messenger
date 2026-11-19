import { Pagination } from '@/models/pagination.model';
import { MotoCandelaHttpService } from '../motoCandelaHttp.service';
import {
  BulkEditSurveyPayload,
  CreateSurveyPayload,
  GetResponsesQueryParams,
  GetSurveysQueryParams,
  SubmitAnswerPayload,
  Survey,
  SurveyDetail,
  SurveyEnvelope,
  SurveyResponse,
  SurveyResponseSource,
  SurveyVersion,
  SurveyVersionSummary,
} from './types';

export class SurveyService {
  private service: MotoCandelaHttpService;

  constructor() {
    this.service = new MotoCandelaHttpService();
  }

  /**
   * Listado paginado de encuestas
   * @param token - Token de autenticación
   * @param queryParameters - Paginación y búsqueda
   */
  public async getSurveys(
    token: string,
    queryParameters: GetSurveysQueryParams = {}
  ): Promise<Pagination<Survey>> {
    const { page, pageSize, search } = queryParameters;
    const params: { [key: string]: string | number } = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (search) params.search = search;

    const response = await this.service.get<SurveyEnvelope<Pagination<Survey>>>(
      {
        endpoint: '/surveys/',
        params,
        token,
      }
    );

    return response.data;
  }

  /**
   * Encuesta con una versión para renderizar
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param versionNumber - Número de versión (por defecto, la publicada actual)
   */
  public async getSurveyById(
    token: string,
    surveyId: number,
    versionNumber?: number
  ): Promise<SurveyDetail> {
    const response = await this.service.get<SurveyEnvelope<SurveyDetail>>({
      endpoint: `/surveys/${surveyId}`,
      params: versionNumber ? { version: versionNumber } : undefined,
      token,
    });

    return response.data;
  }

  /**
   * Encuesta resuelta por su slug, para renderizarla desde una URL dinámica.
   *
   * La autenticación la manda la propia encuesta: una pública
   * (`requiresAuthentication: false`) responde sin token; una privada devuelve
   * 401. Por eso el token es opcional.
   *
   * @param token - Token de autenticación; opcional en encuestas públicas
   * @param slug - Slug de la encuesta
   * @param versionNumber - Número de versión (por defecto, la publicada actual)
   */
  public async getSurveyBySlug(
    token: string | undefined,
    slug: string,
    versionNumber?: number
  ): Promise<SurveyDetail> {
    const response = await this.service.get<SurveyEnvelope<SurveyDetail>>({
      endpoint: `/surveys/slug/${slug}`,
      params: versionNumber ? { version: versionNumber } : undefined,
      token,
    });

    return response.data;
  }

  /**
   * Crea una encuesta junto con su primera versión (queda en draft)
   * @param token - Token de autenticación
   * @param payload - Datos de la encuesta y sus preguntas
   */
  public async createSurvey(
    token: string,
    payload: CreateSurveyPayload
  ): Promise<SurveyDetail> {
    const response = await this.service.post<SurveyEnvelope<SurveyDetail>>({
      endpoint: '/surveys/',
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * Edición masiva: construye una nueva versión draft a partir del diff
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param payload - Preguntas eliminadas, editadas y agregadas
   */
  public async bulkEditSurvey(
    token: string,
    surveyId: number,
    payload: BulkEditSurveyPayload
  ): Promise<SurveyDetail> {
    const response = await this.service.patch<SurveyEnvelope<SurveyDetail>>({
      endpoint: `/surveys/${surveyId}`,
      data: payload,
      token,
    });

    return response.data;
  }

  /**
   * Archiva (soft delete) una encuesta
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   */
  public async archiveSurvey(
    token: string,
    surveyId: number
  ): Promise<{ success: boolean }> {
    const response = await this.service.delete<
      SurveyEnvelope<{ success: boolean }>
    >({
      endpoint: `/surveys/${surveyId}`,
      token,
    });

    return response.data;
  }

  /**
   * Listado de versiones de una encuesta
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   */
  public async getVersions(
    token: string,
    surveyId: number
  ): Promise<SurveyVersionSummary[]> {
    const response = await this.service.get<
      SurveyEnvelope<SurveyVersionSummary[]>
    >({
      endpoint: `/surveys/${surveyId}/versions`,
      token,
    });

    return response.data;
  }

  /**
   * Una versión concreta con sus preguntas
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param versionNumber - Número de versión (no el id de la versión)
   */
  public async getVersion(
    token: string,
    surveyId: number,
    versionNumber: number
  ): Promise<SurveyVersion> {
    const response = await this.service.get<SurveyEnvelope<SurveyVersion>>({
      endpoint: `/surveys/${surveyId}/versions/${versionNumber}`,
      token,
    });

    return response.data;
  }

  /**
   * Publica una versión: pasa a ser la `currentVersion` de la encuesta
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param versionNumber - Número de versión a publicar
   */
  public async publishVersion(
    token: string,
    surveyId: number,
    versionNumber: number
  ): Promise<SurveyVersionSummary> {
    const response = await this.service.post<
      SurveyEnvelope<SurveyVersionSummary>
    >({
      endpoint: `/surveys/${surveyId}/versions/${versionNumber}/publish`,
      token,
    });

    return response.data;
  }

  /**
   * Envía respuestas contra la versión publicada actual
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param answers - Respuestas con la forma que exige cada tipo de pregunta
   * @param source - De dónde llegó (p. ej. una página pública); queda en `meta.source`
   */
  public async submitResponse(
    token: string,
    surveyId: number,
    answers: SubmitAnswerPayload[],
    source?: SurveyResponseSource
  ): Promise<SurveyResponse> {
    const response = await this.service.post<SurveyEnvelope<SurveyResponse>>({
      endpoint: `/surveys/${surveyId}/responses`,
      data: source ? { answers, source } : { answers },
      token,
    });

    return response.data;
  }

  /**
   * Listado paginado de respuestas de una encuesta
   * @param token - Token de autenticación
   * @param surveyId - Id de la encuesta
   * @param queryParameters - Paginación y filtro por versión
   */
  public async getSurveyResponses(
    token: string,
    surveyId: number,
    queryParameters: GetResponsesQueryParams = {}
  ): Promise<Pagination<SurveyResponse>> {
    const { page, pageSize, version } = queryParameters;
    const params: { [key: string]: string | number } = {};
    if (page) params.page = page;
    if (pageSize) params.page_size = pageSize;
    if (version) params.version = version;

    const response = await this.service.get<
      SurveyEnvelope<Pagination<SurveyResponse>>
    >({
      endpoint: `/surveys/${surveyId}/responses`,
      params,
      token,
    });

    return response.data;
  }

  /**
   * Detalle de una respuesta puntual
   * @param token - Token de autenticación
   * @param responseId - Id de la respuesta
   */
  public async getResponseById(
    token: string,
    responseId: number
  ): Promise<SurveyResponse> {
    const response = await this.service.get<SurveyEnvelope<SurveyResponse>>({
      endpoint: `/surveys/responses/${responseId}`,
      token,
    });

    return response.data;
  }

  /**
   * Revisión de staff: completa o corrige respuestas y vuelve a puntuar.
   *
   * Es un upsert, así que basta con enviar lo que cambió. Devuelve la respuesta
   * completa ya recalculada: conviene re-renderizar con ella en vez de refetchear.
   *
   * @param token - Token de autenticación (el usuario debe ser staff)
   * @param responseId - Id de la respuesta
   * @param answers - Respuestas a insertar o sobrescribir
   */
  public async updateResponse(
    token: string,
    responseId: number,
    answers: SubmitAnswerPayload[]
  ): Promise<SurveyResponse> {
    const response = await this.service.patch<SurveyEnvelope<SurveyResponse>>({
      endpoint: `/surveys/responses/${responseId}`,
      data: { answers },
      token,
    });

    return response.data;
  }
}
