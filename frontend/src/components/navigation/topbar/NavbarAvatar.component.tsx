'use client';

import Link from 'next/link';
import { LifeBuoy, LogOut, MessageSquare, Settings, User } from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar.component';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SUPPORT } from '@/constants/routes';
import { useSignOut } from '@/hooks/useSignOut';
import { useIsStaff, useSuperuser, useUser } from '@/stores/auth/auth.store';
import { useSupportDialogActions } from '@/stores/support/supportDialog.store';

/**
 * Cuenta del usuario en la isla: solo el avatar, con el nombre, el perfil,
 * soporte y cerrar sesión dentro del desplegable.
 */
export function NavbarAvatar() {
  const user = useUser();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const signOut = useSignOut();
  const { openReportDialog } = useSupportDialogActions();

  const isAdmin = isSuperuser === true && isStaff === false;
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  const initials = `${user?.firstName?.charAt(0) ?? ''}${
    user?.lastName?.charAt(0) ?? ''
  }`.toUpperCase();

  return (
    // No modal: abre el formulario de soporte (un Dialog), y Radix, en
    // versiones distintas para Menu y Dialog, deja el body con
    // pointer-events: none si un modal se abre desde otro modal.
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        aria-label="Mi cuenta"
        className="rounded-full ring-2 ring-white/15 transition-shadow hover:ring-secondary focus:outline-none focus-visible:ring-secondary"
      >
        <Avatar className="h-9 w-9">
          <AvatarImage
            src={
              fullName
                ? `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    fullName
                  )}&background=ec6200&color=fff&bold=true`
                : undefined
            }
            alt={fullName || 'Mi cuenta'}
          />
          <AvatarFallback className="bg-secondary text-xs font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" sideOffset={10} className="w-60">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-semibold">
            {fullName || 'Mi cuenta'}
          </p>
          {user?.branch?.name && (
            <p className="truncate text-xs text-neutral-500">
              {user.branch.name}
            </p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/user/profile">
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </Link>
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/dashboard/edit-carousel">
                <Settings className="mr-2 h-4 w-4" />
                <span>Gestionar Carrusel</span>
              </Link>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => openReportDialog()}>
            <LifeBuoy className="mr-2 h-4 w-4" />
            <span>Reportar un problema</span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={SUPPORT}>
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Mis reportes</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4 text-destructive" />
            <span className="text-destructive">Cerrar sesión</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
