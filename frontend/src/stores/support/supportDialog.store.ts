import { create } from 'zustand';

/**
 * Si el formulario "Reportar a soporte" está abierto. Hay un solo formulario
 * montado (en la barra superior); el menú de la cuenta y otros puntos de
 * entrada solo lo abren.
 */
interface State {
  isReportDialogOpen: boolean;
  actions: {
    openReportDialog: () => void;
    setReportDialogOpen: (open: boolean) => void;
  };
}

export const useSupportDialogStore = create<State>()((set) => ({
  isReportDialogOpen: false,
  actions: {
    openReportDialog: () => set(() => ({ isReportDialogOpen: true })),
    setReportDialogOpen: (open) => set(() => ({ isReportDialogOpen: open })),
  },
}));

export const useIsReportDialogOpen = () =>
  useSupportDialogStore((state) => state.isReportDialogOpen);
export const useSupportDialogActions = () =>
  useSupportDialogStore((state) => state.actions);
