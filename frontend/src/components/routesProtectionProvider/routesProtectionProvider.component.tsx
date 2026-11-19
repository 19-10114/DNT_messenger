'use client';

import { useRouter } from 'next/navigation';
import { ReactElement, useEffect, useState } from 'react';
import { useToast } from '../ui/use-toast';
import { Title } from '../typography/title.component';
import {
  logoutUser,
  useAuthActions,
  useAuthService,
} from '@/stores/auth/auth.store';

interface RoutesProtectionProviderProps {
  children: ReactElement;
}

export function RoutesProtectionProvider({
  children,
}: RoutesProtectionProviderProps) {
  const toast = useToast();
  const router = useRouter();
  const [isValid, setIsValid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authService = useAuthService();
  const authActions = useAuthActions();

  /**
   * Sesión inválida o caducada: se limpia todo rastro del token y se vuelve
   * al inicio, donde el usuario entra con el modal de la landing. La ruta
   * actual viaja en `next` para devolverlo ahí después.
   */
  const redirectToHome = (description: string) => {
    toast.toast({
      title: 'Sesión inválida',
      description,
      variant: 'destructive',
    });

    localStorage.removeItem('TOKEN');
    logoutUser();
    setIsValid(false);

    const next = `${window.location.pathname}${window.location.search}`;
    router.replace(`/?next=${encodeURIComponent(next)}`);
  };

  const checkUserAuthentication = async () => {
    try {
      const token = localStorage.getItem('TOKEN') ?? '';

      const currentUser = await authService.getCurrentUser(token);

      if (!currentUser) {
        redirectToHome(
          'Debes iniciar sesión antes de poder utilizar esta aplicación.'
        );
        return;
      }

      authActions.setUser(currentUser);

      setIsValid(true);
    } catch (error: any) {
      redirectToHome(
        error?.message || 'Tuvimos problemas para validar tu sesión'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkUserAuthentication();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="fixed w-full h-screen bg-primary p-2.5">
        <div className="w-full h-full flex items-center justify-center rounded-md bg-white">
          <Title>Validando la sesión del usuario</Title>
        </div>
      </div>
    );
  }

  if (!isValid && !isLoading) return <></>;

  return <>{children}</>;
}
