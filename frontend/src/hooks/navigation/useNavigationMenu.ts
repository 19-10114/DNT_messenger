import { useMemo } from 'react';
import {
  BIKES_INVENTORY,
  CLIENTS_HISTORY,
  DELIVERY_NOTES,
  EXPENSES,
  MENU_LAYOUT,
  ORDERS,
  PARTS_INVENTORY,
  SALES_REPORTS,
} from '@/constants/routes';
import {
  filterMenu,
  flattenMenu,
  MenuLeaf,
  MenuNode,
  NavItem,
} from '@/components/navigation/menu.utils';
import {
  useIsStaff,
  useRoles,
  useSuperuser,
  useUser,
} from '@/stores/auth/auth.store';
import { useFavoriteHrefs } from '@/stores/navigation/favoriteModules.store';

/** Cuántas pantallas caben en los accesos rápidos de la isla. */
export const QUICK_ACCESS_LIMIT = 5;

/**
 * Las pantallas del día a día, para quien todavía no marcó favoritas. Las que
 * el usuario no puede ver se saltan; si faltan, se completa en orden del menú.
 */
const DEFAULT_QUICK_HREFS = [
  ORDERS,
  DELIVERY_NOTES,
  BIKES_INVENTORY,
  PARTS_INVENTORY,
  CLIENTS_HISTORY,
  EXPENSES,
  SALES_REPORTS,
];

interface UseNavigationMenuResult {
  /** El menú que el usuario puede ver, en el orden de `MENU_LAYOUT`. */
  menu: MenuNode[];
  /** Todas sus pantallas, sin categorías. */
  leaves: MenuLeaf[];
  /** Favoritas primero; si no llegan al límite, se completa en orden. */
  quickLeaves: MenuLeaf[];
  favoriteHrefs: string[];
  userId: number | undefined;
}

/**
 * El menú de navegación del usuario, ya filtrado por sus roles. Lo comparten
 * la isla, el panel de módulos, el inicio y el buscador.
 */
export const useNavigationMenu = (): UseNavigationMenuResult => {
  const user = useUser();
  const isSuperuser = useSuperuser();
  const isStaff = useIsStaff();
  const roles = useRoles();
  const rolesKey = roles.join(',');
  const favoriteHrefs = useFavoriteHrefs(user?.id);

  const menu = useMemo(
    () =>
      filterMenu(MENU_LAYOUT as NavItem[], {
        isSuperuser: Boolean(isSuperuser),
        isStaff,
        roles: rolesKey ? rolesKey.split(',') : [],
      }),
    [isSuperuser, isStaff, rolesKey]
  );

  const leaves = useMemo(() => flattenMenu(menu), [menu]);

  const quickLeaves = useMemo(() => {
    const candidates = leaves.filter((leaf) => leaf.title !== 'Inicio');
    const favorites = favoriteHrefs
      .map((href) => candidates.find((leaf) => leaf.href === href))
      .filter((leaf): leaf is MenuLeaf => Boolean(leaf));
    const preferred = [...favoriteHrefs, ...DEFAULT_QUICK_HREFS];
    const defaults = DEFAULT_QUICK_HREFS.map((href) =>
      candidates.find((leaf) => leaf.href === href)
    ).filter((leaf): leaf is MenuLeaf => Boolean(leaf));
    const rest = candidates.filter((leaf) => !preferred.includes(leaf.href));

    // Con favoritas, solo ellas (hasta el límite): el usuario ya eligió.
    if (favorites.length > 0) return favorites.slice(0, QUICK_ACCESS_LIMIT);

    return [...defaults, ...rest].slice(0, QUICK_ACCESS_LIMIT);
  }, [leaves, favoriteHrefs]);

  return { menu, leaves, quickLeaves, favoriteHrefs, userId: user?.id };
};
