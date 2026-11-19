'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button.component';
import { Input } from '@/components/ui/input.component';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog.component';
import { useAllBranches } from '@/hooks/useAllBranches';
import { labelsMap } from '@/hooks/useMappedConstants';
import { messengerService } from '@/services/messenger/messenger.service';
import { useToken, useRoles, useUser } from '@/stores/auth/auth.store';
import type { Conversation, MessengerUser } from '@/types/messenger.types';

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (grupo: Conversation) => void;
  overrideToken?: string | null;
};

export function NewGroupModal({ open, onClose, onCreated, overrideToken }: Props) {
  const tokenSesion = useToken();
  const token = overrideToken || tokenSesion;
  const roles = useRoles();
  const yo = useUser();
  const { data: sucursales } = useAllBranches();

  const puedeCrear = roles.includes('admin') ||
    roles.includes('administrator') || roles.includes('manager');

  const [nombre, setNombre] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [usuarios, setUsuarios] = useState<MessengerUser[]>([]);
  const [usuariosConocidos, setUsuariosConocidos] = useState<Record<number, MessengerUser>>({});
  const [elegidos, setElegidos] = useState<number[]>([]);
  const [cargando, setCargando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;

    setNombre('');
    setSucursal('');
    setUsuarios([]);
    setUsuariosConocidos({});
    setElegidos([]);
    setError('');
  }, [open]);

  // Cargamos los empleados de la sucursal
  useEffect(() => {
    if (!open || !token || !puedeCrear) return;

    let seguir = true;
    const idSucursal = sucursal === '' ? undefined : Number(sucursal);

    async function cargar() {
      if (!token) return;

      setCargando(true);
      setUsuarios([]);
      setError('');

      try {
        const lista = await messengerService.getEmployees(token, idSucursal);

        if (seguir) {
          const empleados: MessengerUser[] = [];
          setUsuariosConocidos((prev) => {
            const next = { ...prev };
            for (const u of lista) {
              next[u.id] = u;
            }
            return next;
          });

          for (const u of lista) {
            if (!yo?.id || u.id !== yo.id) {
              empleados.push(u);
            }
          }

          setUsuarios(empleados);
        }
      } catch {
        if (seguir) {
          setError('No se pudieron cargar los empleados');
        }
      } finally {
        if (seguir) setCargando(false);
      }
    }

    cargar();

    return () => { seguir = false; };
  }, [open, token, sucursal, yo?.id, puedeCrear]);

  // Marcamos o quitamos un empleado
  function marcar(id: number) {
    const lista = [...elegidos];
    const pos = lista.indexOf(id);

    if (pos === -1) {
      lista.push(id);
    } else {
      lista.splice(pos, 1);
    }

    setElegidos(lista);
  }
  // Creamos el grupo con los empleados elegidos
  async function crearGrupo() {
    if (!token || !puedeCrear || cargando || creando) return;
    if (nombre.trim() === '' || nombre.length > 100 || elegidos.length === 0) return;

    setCreando(true);
    setError('');

    try {
      const grupo = await messengerService.createGroup(token, {
        name: nombre.trim(),
        memberIds: elegidos
      });

      onClose();
      onCreated(grupo);
    } catch {
      setError('No se pudo crear el grupo');
    } finally {
      setCreando(false);
    }
  }

  function subtituloUsuario(u: MessengerUser) {
    const rol = (u.role ? labelsMap.roles[u.role.toLowerCase()] || u.role : '') || u.department || '';
    const sucursalNombre = u.branchName?.trim() || '';
    const partes = [rol, sucursalNombre].filter(Boolean);
    return partes.length > 0 ? partes.join(' • ') : u.username;
  }

  if (!puedeCrear) return null;

  return (
    <Dialog open={open} onOpenChange={(abierto) => {
      if (!abierto && !creando) onClose();
    }}>
      <DialogContent width="95%" maxHeight="85vh" className="max-w-lg">
        <DialogTitle>Nuevo Grupo</DialogTitle>

        <div>
          <p className="mb-2 text-sm">Nombre del grupo</p>
          <Input
            value={nombre}
            maxLength={100}
            placeholder="Nombre del grupo"
            disabled={creando}
            onChange={(e) => setNombre(e.target.value)}
          />
        </div>

        <div>
          <p className="mb-2 text-sm">Sucursal</p>
          <select
            className="w-full rounded-md border p-2 text-sm"
            value={sucursal}
            disabled={creando}
            onChange={(e) => setSucursal(e.target.value)}
          >
            <option value="">Todas las sucursales</option>

            {sucursales?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm">Participantes</p>
            <span className="text-xs text-gray-500">
              Seleccionados: {elegidos.length}
            </span>
          </div>

          {elegidos.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 rounded-md border border-slate-100 bg-slate-50 p-2">
              {elegidos.map((id) => {
                const u = usuariosConocidos[id];
                const nom = u
                  ? [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username
                  : `Usuario #${id}`;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-[#ec6200]"
                  >
                    {nom}
                    <button
                      type="button"
                      aria-label={`Quitar a ${nom}`}
                      className="ml-0.5 text-orange-400 hover:text-orange-700"
                      disabled={creando}
                      onClick={() => marcar(id)}
                    >
                      ×
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="max-h-60 overflow-y-auto rounded-md border">
            {cargando && (
              <p className="p-3 text-sm">Cargando empleados...</p>
            )}

            {!cargando && usuarios.length === 0 && !error && (
              <p className="p-3 text-sm">No hay empleados disponibles en esta sucursal</p>
            )}

            {!cargando && usuarios.map((u) => (
              <label
                key={u.id}
                className="flex cursor-pointer items-center gap-3 border-b p-3 hover:bg-gray-50 last:border-b-0"
              >
                <input
                  type="checkbox"
                  checked={elegidos.includes(u.id)}
                  disabled={creando}
                  onChange={() => marcar(u.id)}
                />

                <div>
                  <p className="text-sm font-medium">
                    {[u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.username}
                  </p>
                  <p className="text-xs text-gray-500">
                    {subtituloUsuario(u)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            disabled={creando}
            onClick={onClose}
          >
            Cancelar
          </Button>

          <Button
            disabled={!token || cargando || creando ||
              nombre.trim() === '' || elegidos.length === 0}
            onClick={crearGrupo}
          >
            {creando ? 'Creando...' : 'Crear Grupo'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}