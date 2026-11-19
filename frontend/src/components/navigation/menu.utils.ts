/**
 * Permisos y recorrido del menú (`MENU_LAYOUT`).
 *
 * Las reglas de visibilidad son las mismas que aplicaba `SidebarNavItem` en el
 * menú lateral, sacadas a funciones puras para que la isla, el panel de
 * módulos, el inicio y el buscador vean exactamente lo mismo.
 */

export interface NavItem {
  title: string;
  href: string;
  submenu?: NavItem[];
  requiresAdmin?: boolean;
  /** Solo Super Admin (`isAdmin`), en cualquier nivel del menú. */
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

/** Lo que hace falta saber del usuario para decidir qué ve. */
export interface MenuAccess {
  isSuperuser: boolean;
  isStaff: boolean | undefined;
  roles: string[];
}

/** Rol del backend → bandera de `NavItem` que lo deja pasar. */
const ROLE_FLAGS: [string, keyof NavItem][] = [
  ['seller', 'seller'],
  ['cashier', 'cashier'],
  ['parts_admin', 'partsAdmin'],
  ['storage', 'storage'],
  ['main_storage', 'mainStorage'],
  ['manager', 'manager'],
  ['administrator', 'administrator'],
  ['mechanic', 'mechanic'],
  ['finance', 'finance'],
];

export const isMenuAdmin = ({ isSuperuser, isStaff, roles }: MenuAccess) =>
  (isSuperuser && isStaff === false) || roles.includes('admin');

function canViewItem(item: NavItem, level: number, access: MenuAccess) {
  const { roles, isSuperuser } = access;
  const isAdmin = isMenuAdmin(access);

  // `requiresAdmin` dentro de un submenú solo deja pasar a superusuarios
  // (comportamiento heredado del menú lateral).
  if (item.requiresAdmin) {
    const allowed =
      level === 0
        ? isAdmin ||
          (item.manager && roles.includes('manager')) ||
          (item.partsAdmin && roles.includes('parts_admin')) ||
          (item.administrator && roles.includes('administrator'))
        : isSuperuser;
    if (!allowed) return false;
  }

  if (item.requiresSuperAdmin && !isAdmin) return false;
  if (isAdmin) return true;

  // Con varios roles, el item se ve cuando CUALQUIERA de ellos lo permite.
  // Exigir todos a la vez dejaba a `mechanic,seller` solo con Soporte.
  const userRoleFlags = ROLE_FLAGS.filter(([role]) => roles.includes(role));
  if (userRoleFlags.length === 0) return true;
  return userRoleFlags.some(([, flag]) => Boolean(item[flag]));
}

/** Nodo del menú ya filtrado para el usuario. */
export interface MenuNode {
  /** Ruta de títulos desde la raíz: única aunque se repitan títulos. */
  key: string;
  title: string;
  /** Solo en hojas. */
  href?: string;
  children?: MenuNode[];
}

/**
 * Devuelve el menú que el usuario puede ver. Una categoría que se queda sin
 * hijos visibles desaparece (el menú lateral la mostraba vacía).
 */
export function filterMenu(
  items: NavItem[],
  access: MenuAccess,
  level = 0,
  parentKey = ''
): MenuNode[] {
  return items.flatMap((item): MenuNode[] => {
    if (!canViewItem(item, level, access)) return [];

    const key = parentKey ? `${parentKey}/${item.title}` : item.title;

    if (item.submenu && item.submenu.length > 0) {
      const children = filterMenu(item.submenu, access, level + 1, key);
      return children.length > 0 ? [{ key, title: item.title, children }] : [];
    }

    return [{ key, title: item.title, href: item.href }];
  });
}

/** Una pantalla del menú con los títulos de las categorías que la contienen. */
export interface MenuLeaf {
  key: string;
  title: string;
  href: string;
  /** Títulos de las categorías, de la raíz hacia abajo. */
  parents: string[];
}

export function flattenMenu(
  nodes: MenuNode[],
  parents: string[] = []
): MenuLeaf[] {
  return nodes.flatMap((node) =>
    node.children
      ? flattenMenu(node.children, [...parents, node.title])
      : [{ key: node.key, title: node.title, href: node.href!, parents }]
  );
}

/** El nombre de una pantalla dentro de su categoría raíz ("Productos · Motos"). */
export const leafLabel = (leaf: MenuLeaf) =>
  [...leaf.parents.slice(1), leaf.title].join(' · ');

const toPathname = (href: string) => href.split('?')[0];

/**
 * La pantalla del menú que corresponde a `pathname`: la coincidencia exacta o,
 * si no hay, la de ruta más larga que la contenga (el detalle de una orden
 * cae en "Órdenes").
 */
export function findLeafForPath(
  leaves: MenuLeaf[],
  pathname: string
): MenuLeaf | undefined {
  let best: MenuLeaf | undefined;

  for (const leaf of leaves) {
    const path = toPathname(leaf.href);
    if (path === '#' || path === '/dashboard') continue;
    if (pathname === path) return leaf;
    if (
      pathname.startsWith(`${path}/`) &&
      (!best || path.length > toPathname(best.href).length)
    ) {
      best = leaf;
    }
  }

  return best;
}
