import { BranchItem } from '@/services/branches/types/Branch.type';
import { BranchService } from '@/services/branches/branch.service';
import { create } from 'zustand';
import Cookies from 'js-cookie';

interface State {
  currentBranchId: number | undefined;
  currentBranchType: string | undefined;
  branches: BranchItem[];
  branchService: BranchService;
  isLoading: boolean;
}

interface Actions {
  actions: {
    setCurrentBranch: (branchId: number, branchType: string) => void;
    setCurrentBranchId: (branchId: number) => void;
    setBranches: (branches: BranchItem[]) => void;
    setIsLoading: (isLoading: boolean) => void;
    fetchBranches: (token: string, isPartsAdmin?: boolean) => Promise<void>;
  };
}

/**
 * Required for zustand stores, as the lib doesn't expose this type
 */
export type ExtractState<S> = S extends {
  getState: () => infer T;
}
  ? T
  : never;

export const useBranchStore = create<State & Actions>()((set, get) => ({
  // State
  currentBranchId: undefined,
  currentBranchType: undefined,
  branches: [],
  branchService: new BranchService(),
  isLoading: false,

  // Actions
  actions: {
    setCurrentBranch: (branchId, branchType) => {
      set(() => ({ currentBranchId: branchId, currentBranchType: branchType }));
      // Guardar el ID y tipo de sucursal en cookies
      Cookies.set('currentBranchId', branchId.toString(), { expires: 1 });
      Cookies.set('currentBranchType', branchType, { expires: 1 });
    },
    setCurrentBranchId: (branchId) => {
      set(() => ({ currentBranchId: branchId }));
      // Guardar el ID de sucursal en una cookie
      Cookies.set('currentBranchId', branchId.toString(), { expires: 1 });
    },
    setBranches: (branches) => set(() => ({ branches })),
    setIsLoading: (isLoading) => set(() => ({ isLoading })),
    fetchBranches: async (token, isPartsAdmin = false) => {
      try {
        set(() => ({ isLoading: true }));
        const currentBranchId = get().currentBranchId?.toString() || '20';
        const response = await get().branchService.getBranches(
          token,
          currentBranchId,
          isPartsAdmin
        );
        set(() => ({ branches: response.data, isLoading: false }));
      } catch (error) {
        console.error('Error fetching branches:', error);
        set(() => ({ isLoading: false }));
      }
    },
  },
}));

// Selectors
const currentBranchIdSelector = (state: ExtractState<typeof useBranchStore>) =>
  state.currentBranchId;
const currentBranchTypeSelector = (
  state: ExtractState<typeof useBranchStore>
) => state.currentBranchType;
const branchesSelector = (state: ExtractState<typeof useBranchStore>) =>
  state.branches;
const actionsSelector = (state: ExtractState<typeof useBranchStore>) =>
  state.actions;

// Getters
export const getCurrentBranchId = () =>
  currentBranchIdSelector(useBranchStore.getState());
export const getCurrentBranchType = () =>
  currentBranchTypeSelector(useBranchStore.getState());
export const getBranches = () => branchesSelector(useBranchStore.getState());
export const getActions = () => actionsSelector(useBranchStore.getState());

// Export all states in hooks
export const useCurrentBranchId = () =>
  useBranchStore((state) => state.currentBranchId);
export const useCurrentBranchType = () =>
  useBranchStore((state) => state.currentBranchType);
export const useBranches = () => useBranchStore((state) => state.branches);
export const useIsLoadingBranches = () =>
  useBranchStore((state) => state.isLoading);

// Export all actions
export const useBranchActions = () => useBranchStore((state) => state.actions);

// Initialize branch ID and type from cookies if available
export const initializeBranchId = () => {
  const branchIdFromCookie = Cookies.get('currentBranchId');
  const branchTypeFromCookie = Cookies.get('currentBranchType');

  if (branchIdFromCookie && branchTypeFromCookie) {
    useBranchStore
      .getState()
      .actions.setCurrentBranch(
        parseInt(branchIdFromCookie, 10),
        branchTypeFromCookie
      );
  } else if (branchIdFromCookie) {
    useBranchStore
      .getState()
      .actions.setCurrentBranchId(parseInt(branchIdFromCookie, 10));
  }
};

// Set branch ID and type from user
export const setBranchFromUser = (branchId: number, branchType: string) => {
  useBranchStore.getState().actions.setCurrentBranch(branchId, branchType);
};

// Set branch ID from user
export const setBranchIdFromUser = (branchId: number) => {
  useBranchStore.getState().actions.setCurrentBranchId(branchId);
};
