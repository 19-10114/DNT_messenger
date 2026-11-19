import axios, { AxiosError } from 'axios';

import { getRecentApiErrorsActions } from '@/stores/apiErrors/recentApiErrors.store';

/** Un payload más grande se guarda recortado */
const MAX_PAYLOAD_CHARS = 5000;
/** Campos que nunca se guardan en claro (contraseñas, tokens) */
const SECRET_KEY = /pass|token|secret|authorization/i;

/** Copia apta para JSON, con secretos tapados y archivos resumidos */
function describePayload(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > 6) return '[…]';
  if (typeof File !== 'undefined' && value instanceof File) {
    return { file: value.name, type: value.type, size: value.size };
  }
  if (typeof Blob !== 'undefined' && value instanceof Blob) {
    return { blob: value.type, size: value.size };
  }
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const entries: Record<string, unknown> = {};
    value.forEach((entry, key) => {
      const described = SECRET_KEY.test(key)
        ? '[oculto]'
        : describePayload(entry, depth + 1);
      // Un campo repetido (varios archivos) se guarda como lista
      entries[key] =
        key in entries
          ? ([] as unknown[]).concat(entries[key], described)
          : described;
    });
    return entries;
  }
  if (Array.isArray(value)) {
    return value.map((item) => describePayload(item, depth + 1));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SECRET_KEY.test(key) ? '[oculto]' : describePayload(item, depth + 1),
      ])
    );
  }
  return value;
}

function capturePayload(
  method: string,
  properties: DataContentServiceType
): unknown {
  const source = method === 'GET' ? properties.params : properties.data;
  if (source === undefined) return undefined;
  const described = describePayload(source);
  try {
    const json = JSON.stringify(described);
    if (json && json.length > MAX_PAYLOAD_CHARS) {
      return { truncated: true, preview: json.slice(0, MAX_PAYLOAD_CHARS) };
    }
  } catch {
    return '[no se pudo leer el payload]';
  }
  return described;
}

/**
 * Guarda el error, con lo que se envió, para que un reporte de soporte lo
 * adjunte. Los errores de la propia API de soporte no se guardan: taparían
 * los que se quieren reportar.
 */
function rememberApiError(
  method: string,
  properties: DataContentServiceType,
  error: unknown
) {
  const { endpoint } = properties;
  if (endpoint.startsWith('/support/')) return;
  const axiosError = error as AxiosError<{ message?: unknown }>;
  const apiMessage = axiosError?.response?.data?.message;
  getRecentApiErrorsActions().addApiError({
    endpoint,
    method,
    status: axiosError?.response?.status ?? 0,
    message: (typeof apiMessage === 'string'
      ? apiMessage
      : (axiosError?.message ?? 'Error desconocido')
    ).slice(0, 300),
    at: new Date().toISOString(),
    payload: capturePayload(method, properties),
  });
}

export type DataContentServiceType = {
  params?: {
    [key: string]: string | number;
  };
  data?: unknown;
  token?: string;
  customHeaders?: object | undefined;
  endpoint: string;
};

export class MotoCandelaHttpService {
  private url: string;

  constructor() {
    this.url = process.env.NEXT_PUBLIC_API_URL
      ? `${process.env.NEXT_PUBLIC_API_URL}`
      : 'http://localhost:8000/api';
  }

  public async get<T>(
    properties: Omit<DataContentServiceType, 'data'>
  ): Promise<T> {
    return this._httpRequest('GET', properties);
  }

  public async post<T>(properties: DataContentServiceType): Promise<T> {
    return this._httpRequest<T>('POST', properties);
  }

  public async put<T>(properties: DataContentServiceType): Promise<T> {
    return this._httpRequest('PUT', properties);
  }

  public async delete<T>(properties: DataContentServiceType): Promise<T> {
    return this._httpRequest('DELETE', properties);
  }
  public async patch<T>(properties: DataContentServiceType): Promise<T> {
    return this._httpRequest<T>('PATCH', properties);
  }

  async _httpRequest<T>(
    method: 'POST' | 'GET' | 'DELETE' | 'PUT' | 'PATCH',
    properties: DataContentServiceType
  ): Promise<T> {
    const { token, ...restProperties } = properties;

    const authorizationHeader = token
      ? {
          Authorization: `Token ${token}`,
        }
      : {};

    const customHeaders = properties?.customHeaders || {};

    // Necesario para el endpoints con header de Content-Type distinto a application/json
    if (customHeaders.hasOwnProperty('Content-Type')) {
      return axios<T>({
        ...restProperties,
        method,
        url: `${this.url}${properties.endpoint}`,
        headers: {
          'Content-Type': 'application/json',
          ...properties?.customHeaders,
          ...authorizationHeader,
        },
      })
        .then((response) => {
          return response.data as T;
        })
        .catch((error) => {
          rememberApiError(method, properties, error);
          throw error;
        });
    }

    // Axios instance
    return axios<T>({
      ...restProperties,
      method,
      url: `${this.url}${properties.endpoint}`,
      headers: {
        ...this.headers,
        ...properties?.customHeaders,
        ...authorizationHeader,
      },
    })
      .then((response) => {
        return response.data as T;
      })
      .catch((error) => {
        rememberApiError(method, properties, error);
        throw error;
      });
  }

  get headers(): object {
    return {
      'Content-Type': 'application/json',
    };
  }
}
