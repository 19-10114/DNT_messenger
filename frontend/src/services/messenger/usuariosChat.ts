import { MotoCandelaHttpService } from '@/services/motoCandelaHttp.service';
import type { GetUsersResponse } from '@/services/users/types/usersBackendResponse.types';

const servicio = new MotoCandelaHttpService();

export async function obtenerUsuariosChat(token: string, buscar = '', pagina = 1) {
  const datos = new URLSearchParams({
    page: String(pagina),
    page_size: '50',
    search: buscar
  });

  // Consultamos los usuarios del sistema
  const resp = await servicio.get<{ data: GetUsersResponse }>({
    endpoint: `/users/search?${datos.toString()}`,
    token
  });

  const permitidos = [
    'admin', 'administrator', 'parts_admin', 'manager',
    'seller', 'cashier', 'storage', 'main_storage',
    'mechanic', 'finance'
  ];

  // Buscamos los empleados activos
  const usuarios = resp.data.results.filter((u) => {
    if (!u.isActive) return false;

    const roles = (u.role || '').split(',');
    return roles.some((r) => permitidos.includes(r.trim()));
  });

  return {
    usuarios,
    totalPaginas: resp.data.totalPages
  };
}