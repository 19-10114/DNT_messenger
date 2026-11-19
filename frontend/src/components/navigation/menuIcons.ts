import {
  ArrowLeftRight,
  BarChart3,
  Bike,
  Boxes,
  ClipboardList,
  CreditCard,
  Home,
  LayoutGrid,
  LifeBuoy,
  LucideIcon,
  MapPin,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';

/** Icono de cada módulo raíz de `MENU_LAYOUT`, por su título. */
const MENU_ICONS: Record<string, LucideIcon> = {
  Inicio: Home,
  Usuarios: Users,
  Inventarios: Boxes,
  Ventas: ShoppingCart,
  'Motos Usadas': Bike,
  GPS: MapPin,
  'Solicitudes Arranca': Truck,
  Reportes: BarChart3,
  Compras: ShoppingBag,
  Transacciones: ArrowLeftRight,
  Gastos: Receipt,
  Pagos: CreditCard,
  Herramientas: Wrench,
  Soporte: LifeBuoy,
};

/** Un módulo nuevo sin icono asignado sale con uno genérico, nunca roto. */
export const getMenuIcon = (rootTitle: string): LucideIcon =>
  MENU_ICONS[rootTitle] ?? (rootTitle ? ClipboardList : LayoutGrid);
