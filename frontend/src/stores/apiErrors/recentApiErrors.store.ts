import { create } from 'zustand';

/** Cuántos errores se guardan: los más recientes primero */
export const MAX_RECENT_API_ERRORS = 5;

/**
 * Un error de la API, para adjuntarlo a un reporte de soporte: qué endpoint
 * falló y con qué datos se llamó. Nunca headers ni el token.
 */
export interface RecentApiError {
  endpoint: string;
  method: string;
  /** `0` cuando no hubo respuesta (red caída, CORS, timeout) */
  status: number;
  message: string;
  /** ISO 8601 */
  at: string;
  /**
   * Lo que se envió: parámetros en un GET, cuerpo en el resto. Contraseñas y
   * tokens tapados, archivos como `{ file, type, size }`, recortado a 5 KB.
   */
  payload?: unknown;
}

interface State {
  recentApiErrors: RecentApiError[];
  actions: {
    addApiError: (error: RecentApiError) => void;
    clearApiErrors: () => void;
  };
}

export const useRecentApiErrorsStore = create<State>()((set) => ({
  recentApiErrors: [],
  actions: {
    addApiError: (error) =>
      set((state) => ({
        recentApiErrors: [error, ...state.recentApiErrors].slice(
          0,
          MAX_RECENT_API_ERRORS
        ),
      })),
    clearApiErrors: () => set(() => ({ recentApiErrors: [] })),
  },
}));

// Getters (fuera de React: el servicio HTTP no es un componente)
export const getRecentApiErrorsActions = () =>
  useRecentApiErrorsStore.getState().actions;

// Hooks
export const useRecentApiErrors = () =>
  useRecentApiErrorsStore((state) => state.recentApiErrors);
export const useRecentApiErrorsActions = () =>
  useRecentApiErrorsStore((state) => state.actions);
