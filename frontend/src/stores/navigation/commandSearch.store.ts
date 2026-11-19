import { create } from 'zustand';

/** Abierto/cerrado del buscador de pantallas (`Ctrl+K`), compartido. */
interface State {
  isOpen: boolean;
  actions: { setOpen: (isOpen: boolean) => void };
}

const useCommandSearchStore = create<State>()((set) => ({
  isOpen: false,
  actions: { setOpen: (isOpen) => set({ isOpen }) },
}));

export const useIsCommandSearchOpen = () =>
  useCommandSearchStore((state) => state.isOpen);
export const useCommandSearchActions = () =>
  useCommandSearchStore((state) => state.actions);
