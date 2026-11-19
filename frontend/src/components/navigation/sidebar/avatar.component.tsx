'use client';
import {
  LifeBuoy,
  LogOut,
  MessageSquare,
  MoreVertical,
  Settings,
  User,
} from 'lucide-react';
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
import Link from 'next/link';
import {
  logoutUser,
  useAuthActions,
  useAuthService,
  useAuthStore,
  useIsStaff,
  useSuperuser,
} from '@/stores/auth/auth.store';
import React from 'react';
import { useRouter } from 'next/navigation';
import { SUPPORT } from '@/constants/routes';
import { useSupportDialogActions } from '@/stores/support/supportDialog.store';

export function SidebarAvatar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { setUser } = useAuthActions();
  const authService = useAuthService();
  const [initials, setInitials] = React.useState('AA');
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const isAdmin = isSuperuser === true && isStaff === false;
  const { openReportDialog } = useSupportDialogActions();

  const handleLogout = async () => {
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

  React.useEffect(() => {
    if (user) {
      setInitials(
        `${user?.firstName?.charAt(0) ?? ''} ${
          user?.lastName?.charAt(0) ?? ''
        }`.trim()
      );
    }
  }, [user]);
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t">
      <div className="space-x-2 flex items-center">
        <Avatar>
          <AvatarImage
            src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
            alt={initials}
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>

        <p className="text-slate-700">
          {user?.firstName} {user?.lastName}
        </p>
      </div>

      {/* No modal: este menú abre el formulario de soporte (un Dialog), y
          Radix, en versiones distintas para Menu y Dialog, deja el body con
          pointer-events: none si un modal se abre desde otro modal. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger>
          <MoreVertical className="w-5 h-5" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
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

            <DropdownMenuItem onSelect={() => handleLogout()}>
              <LogOut className="mr-2 h-4 w-4 text-destructive" />
              <span className="text-destructive">Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
