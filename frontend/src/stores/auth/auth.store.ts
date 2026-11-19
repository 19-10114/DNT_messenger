import { UserModel } from '@/models/user.model';
import { AuthService } from '@/services/auth/auth.service';
import { create } from 'zustand';
import Cookies from 'js-cookie';

interface State {
  user: UserModel | undefined;
  token: string | undefined;
  isLoggedIn: boolean;
  authService: AuthService;
}

interface Actions {
  actions: {
    setUser: (value?: UserModel | undefined) => void;
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

export const useAuthStore = create<State & Actions>()((set) => ({
  // State
  user: undefined,
  token: undefined,
  isLoggedIn: false,
  authService: new AuthService(),

  // Actions
  actions: {
    setUser: (value) =>
      set(() => {
        return { user: value, isLoggedIn: !!value?.id, token: value?.token };
      }),
  },
}));

export const loginUser = (user: UserModel) => {
  useAuthStore.getState().actions.setUser(user);

  // Almacenar el token y el rol en una cookie (con expiración de 1 día)
  Cookies.set('token', user.token, { expires: 1 });
  Cookies.set('role', user.role, { expires: 1 });
  Cookies.set('isStaff', user.isStaff.toString(), { expires: 1 });

  // Almacenar el ID de sucursal si existe
  if (user.branch?.id) {
    Cookies.set('currentBranchId', user.branch.id.toString(), { expires: 1 });
    // Inicializar el ID de sucursal en el store de sucursales
    import('@/stores/branch/branch.store').then(({ setBranchIdFromUser }) => {
      setBranchIdFromUser(user.branch.id);
    });
  }
};

export const logoutUser = () => {
  useAuthStore.getState().actions.setUser(undefined);

  // Remover las cookies
  Cookies.remove('token');
  Cookies.remove('role');
  Cookies.remove('isStaff');
  Cookies.remove('currentBranchId');
};

// Selectors
const tokenSelector = (state: ExtractState<typeof useAuthStore>) => state.token;
const actionsSelector = (state: ExtractState<typeof useAuthStore>) =>
  state.actions;

// Getters
export const getToken = () => tokenSelector(useAuthStore.getState());
export const getActions = () => actionsSelector(useAuthStore.getState());

// Export all states in hooks
export const useUser = () => useAuthStore((state) => state.user);
export const useToken = () => useAuthStore((state) => state.token);
export const useIsLoggedIn = () => useAuthStore((state) => state.isLoggedIn);
export const useAuthService = () => useAuthStore((state) => state.authService);
export const useUserRole = () =>
  useAuthStore((state) => state.user?.branch.type);
export const useIsStaff = () => useAuthStore((state) => state.user?.isStaff);
export const useSuperuser = () =>
  useAuthStore((state) => state.user?.isSuperuser);
export const useRoles = () => {
  const rolesString = useAuthStore((state) => state.user?.role);
  if (!rolesString) {
    const cookieRole = Cookies.get('role');
    if (!cookieRole) return [];
    return cookieRole.split(',').map((r) => r.trim());
  }
  return rolesString.split(',').map((r) => r.trim());
};
/**
 * "Super admin": superusuario de Django que no es staff, o rol `admin`. Es el
 * mismo criterio que `utils.roles.is_super_admin` del backend.
 */
export const useIsSuperAdmin = () => {
  const user = useAuthStore((state) => state.user);
  const roles = useRoles();
  return (
    (user?.isSuperuser === true && user?.isStaff === false) ||
    roles.includes('admin')
  );
};
/**
 * Ve el Inicio de gerencia: Super Admin, `manager` o `administrator`. El
 * backend aplica la misma regla (`dashboard/views.py`).
 */
export const useIsManagerView = () => {
  const isSuperAdmin = useIsSuperAdmin();
  const roles = useRoles();
  return (
    isSuperAdmin || roles.includes('manager') || roles.includes('administrator')
  );
};
export const useSeller = () => {
  const roles = useRoles();
  return roles.includes('seller');
};

// Export all actions
export const useAuthActions = () => useAuthStore((state) => state.actions);
