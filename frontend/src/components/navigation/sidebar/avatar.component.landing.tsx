'use client';
import { LogOut, MoreVertical, User } from 'lucide-react';
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
  useAuthActions,
  useAuthService,
  useAuthStore,
} from '@/stores/auth/auth.store';
import React from 'react';
import { useRouter } from 'next/navigation';

export function SidebarAvatar() {
  const { user } = useAuthStore();
  const router = useRouter();
  const { setUser } = useAuthActions();
  const authService = useAuthService();
  const [initials, setInitials] = React.useState('AA');

  const handleLogout = async () => {
    try {
      if (!user) return;
      await authService.logout(user.token);
      localStorage.removeItem('TOKEN');
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
    <div className="flex items-center justify-between px-4 py-2">
      <div className="space-x-2 flex items-center text-black">
        <Avatar>
          <AvatarImage
            src={`https://ui-avatars.com/api/?name=${user?.firstName}+${user?.lastName}`}
            alt={initials}
          />
          <AvatarFallback></AvatarFallback>
        </Avatar>

        <p className="text-slate-700 text-white">
          {user?.firstName} {user?.lastName}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <MoreVertical className="w-10 h-10 text-white" />
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
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
