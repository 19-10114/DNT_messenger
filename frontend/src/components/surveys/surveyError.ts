import axios from 'axios';

/**
 * Extrae el mensaje legible del envoltorio de error de la API de encuestas
 * (`{ message, errors, data }`).
 * @param error - Error capturado de una llamada al servicio
 * @param fallback - Mensaje a usar si no se puede determinar uno mejor
 */
export function getSurveyErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: unknown }
      | undefined;

    if (data?.message) return data.message;

    if (typeof data?.errors === 'string') return data.errors;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
