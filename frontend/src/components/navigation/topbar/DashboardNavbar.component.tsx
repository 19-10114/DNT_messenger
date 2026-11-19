'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ChevronRight, Mail, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DASHBOARD } from '@/constants/routes';
import { findLeafForPath } from '@/components/navigation/menu.utils';
import { getMenuIcon } from '@/components/navigation/menuIcons';
import { BranchSelector } from '@/components/navigation/branchSelector/BranchSelector.component';
import { ExchangeRate } from '@/components/dashBoard/ExchangeRate.component';
import { SupportButton } from '@/components/support/supportButton.component';
import { messengerService } from '@/services/messenger/messenger.service';
import { countUnreadConversations } from '@/lib/messenger/conversation.utils';
import { useToken, useUser } from '@/stores/auth/auth.store';
import { useNavigationMenu } from '@/hooks/navigation/useNavigationMenu';
import { CommandSearch, CommandSearchTrigger } from './CommandSearch.component';
import { ModulesPanel } from './ModulesPanel.component';
import { NavbarAvatar } from './NavbarAvatar.component';

const toPathname = (href: string) => href.split('?')[0];

/** Dónde está el usuario: Inicio › Gastos › Retenciones. */
function Breadcrumb() {
  const pathname = usePathname() ?? '';
  const { leaves } = useNavigationMenu();

  const current = useMemo(
    () => findLeafForPath(leaves, pathname),
    [leaves, pathname]
  );

  const crumbs = current ? [...current.parents, current.title] : [];

  return (
    <nav
      aria-label="Ubicación"
      className="flex min-w-0 items-center gap-1 text-xs text-neutral-400"
    >
      <Link
        href={DASHBOARD}
        className={cn(
          'shrink-0 rounded-full px-1.5 py-0.5 transition-colors hover:text-white',
          crumbs.length === 0 && 'font-semibold text-white'
        )}
      >
        Inicio
      </Link>
      {crumbs.map((crumb, index) => (
        <span key={`${crumb}-${index}`} className="flex min-w-0 items-center">
          <ChevronRight className="h-3 w-3 shrink-0 text-neutral-600" />
          <span
            aria-current={index === crumbs.length - 1 ? 'page' : undefined}
            className={cn(
              'truncate px-1.5',
              index === crumbs.length - 1 && 'font-semibold text-white'
            )}
          >
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

/** Accesos rápidos: las favoritas del usuario o, si no hay, las de siempre. */
function QuickAccess() {
  const pathname = usePathname();
  const { quickLeaves, favoriteHrefs } = useNavigationMenu();

  return (
    <div className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {favoriteHrefs.length === 0 && (
        <span
          className="mr-1 hidden shrink-0 items-center gap-1 text-[11px] text-neutral-500 2xl:flex"
          title="Marca con la estrella tus pantallas en Módulos"
        >
          <Star className="h-3 w-3" />
          Accesos rápidos
        </span>
      )}
      {quickLeaves.map((leaf) => {
        const Icon = getMenuIcon(leaf.parents[0] ?? leaf.title);
        const isActive = pathname === toPathname(leaf.href);

        return (
          <Link
            key={leaf.key}
            href={leaf.href}
            title={[...leaf.parents, leaf.title].join(' › ')}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary',
              isActive
                ? 'bg-secondary text-white'
                : 'text-neutral-300 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon
              className={cn(
                'h-3.5 w-3.5',
                isActive ? 'text-white' : 'text-secondary'
              )}
            />
            {leaf.title}
          </Link>
        );
      })}
    </div>
  );
}

/**
 * Barra superior tipo isla del dashboard; sustituye al menú lateral.
 *
 * Arriba: logo (vuelve al inicio), el panel de Módulos con todo el menú, el
 * buscador `Ctrl+K`, las tasas, soporte, la sucursal y la cuenta. Abajo (desde
 * `md`): volver, los accesos rápidos y dónde está el usuario.
 */
export function DashboardNavbar() {
  const router = useRouter();
  const user = useUser();
  const token = useToken();
  const [sinLeer, setSinLeer] = useState(0);

  // Revisamos los mensajes pendientes cada 5 segundos
  useEffect(() => {
    if (!token) {
      setSinLeer(0);
      return;
    }

    let seguir = true;

    async function cargarPendientes() {
      try {
        const chats = await messengerService.getConversations(token);
        const total = countUnreadConversations(chats, user?.id);

        if (seguir) {
          setSinLeer(total);
        }
      } catch {
        // Si falla la consulta, dejamos el contador como estaba
      }
    }

    cargarPendientes();

    const intervalo = setInterval(cargarPendientes, 5000);
    const alActualizar = () => { void cargarPendientes(); };
    window.addEventListener('mc_reads_updated', alActualizar);

    return () => {
      seguir = false;
      clearInterval(intervalo);
      window.removeEventListener('mc_reads_updated', alActualizar);
    };
  }, [token, user?.id]);

  return (
    <header className="mx-auto max-w-[1600px] rounded-2xl bg-neutral-950 text-white shadow-xl shadow-neutral-950/20 ring-1 ring-white/10">
      <nav className="flex h-16 items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link
          href={DASHBOARD}
          aria-label="Ir al inicio"
          className="shrink-0 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <Image
            src="/moto-candela-logo2.png"
            alt="Moto Candela"
            width={800}
            height={312}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <span className="hidden h-6 w-px bg-white/10 sm:block" />

        <ModulesPanel />

        <div className="flex-1" />

        <CommandSearchTrigger />

        <div className="hidden items-center lg:flex">
          <ExchangeRate />
        </div>

        <SupportButton />
        <Link
          href="/dashboard/messenger"
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/10"
          aria-label="Abrir mensajería"
          title="Mensajería"
        >
          <Mail className="h-5 w-5" />

          {sinLeer > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
              {sinLeer}
            </span>
          )}
        </Link>

        <div className="hidden md:block">
          <BranchSelector />
        </div>

        <NavbarAvatar />
      </nav>

      <div className="hidden h-11 items-center gap-3 border-t border-white/10 px-3 sm:px-4 md:flex">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Volver"
          className="shrink-0 rounded-full p-1.5 text-neutral-400 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1">
          <QuickAccess />
        </div>

        <div className="hidden min-w-0 max-w-[40%] lg:block">
          <Breadcrumb />
        </div>
      </div>

      <CommandSearch />
    </header>
  );
}
