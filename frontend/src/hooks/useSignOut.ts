import { useRouter } from 'next/navigation';
import {
  logoutUser,
  useAuthActions,
  useAuthService,
  useAuthStore,
} from '@/stores/auth/auth.store';

/** Cierra la sesión en el servidor, limpia el cliente y vuelve al inicio. */
export const useSignOut = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const { setUser } = useAuthActions();
  const authService = useAuthService();

  return async () => {
    try {
      if (!user) return;
      await authService.logout(user.token);
      localStorage.removeItem('TOKEN');
      logoutUser();
      router.push('/');
      setUser(undefined);
    } catch (err) {
      console.log(err);
    }
  };
};
