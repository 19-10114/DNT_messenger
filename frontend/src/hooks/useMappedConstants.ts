// hooks/useMappedConstants.ts
import { useQuery } from '@tanstack/react-query';
import { useMemo, useCallback } from 'react';
import { useToken } from '@/stores/auth/auth.store';
import { UsersService } from '@/services/users/users.service';
import { ClientService } from '@/services/clients/clients.service';

const clientService = new ClientService();

const usersService = new UsersService();

interface MappedOption {
  value: string;
  label: string;
}

// Definición de labels para cada endpoint
export const labelsMap: Record<string, Record<string, string>> = {
  roles: {
    admin: 'Admin',
    administrator: 'Administrador',
    seller: 'Vendedor',
    cashier: 'Cajero',
    storage: 'Almacenista',
    main_storage: 'Almacenista Principal',
    manager: 'Gerente',
    parts_admin: 'Admin Repuestos',
    client: 'Cliente',
    mechanic: 'Mecánico',
    finance: 'Finanzas',
  },
  origins: {
    instagram: 'Instagram',
    facebook: 'Facebook',
    'tik-tok': 'TikTok',
    youtube: 'YouTube',
    mercadolibre: 'Mercado Libre',
    'pagina web': 'Página Web',
    referido: 'Referido',
    tienda: 'Tienda',
    peaton: 'Peatón',
    whatsapp: 'WhatsApp',
    cliente: 'Cliente',
    marketplace: 'MarketPlace',
  },
};

export const useMappedConstants = () => {
  const token = useToken();

  const rolesQuery = useQuery({
    queryKey: ['constants', 'roles'],
    queryFn: () => usersService.getRoles(token as string),
    enabled: !!token,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const rolesData: [string, number][] = rolesQuery.data?.data ?? [];

  const roles = useMemo<MappedOption[]>(
    () =>
      rolesData
        .filter(([value]) => value !== 'admin')
        .map(([value]) => ({
          value,
          label: labelsMap.roles[value] || value,
        })),
    [rolesData]
  );

  // Dado el key de un rol, devuelve los roles que ese rol puede asignar
  // según jerarquía: si hierarchy === 1 → todos los roles (>= 1);
  // si hierarchy > 1 → solo roles con jerarquía estrictamente mayor
  const getAllowedRoles = useCallback(
    (roleKey: string): MappedOption[] => {
      const roleEntry = rolesData.find(([key]) => key === roleKey);
      if (!roleEntry) return [];
      const [, hierarchy] = roleEntry;
      return rolesData
        .filter(([, h]) => (hierarchy === 1 ? h >= 1 : h > hierarchy))
        .map(([value]) => ({
          value,
          label: labelsMap.roles[value] || value,
        }));
    },
    [rolesData]
  );

  // Query para origins
  const originsQuery = useQuery({
    queryKey: ['constants', 'origins'],
    queryFn: () => clientService.getoriginsClient(token as string),
    enabled: !!token,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    select: (response) => {
      const originsData = response.data;
      const mappedOrigins: MappedOption[] = originsData.map(([value]) => ({
        value,
        label: labelsMap.origins[value] || value,
      }));
      return mappedOrigins;
    },
  });

  return {
    roles,
    getAllowedRoles,
    origins: originsQuery.data || [],
    isLoading: rolesQuery.isLoading || originsQuery.isLoading,
    isError: rolesQuery.isError || originsQuery.isError,
  };
};
