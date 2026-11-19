import axios from 'axios';

/**
 * Extrae el mensaje legible del envoltorio de error de la API
 * (`{ message, errors, data }`). En un 400 de serializer, `errors` viene
 * indexado por campo: `{ "plate": ["This field is required."] }`.
 * @param error - Error capturado de una llamada al servicio
 * @param fallback - Mensaje a usar si no se puede determinar uno mejor
 */
export function getUsedBikeErrorMessage(
  error: unknown,
  fallback: string
): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; errors?: unknown }
      | undefined;

    const fieldErrors = data?.errors;
    if (fieldErrors && typeof fieldErrors === 'object') {
      const details = Object.entries(fieldErrors as Record<string, unknown>)
        .map(([field, messages]) => {
          const text = Array.isArray(messages)
            ? messages.join(' ')
            : String(messages);
          return `${field}: ${text}`;
        })
        .join(' · ');
      if (details) return details;
    }

    if (typeof fieldErrors === 'string') return fieldErrors;
    if (data?.message) return data.message;
  }

  if (error instanceof Error && error.message) return error.message;

  return fallback;
}
