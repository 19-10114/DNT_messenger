'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button.component';
import { useState } from 'react';
import {
  useIsStaff,
  useSuperuser,
  useSeller,
  useRoles,
} from '@/stores/auth/auth.store';

interface NavItem {
  title: string;
  href: string;
  submenu?: NavItem[];
  requiresAdmin?: boolean;
  /**
   * Solo Super Admin (`isAdmin`), en cualquier nivel del menú. `requiresAdmin`
   * no sirve para esto dentro de un submenú: ahí solo deja pasar a los
   * superusuarios y deja fuera al rol `admin`.
   */
  requiresSuperAdmin?: boolean;
  seller?: boolean;
  cashier?: boolean;
  partsAdmin?: boolean;
  storage?: boolean;
  mainStorage?: boolean;
  manager?: boolean;
  administrator?: boolean;
  mechanic?: boolean;
  finance?: boolean;
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: NavItem[];
}

function SidebarNavItem({
  item,
  level = 0,
}: {
  item: NavItem;
  level?: number;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const userIsSuperUser = useSuperuser();
  const isStaff = useIsStaff();
  const roles = useRoles();

  const isAdmin =
    (userIsSuperUser === true && isStaff === false) || roles.includes('admin');
  const isSeller = useSeller();
  const isCashier = roles.includes('cashier');
  const isAdministrator = roles.includes('administrator');
  const isPartsAdmin = roles.includes('parts_admin');
  const isStorage = roles.includes('storage');
  const isMainStorage = roles.includes('main_storage');
  const isManager = roles.includes('manager');
  const isMechanic = roles.includes('mechanic');
  const isFinance = roles.includes('finance');

  const canView = item.requiresAdmin
    ? level === 0
      ? isAdmin ||
        (item.manager && isManager) ||
        (item.partsAdmin && isPartsAdmin) ||
        (item.administrator && isAdministrator)
      : userIsSuperUser
    : true;

  if (!canView) return null;
  if (item.requiresSuperAdmin && !isAdmin) return null;

  // A user with several roles sees an item when ANY of their restricted roles
  // allows it. Checking each role on its own hid everything not allowed for
  // all of them at once (e.g. manager + seller lost "Inicio").
  const restrictedRoles: [boolean, boolean | undefined][] = [
    [isSeller, item.seller],
    [isCashier, item.cashier],
    [isPartsAdmin, item.partsAdmin],
    [isStorage, item.storage],
    [isMainStorage, item.mainStorage],
    [isManager, item.manager],
    [isAdministrator, item.administrator],
    [isMechanic, item.mechanic],
    [isFinance, item.finance],
  ];
  const userRoleFlags = restrictedRoles.filter(([hasRole]) => hasRole);
  if (
    !isAdmin &&
    userRoleFlags.length > 0 &&
    !userRoleFlags.some(([, allowed]) => allowed)
  ) {
    return null;
  }

  const hasSubmenu = item.submenu && item.submenu.length > 0;
  const isActive = pathname === item.href;

  const paddingLeft = level === 0 ? '' : `${level * 1}rem`;

  if (hasSubmenu) {
    return (
      <div className="flex flex-col">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'lg' }),
            isActive ? 'text-primary hover:bg-muted' : 'hover:bg-muted',
            'justify-start rounded-none flex items-center w-full'
          )}
          style={{
            paddingLeft: level > 0 ? `calc(1rem + ${paddingLeft})` : '1rem',
          }}
        >
          {item.title}
          <span
            className={cn(
              'ml-auto transition-transform duration-200',
              isOpen ? 'rotate-90' : 'rotate-0'
            )}
          >
            →
          </span>
        </button>
        {isOpen && (
          <div className="flex flex-col space-y-1">
            {item.submenu!.map((subItem) => (
              <SidebarNavItem
                key={subItem.href}
                item={subItem}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        buttonVariants({ variant: 'ghost', size: 'lg' }),
        level > 0
          ? buttonVariants({ variant: 'ghost', size: 'sm' })
          : buttonVariants({ variant: 'ghost', size: 'lg' }),
        isActive ? 'text-primary hover:bg-muted' : 'hover:bg-muted',
        'justify-start rounded-none flex items-center w-full'
      )}
      style={{
        paddingLeft: level > 0 ? `calc(1rem + ${paddingLeft})` : '1rem',
      }}
    >
      {item.title}
    </Link>
  );
}

export function SidebarNav({ items }: SidebarNavProps) {
  return (
    <nav className="grow overflow-y-auto flex flex-col lg:space-y-1 py-4">
      {items.map((item) => (
        <SidebarNavItem key={item.href} item={item} />
      ))}
    </nav>
  );
}
