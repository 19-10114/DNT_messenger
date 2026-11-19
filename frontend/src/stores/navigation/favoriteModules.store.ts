import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Pantallas marcadas como favoritas, por usuario. Viven solo en el navegador
 * (`localStorage`): son una comodidad de cada persona, no un dato de negocio.
 */
interface State {
  /** id de usuario → `href` de las pantallas favoritas, en orden de marcado. */
  byUser: Record<string, string[]>;
}

interface Actions {
  toggleFavorite: (userId: number, href: string) => void;
}

export const useFavoriteModulesStore = create<State & Actions>()(
  persist(
    (set) => ({
      byUser: {},
      toggleFavorite: (userId, href) =>
        set((state) => {
          const current = state.byUser[userId] ?? [];
          const next = current.includes(href)
            ? current.filter((item) => item !== href)
            : [...current, href];
          return { byUser: { ...state.byUser, [userId]: next } };
        }),
    }),
    { name: 'mc-favorite-modules' }
  )
);

const EMPTY: string[] = [];

export const useFavoriteHrefs = (userId: number | undefined) =>
  useFavoriteModulesStore((state) =>
    userId === undefined ? EMPTY : (state.byUser[userId] ?? EMPTY)
  );

export const useToggleFavorite = () =>
  useFavoriteModulesStore((state) => state.toggleFavorite);
